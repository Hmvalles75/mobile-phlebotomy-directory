import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/search',
          '/us/',
          '/saved',
          '/about'
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/'
        ],
        crawlDelay: 1
      },
      {
        userAgent: 'Googlebot',
        allow: '/'
      },
      {
        userAgent: 'Bingbot', 
        allow: '/'
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/'
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  }
}