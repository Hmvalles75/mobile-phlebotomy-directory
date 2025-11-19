import './globals.css'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { SITE_URL, absoluteUrl } from '@/lib/seo'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Mobile Phlebotomy Near You | At-Home Blood Draw Directory (Updated 2025)',
    template: '%s | MobilePhlebotomy.org'
  },
  description: 'Find certified mobile phlebotomists in your area today! Book same-day at-home blood draws. 500+ verified providers nationwide. Insurance accepted. Compare prices & reviews.',
  keywords: 'mobile phlebotomy, at-home blood draw, mobile lab services, home blood test, phlebotomist near me',
  authors: [{ name: 'MobilePhlebotomy.org' }],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'MobilePhlebotomy.org',
    title: 'Mobile Phlebotomy Near You | At-Home Blood Draw Directory (Updated 2025)',
    description: 'Find certified mobile phlebotomists in your area today! Book same-day at-home blood draws. 500+ verified providers nationwide. Insurance accepted. Compare prices & reviews.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mobile Phlebotomy Near You | At-Home Blood Draw Directory (Updated 2025)',
    description: 'Find certified mobile phlebotomists in your area today! Book same-day at-home blood draws. 500+ verified providers nationwide. Insurance accepted. Compare prices & reviews.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MobilePhlebotomy.org",
    "url": SITE_URL,
    "logo": absoluteUrl("/logo-new.png"),
    "description": "A national directory of mobile phlebotomy services. Find certified, insured providers for at-home blood draws and lab collections near you.",
    "foundingDate": "2024",
    "serviceType": "Medical Directory Service",
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Mobile Phlebotomy Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "At-Home Blood Draw",
            "description": "Professional blood collection services at your location"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Corporate Wellness",
            "description": "Mobile phlebotomy services for businesses and organizations"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Mobile Lab Services",
            "description": "Complete laboratory collection services at your location"
          }
        }
      ]
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://www.facebook.com/mobilephlebotomy",
      "https://www.linkedin.com/company/mobilephlebotomy"
    ]
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="POWVkQbxx+tXzSQd0J2tOw" async></script>
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}