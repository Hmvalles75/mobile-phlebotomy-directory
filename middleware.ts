import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Handle state/city URL redirects
  if (pathname.startsWith('/us/')) {
    const parts = pathname.split('/')
    let needsRedirect = false
    let newPathname = pathname

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

    if (needsRedirect) {
      newPathname = parts.join('/')
      const url = request.nextUrl.clone()
      url.pathname = newPathname
      return NextResponse.redirect(url, 301)  // Permanent redirect
    }
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