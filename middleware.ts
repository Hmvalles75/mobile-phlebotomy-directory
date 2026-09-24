import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMetroBySlug } from '@/data/top-metros'
import { metroHref } from '@/lib/seo/metroCanonical'

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute per IP

// State abbreviation to slug mapping
const stateAbbrToSlug: Record<string, string> = {
  'al': 'alabama', 'ak': 'alaska', 'az': 'arizona', 'ar': 'arkansas',
  'ca': 'california', 'co': 'colorado', 'ct': 'connecticut', 'de': 'delaware',
  'fl': 'florida', 'ga': 'georgia', 'hi': 'hawaii', 'id': 'idaho',
  'il': 'illinois', 'in': 'indiana', 'ia': 'iowa', 'ks': 'kansas',
  'ky': 'kentucky', 'la': 'louisiana', 'me': 'maine', 'md': 'maryland',
  'ma': 'massachusetts', 'mi': 'michigan', 'mn': 'minnesota', 'ms': 'mississippi',
  'mo': 'missouri', 'mt': 'montana', 'ne': 'nebraska', 'nv': 'nevada',
  'nh': 'new-hampshire', 'nj': 'new-jersey', 'nm': 'new-mexico', 'ny': 'new-york',
  'nc': 'north-carolina', 'nd': 'north-dakota', 'oh': 'ohio', 'ok': 'oklahoma',
  'or': 'oregon', 'pa': 'pennsylvania', 'ri': 'rhode-island', 'sc': 'south-carolina',
  'sd': 'south-dakota', 'tn': 'tennessee', 'tx': 'texas', 'ut': 'utah',
  'vt': 'vermont', 'va': 'virginia', 'wa': 'washington', 'wv': 'west-virginia',
  'wi': 'wisconsin', 'wy': 'wyoming', 'dc': 'washington-dc'
}

// Metro slug remaps — metros that were renamed. Keys are the OLD URL slug
// (captured by Google before the rename), values are the current slug.
const METRO_REMAP: Record<string, string> = {
  'new-york-metro': 'new-york-city',
}

// Page routes are lowercase by construction (state/city slugs, provider slugs:
// zero uppercase slugs in the DB as of 2026-09-24). Next matches static
// segments case-insensitively, so /US/ohio and /PROVIDER/x served 200 twins of
// the lowercase page; dynamic params are looked up as-is, so /us/Ohio 404'd.
// One 301 to the lowercase path closes both. Assets, API and Next internals
// are left alone: their names are case-sensitive on disk.
function isPageRoute(pathname: string): boolean {
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) return false
  if (/\.[a-z0-9]{1,8}$/i.test(pathname)) return false   // anything with a file extension
  return true
}

// Placeholder provider slug pattern — /provider/provider-123 etc. These were
// never real listings; we return 410 Gone so Google drops them permanently
// instead of treating them as transient 404s.
const PLACEHOLDER_PROVIDER_SLUG = /^provider-\d+$/

