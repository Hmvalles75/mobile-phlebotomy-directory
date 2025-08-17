import './globals.css'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Mobile Phlebotomy Directory | Find At-Home Blood Draw Services',
    template: '%s | MobilePhlebotomy.org'
  },
  description: 'Find certified mobile phlebotomy services near you. Professional at-home blood draws, lab collections, and mobile health services nationwide.',
  keywords: 'mobile phlebotomy, at-home blood draw, mobile lab services, home blood test, phlebotomist near me',
  authors: [{ name: 'MobilePhlebotomy.org' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'MobilePhlebotomy.org',
    title: 'Mobile Phlebotomy Directory | Find At-Home Blood Draw Services',
    description: 'Find certified mobile phlebotomy services near you. Professional at-home blood draws, lab collections, and mobile health services nationwide.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mobile Phlebotomy Directory | Find At-Home Blood Draw Services',
    description: 'Find certified mobile phlebotomy services near you. Professional at-home blood draws, lab collections, and mobile health services nationwide.',
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
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://mobilephlebotomy.org",
    "logo": `${process.env.NEXT_PUBLIC_SITE_URL || "https://mobilephlebotomy.org"}/logo.png`,
    "description": "The nation's largest directory of mobile phlebotomy services. Find certified, insured providers for at-home blood draws and lab collections near you.",
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
      </head>
      <body className={inter.className}>
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