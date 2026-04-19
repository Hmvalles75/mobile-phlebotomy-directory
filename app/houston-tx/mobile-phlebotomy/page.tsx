'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import InlineLeadForm from '@/components/InlineLeadForm'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import CityIntentVariantLinks from '@/components/CityIntentVariantLinks'
import CityFAQ from '@/components/seo/CityFAQ'

export default function HoustonMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({ city: 'Houston', state: 'TX', grouped: 'true' })
        const response = await fetch(`/api/providers/city?${params.toString()}`)
        if (!response.ok) throw new Error('Failed')
        const data = await response.json()
        setProviders([...(data.citySpecific || []), ...(data.regional || []), ...(data.statewide || [])])
      } catch { setProviders([]) }
      finally { setLoading(false) }
    }
    fetchProviders()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in Houston, TX</h1>
          <p className="text-xl text-primary-100">Professional at-home blood draw services in Houston — request same-day or next-day availability.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <InlineLeadForm city="Houston" state="TX" />

        {!loading && providers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Mobile Phlebotomists Serving Houston</h2>
            <div className="space-y-6">
              {providers.slice(0, 5).map(provider => (
                <div key={provider.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/provider/${provider.slug}`} className="text-xl font-bold text-gray-900 hover:text-primary-600">{provider.name}</Link>
                    {(provider as any).isFeatured && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Featured</span>}
                  </div>
                  {provider.description && <p className="text-gray-600 mb-3 line-clamp-2">{provider.description}</p>}
                  <ProviderActions provider={provider} currentLocation="Houston, TX" variant="compact" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Nearby Areas We Serve</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link key="Katy" href={"/us/texas/katy"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Katy, TX</span>
            </Link>
            <Link key="Sugar Land" href={"/us/texas/sugar-land"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Sugar Land, TX</span>
            </Link>
            <Link key="Cypress" href={"/us/texas/cypress"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Cypress, TX</span>
            </Link>
            <Link key="Spring" href={"/us/texas/spring"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Spring, TX</span>
            </Link>
            <Link key="Pearland" href={"/us/texas/pearland"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Pearland, TX</span>
            </Link>
            <Link key="The Woodlands" href={"/us/texas/the-woodlands"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">The Woodlands, TX</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">About Mobile Phlebotomy in Houston</h2>
          <p className="text-gray-700 leading-relaxed mb-4">Houston is the largest city in Texas and the fourth-largest in the U.S., home to the Texas Medical Center — the world&apos;s largest medical complex. Despite this, many patients across the Houston metro still need blood draws but can&apos;t easily get to a lab, especially in sprawling suburbs like Katy, Cypress, and The Woodlands.</p>
          <p className="text-gray-700 leading-relaxed mb-4">Mobile phlebotomists in Houston typically serve the entire metro area within a 30&ndash;50 mile radius. Services include routine venipuncture for Quest and Labcorp orders, drug and alcohol testing, DOT physicals collections, wellness panels, and specialty draws for clinical trials at MD Anderson and Houston Methodist.</p>
          <p className="text-gray-700 leading-relaxed">Most Houston-area providers charge $60&ndash;$120 per visit for the draw fee, with lab processing billed separately. Medicare patients with homebound documentation typically pay $0&ndash;$25.</p>
        </div>

        <CityFAQ cityName="Houston, TX" cityShort="Houston" variant="mobile-phlebotomy" />

        <CityIntentVariantLinks citySlug="houston-tx" cityName="Houston, TX" current="mobile-phlebotomy" />
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Houston" defaultState="TX" defaultZip="" />
    </div>
  )
}
