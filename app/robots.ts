import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'

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