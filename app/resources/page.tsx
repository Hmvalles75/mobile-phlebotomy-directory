import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Resources — Guides for Working Phlebotomists',
  description: 'Free guides for mobile phlebotomists: Medicare billing, getting patients, landing contracts, 1099 taxes, building a website, and growing your business. Written by industry professionals.',
  keywords: 'mobile phlebotomy resources, phlebotomist business guide, mobile phlebotomy tips, how to start mobile phlebotomy business, phlebotomy business resources',
  openGraph: {
    title: 'Mobile Phlebotomy Resources — Guides for Working Phlebotomists',
    description: 'Free guides for mobile phlebotomists: Medicare billing, getting patients, landing contracts, 1099 taxes, and more.',
    type: 'website',
  }
}

const resources = [
  {
    href: '/can-mobile-phlebotomists-bill-medicare',
    title: 'Can Mobile Phlebotomists Bill Medicare?',
    description: 'Yes — but only under specific conditions. Learn the CPT codes, homebound requirements, and how to actually get paid by Medicare for mobile blood draws.',
  },
  {
    href: '/how-to-get-patients-as-a-mobile-phlebotomist',
    title: 'How to Get Patients as a Mobile Phlebotomist',
    description: 'The 7 most effective ways to get consistent patients: doctor office partnerships, Google Business Profile, directories like ours, and more.',
  },
  {
    href: '/how-to-get-contracts-mobile-phlebotomy',
    title: 'How to Get Contracts for Mobile Phlebotomy',
    description: 'Step-by-step guide to landing contracts with nursing homes, home health agencies, insurance companies, and clinical trials.',
  },
  {
    href: '/mobile-phlebotomy-1099-contractor',
    title: 'Mobile Phlebotomy as a 1099 Contractor',
    description: 'Tax obligations, deductions, quarterly payments, and business structure for independent mobile phlebotomists. Don\'t leave money on the table.',
  },
  {
    href: '/best-website-builders-mobile-phlebotomy',
    title: 'Best Website Builders for Mobile Phlebotomy',
    description: 'Compare the top website builders for phlebotomy businesses. What to include on your site, SEO basics, and which platforms are worth the money.',
  },
  {
    href: '/for-networks',
    title: 'For Draw Networks & Labs',
    description: 'Need mobile phlebotomists in specific geographies? We connect draw networks, labs, and healthcare organizations with verified providers nationwide.',
  },
]

export default function ResourcesPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mobile Phlebotomy Resources',
    description: 'Free guides and resources for mobile phlebotomists covering Medicare billing, patient acquisition, contracts, taxes, and business growth.',
    url: 'https://www.mobilephlebotomy.org/resources',
    publisher: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      url: 'https://www.mobilephlebotomy.org'
    },
    mainEntity: resources.map(r => ({
      '@type': 'Article',
      name: r.title,
      url: `https://www.mobilephlebotomy.org${r.href}`,
      description: r.description,
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* Hero */}
      <section className="bg-primary-700 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Mobile Phlebotomy Resources
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Practical guides for working mobile phlebotomists. No fluff — just the information you need to grow your business.
          </p>
        </div>
      </section>

      {/* Resource Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2">
            {resources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="group block bg-white border border-gray-200 rounded-xl p-8 hover:border-primary-400 hover:shadow-lg transition-all duration-200"
              >
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 mb-3 transition-colors">
                  {resource.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {resource.description}
                </p>
                <span className="inline-block mt-4 text-primary-600 font-semibold group-hover:translate-x-1 transition-transform">
                  Read guide →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Start Getting Patients?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            List your mobile phlebotomy business on the #1 directory for free. We send you patient leads — no fees, no commission.
          </p>
          <Link
            href="/add-provider"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
          >
            Get Listed Free
          </Link>
        </div>
      </section>
    </div>
  )
}
