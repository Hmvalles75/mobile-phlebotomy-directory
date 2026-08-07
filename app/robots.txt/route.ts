import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export function GET() {
  const baseUrl = SITE_URL
  
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}