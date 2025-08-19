import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute per IP

export function middleware(request: NextRequest) {
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