// Temporary script to generate remaining Detroit suburb pages
// Run with: npx tsx scripts/generate-detroit-suburbs.ts

import fs from 'fs'
import path from 'path'

const suburbs = [
  { name: 'Livonia', slug: 'livonia-mi', nearby: ['Detroit', 'Dearborn', 'Farmington Hills', 'Westland', 'Redford', 'All Wayne County'] },
  { name: 'Troy', slug: 'troy-mi', nearby: ['Detroit', 'Royal Oak', 'Sterling Heights', 'Birmingham', 'Rochester', 'All Oakland County'] },
  { name: 'Southfield', slug: 'southfield-mi', nearby: ['Detroit', 'Farmington Hills', 'Oak Park', 'Lathrup Village', 'All Oakland County'] },
  { name: 'Warren', slug: 'warren-mi', nearby: ['Detroit', 'Sterling Heights', 'Madison Heights', 'Roseville', 'All Macomb County'] }
]

suburbs.forEach(suburb => {
  // Generate page.tsx
  const pageTsx = `'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { ga4 } from '@/lib/ga4'

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does mobile phlebotomy cost in ${suburb.name}, MI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomy services in ${suburb.name} typically cost $60-$150 per visit. Lab testing costs are separate. Many insurance plans cover mobile phlebotomy, and Medicare/Medicaid often cover home visits for eligible patients."
      }
    },
    {
      "@type": "Question",
      "name": "What areas of ${suburb.name} do mobile phlebotomists serve?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomists serve all of ${suburb.name} and surrounding communities. Many providers also cover nearby areas including ${suburb.nearby.slice(0, 3).join(', ')}. Coverage areas vary by provider."
      }
    },
    {
      "@type": "Question",
      "name": "How quickly can I get a mobile blood draw in ${suburb.name}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most ${suburb.name} mobile phlebotomy providers offer appointments within 24-48 hours. Some offer same-day service for urgent needs. Evening and weekend appointments are often available."
      }
    },
    {
      "@type": "Question",
      "name": "Does insurance cover mobile phlebotomy in ${suburb.name}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Many insurance plans cover mobile phlebotomy in ${suburb.name} when medically necessary. Medicare and Medicaid typically cover home visits for homebound patients. Verify coverage with your insurance provider before scheduling."
      }
    }
  ]
}

export default function ${suburb.name.replace(/[^a-zA-Z]/g, '')}MobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({
          city: '${suburb.name}',
          state: 'MI',
          grouped: 'true'
        })
        const response = await fetch(\`/api/providers/city?\${params.toString()}\`)
        if (!response.ok) throw new Error('Failed to fetch providers')
        const data = await response.json()
        const allProviders = [
          ...(data.citySpecific || []),
          ...(data.regional || []),
          ...(data.statewide || [])
        ]
        setProviders(allProviders)
      } catch (error) {
        console.error('Error fetching providers:', error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }
    fetchProviders()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Mobile Phlebotomy in ${suburb.name}, MI
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Professional at-home blood draw services in ${suburb.name}. Licensed phlebotomists
              provide convenient lab specimen collection at your home, office, or preferred location.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Request Mobile Phlebotomy in ${suburb.name}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  ga4.leadCtaClick({ placement: '${suburb.slug}_hero' })
                  setLeadFormOpen(true)
                }}
                className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 shadow-md"
              >
                📋 Request a Blood Draw
              </button>
              <a href="tel:+1" className="px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-lg border-2 border-primary-600 hover:bg-primary-50">
                📞 Call a Provider
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {!loading && providers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {providers.length} Provider{providers.length !== 1 ? 's' : ''} Serving ${suburb.name}
              </h2>
              <div className="space-y-4">
                {providers.slice(0, 5).map(provider => (
                  <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{provider.name}</h3>
                    {provider.phone && <p className="text-gray-700 mb-2">📞 {provider.phone}</p>}
                    <ProviderActions provider={provider} currentLocation="${suburb.name}, MI" variant="compact" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Now Serving ${suburb.name} & Nearby Areas</h2>
            <p className="text-gray-700 mb-4">Mobile phlebotomy available in:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/detroit-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Detroit →</Link>
              ${suburb.nearby.filter(n => !n.includes('All ')).slice(0, 5).map(n => {
                const slug = n.toLowerCase().replace(/\s+/g, '-') + '-mi'
                if (['detroit', 'dearborn', 'livonia', 'troy', 'southfield', 'warren'].some(s => slug.startsWith(s))) {
                  return `<Link href="/${slug}/mobile-phlebotomy" className="text-primary-600 hover:underline">${n} →</Link>`
                }
                return `<span className="text-gray-600">${n}</span>`
              }).join('\n              ')}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Expect</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">1. Schedule Appointment</h3>
                <p>Book a convenient time at your ${suburb.name} location. Most providers offer flexible scheduling.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">2. Prepare Your Space</h3>
                <p>Have your lab paperwork ready. The phlebotomist brings all sterile equipment.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">3. Blood Collection</h3>
                <p>Licensed phlebotomist collects your specimen in 15-30 minutes.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">4. Lab Processing</h3>
                <p>Specimens transported to Quest, Labcorp, or your preferred lab.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing & Insurance</h2>
            <p className="text-gray-700 mb-4">
              <strong>Typical Costs:</strong> Mobile phlebotomy in ${suburb.name} costs $60-$150 per visit.
            </p>
            <p className="text-gray-700">
              <strong>Insurance:</strong> Many plans cover mobile phlebotomy when medically necessary.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map((faq, index) => (
                <div key={index} className="pb-6 border-b border-gray-200 last:border-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.name}</h3>
                  <p className="text-gray-700">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="${suburb.name}" defaultState="MI" defaultZip="" />
    </div>
  )
}
`

  // Generate layout.tsx
  const layoutTsx = `import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy ${suburb.name}, MI | At-Home Blood Draws 2026',
  description: 'Mobile phlebotomy services in ${suburb.name}, MI. Licensed phlebotomists provide professional at-home blood draws. Insurance accepted, flexible scheduling.',
  keywords: 'mobile phlebotomy ${suburb.name}, at-home blood draw ${suburb.name} MI, ${suburb.name} mobile blood draw',
  openGraph: {
    title: 'Mobile Phlebotomy in ${suburb.name}, MI',
    description: 'Professional at-home blood draw services in ${suburb.name}. Licensed phlebotomists, convenient scheduling.',
    type: 'website',
    url: 'https://mobilephlebotomy.org/${suburb.slug}/mobile-phlebotomy',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/${suburb.slug}/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
`

  const pageDir = path.join(process.cwd(), 'app', suburb.slug, 'mobile-phlebotomy')
  fs.mkdirSync(pageDir, { recursive: true })
  fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageTsx)
  fs.writeFileSync(path.join(pageDir, 'layout.tsx'), layoutTsx)
  console.log(`✅ Generated ${suburb.name} pages`)
})

console.log('\n🎉 All suburb pages generated successfully!')
