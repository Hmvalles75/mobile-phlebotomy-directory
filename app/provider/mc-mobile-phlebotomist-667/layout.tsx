import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomist Services | Find At-Home Blood Draw Near You',
  description: 'Find certified mobile phlebotomists who come to your location. Browse verified providers offering convenient at-home blood draws and lab services. Available 7 days a week across the US.',
  keywords: [
    'mobile phlebotomist',
    'at-home blood draw',
    'mobile blood test',
    'phlebotomy services',
    'home blood collection',
    'mobile lab services',
    'at-home phlebotomy',
    'blood draw near me',
    'mobile blood draw service',
    'home health phlebotomy'
  ].join(', '),
  openGraph: {
    title: 'Mobile Phlebotomist Services | Find At-Home Blood Draw Near You',
    description: 'Find certified mobile phlebotomists who come to your location. Browse verified providers offering convenient at-home blood draws and lab services.',
    type: 'website',
    url: '/provider/mc-mobile-phlebotomist-667'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mobile Phlebotomist Services | Find At-Home Blood Draw Near You',
    description: 'Find certified mobile phlebotomists who come to your location. Browse verified providers offering convenient at-home blood draws and lab services.'
  },
  alternates: {
    canonical: '/provider/mc-mobile-phlebotomist-667'
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
  }
}

export default function MobilePhlebotomistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'Mobile Phlebotomist Services',
    description: 'Find certified mobile phlebotomists who provide at-home blood draw services across the United States',
    url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/provider/mc-mobile-phlebotomist-667` : 'https://mobilephlebotomy.org/provider/mc-mobile-phlebotomist-667',
    medicalSpecialty: 'Phlebotomy',
    serviceType: ['Mobile Phlebotomy', 'At-Home Blood Draw', 'Mobile Lab Services'],
    areaServed: {
      '@type': 'Country',
      name: 'United States'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Mobile Phlebotomy Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'MedicalProcedure',
            name: 'At-Home Blood Draw',
            description: 'Professional blood collection services at your location'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'MedicalProcedure',
            name: 'Mobile Blood Test',
            description: 'Laboratory testing with convenient at-home specimen collection'
          }
        }
      ]
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Mobile Phlebotomist Services',
        item: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/provider/mc-mobile-phlebotomist-667` : 'https://mobilephlebotomy.org/provider/mc-mobile-phlebotomist-667'
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  )
}