// The production Vercel alias got indexed as a full duplicate of the site —
// ToS, Florida city pages and provider profiles all appear under
// site:mobile-phlebotomy-directory.vercel.app. Every one of those competes with
// its www twin. Preview deployments are a different problem: they must stay
// reachable for review, so they get noindex rather than a redirect.
const PROD_VERCEL_ALIAS = 'mobile-phlebotomy-directory.vercel.app'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Host handling runs before any path logic so a duplicate host can never be
  // served real content. The apex (mobilephlebotomy.org) is deliberately NOT
  // handled here — Vercel's platform-level domain redirect answers it before
  // middleware runs, and adding a second rule would only create a redirect
  // chain without changing the status code Vercel emits.
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0]

  if (host === PROD_VERCEL_ALIAS) {
    const url = new URL(request.nextUrl.toString())
    url.protocol = 'https:'
    url.host = 'www.mobilephlebotomy.org'
    url.port = ''
    // 308 preserves the method and tells Google to transfer signals to the
    // canonical host permanently.
    return NextResponse.redirect(url, 308)
  }

  if (host.endsWith('.vercel.app')) {
    // Preview deployment — keep it reachable, keep it out of the index.
    const previewResponse = NextResponse.next()
    previewResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return previewResponse
  }

  // Redirect common 404 patterns to homepage
  const invalidPatterns = [
    /\/undefined/i,
    /\/null/i,
    /\/favicon\.ico$/,
    /\/\.well-known\//,
    /\/wp-admin/,
    /\/wp-login/,
    /\/xmlrpc\.php/,
    /\/\.env/,
    /\/config\./,
    /\/\.git/,
  ]

  if (invalidPatterns.some(pattern => pattern.test(pathname))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url, 301)
  }

  // 410 Gone for placeholder provider slugs (/provider/provider-123 etc.)
  // Signals to Google these are permanently removed and speeds up de-indexing.
  if (pathname.startsWith('/provider/')) {
    const slug = pathname.replace('/provider/', '').replace(/\/$/, '')
    if (PLACEHOLDER_PROVIDER_SLUG.test(slug)) {
      return new NextResponse('This provider listing has been permanently removed.', {
        status: 410,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
  }

  // /providers/claim?id=* — drop the legacy id query param.
  // Google indexed these under the old routing; the current claim flow uses
  // the path alone with no query params.
  if (pathname === '/providers/claim' && request.nextUrl.searchParams.has('id')) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('id')
    return NextResponse.redirect(url, 301)
  }

  // Every path normalisation below works on one candidate and redirects once,
  // so /us/OH/Columbus resolves to /us/ohio/columbus in a single hop instead
  // of lowercase -> abbreviation -> city as three.
  let needsRedirect = false
  let working = pathname
  if (isPageRoute(pathname) && pathname !== pathname.toLowerCase()) {
    working = pathname.toLowerCase()
    needsRedirect = true
  }

  // /us/metro/{slug}-metro and explicit renames (new-york-metro -> new-york-city).
  // Resolve straight to the metro's canonical page via metroHref(): for 46 of
  // 48 that is the city page, so /us/metro/houston-metro lands on
  // /us/texas/houston in one hop rather than bouncing off /us/metro/houston
  // (which next.config now 308s).
  if (working.startsWith('/us/metro/')) {
    const slug = working.replace('/us/metro/', '').replace(/\/$/, '')
    let newSlug: string | null = METRO_REMAP[slug] || null
    if (!newSlug && slug.endsWith('-metro')) {
      newSlug = slug.slice(0, -'-metro'.length)
    }
    if (newSlug && newSlug !== slug) {
      const metro = getMetroBySlug(newSlug)
      working = metro ? metroHref(metro) : `/us/metro/${newSlug}`
      needsRedirect = true
    }
  }

  // Handle state/city URL redirects
  if (working.startsWith('/us/') && !working.startsWith('/us/metro/')) {
    const parts = working.split('/')
    let newPathname = working

    // Handle state abbreviations or spaces in state names (e.g., /us/tx or /us/new%20york)
    if (parts.length >= 3) {
      const stateParam = parts[2]
      const stateParamLower = decodeURIComponent(stateParam).toLowerCase()

      // Check if it's a state abbreviation
      const stateSlug = stateAbbrToSlug[stateParamLower]
      if (stateSlug) {
        parts[2] = stateSlug
        needsRedirect = true
      }
      // Check if state has spaces that need to be converted to hyphens
      else if (stateParam.includes('%20') || stateParam.includes(' ')) {
        parts[2] = stateParamLower.replace(/\s+/g, '-')
        needsRedirect = true
      }
    }

    // Handle city names with special characters (e.g., st.-petersburg → st-petersburg)
    if (parts.length >= 4) {
      const cityParam = parts[3]
      const decodedCity = decodeURIComponent(cityParam)

      // Normalize city names: remove periods, apostrophes, convert spaces to hyphens
      const normalizedCity = decodedCity
        .toLowerCase()
        .replace(/\./g, '')  // Remove periods
        .replace(/'/g, '')   // Remove apostrophes
        .replace(/\s+/g, '-')  // Convert spaces to hyphens
        .replace(/[^a-z0-9-]/g, '-')  // Replace any other special chars with hyphens
        .replace(/-+/g, '-')  // Collapse multiple hyphens
        .replace(/(^-|-$)/g, '')  // Remove leading/trailing hyphens

      if (normalizedCity !== cityParam) {
        parts[3] = normalizedCity
        needsRedirect = true
      }
    }

    newPathname = parts.join('/')
    if (newPathname !== working) {
      working = newPathname
      needsRedirect = true
    }
  }

  if (needsRedirect && working !== pathname) {
    const url = request.nextUrl.clone()   // keeps the query string
    url.pathname = working
    return NextResponse.redirect(url, 301)  // Permanent redirect
  }

  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = [
      'https://mobilephlebotomy.org',
      'https://www.mobilephlebotomy.org',
      process.env.NEXT_PUBLIC_SITE_URL,
    ].filter(Boolean)
    
    // In development, allow localhost
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000')
    }
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
    
    // Basic rate limiting for API routes
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
    const now = Date.now()
    
    // Clean up old entries
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.timestamp > RATE_LIMIT_WINDOW) {
        rateLimitMap.delete(key)
      }
    }
    
    // Check rate limit
    const rateLimitKey = `${ip}:${request.nextUrl.pathname}`
    const rateLimit = rateLimitMap.get(rateLimitKey)
    
    if (rateLimit) {
      if (now - rateLimit.timestamp < RATE_LIMIT_WINDOW) {
        if (rateLimit.count >= MAX_REQUESTS) {
          return new Response(
            JSON.stringify({ error: 'Too many requests. Please try again later.' }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil((RATE_LIMIT_WINDOW - (now - rateLimit.timestamp)) / 1000))
              }
            }
          )
        }
        rateLimit.count++
      } else {
        rateLimitMap.set(rateLimitKey, { count: 1, timestamp: now })
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, timestamp: now })
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}