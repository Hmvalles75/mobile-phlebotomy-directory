'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import InlineLeadForm from '@/components/InlineLeadForm'
import CityIntentVariantLinks from '@/components/CityIntentVariantLinks'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import CityFAQ from '@/components/seo/CityFAQ'
import CityBreadcrumb from '@/components/seo/CityBreadcrumb'

export default function StatenIslandInHomeBloodDraw() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({ city: 'Staten Island', state: 'NY', grouped: 'true' })
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
      <CityBreadcrumb citySlug="staten-island-ny" cityShort="Staten Island" variant="in-home-blood-draw" />
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">In-Home Blood Draw Services in Staten Island, NY</h1>
          <p className="text-xl text-primary-100">Professional in-home blood draw services in Staten Island — request same-day or next-day availability.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <InlineLeadForm city="Staten Island" state="NY" />

        {!loading && providers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Mobile Phlebotomists Serving Staten Island</h2>
            <div className="space-y-6">
              {providers.slice(0, 5).map(provider => (
                <div key={provider.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/provider/${provider.slug}`} className="text-xl font-bold text-gray-900 hover:text-primary-600">{provider.name}</Link>
                    {(provider as any).isFeatured && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Featured</span>}
                  </div>
                  {provider.description && <p className="text-gray-600 mb-3 line-clamp-2">{provider.description}</p>}
                  <ProviderActions provider={provider} currentLocation="Staten Island, NY" variant="compact" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">About In-Home Blood Draw Services in Staten Island</h2>
          <p className="text-gray-700 leading-relaxed">Licensed phlebotomists come to your Staten Island-area location for convenient in-home blood draw services. Services include routine lab work, drug testing, wellness panels, and specialty collections. Same-day and next-day appointments are typically available throughout the Staten Island area.</p>
        </div>

        <CityFAQ cityName="Staten Island, NY" cityShort="Staten Island" variant="in-home-blood-draw" />

        <CityIntentVariantLinks citySlug="staten-island-ny" cityName="Staten Island, NY" current="in-home-blood-draw" />
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Staten Island" defaultState="NY" defaultZip="" />
    </div>
  )
}
