'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import InlineLeadForm from '@/components/InlineLeadForm'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import CityIntentVariantLinks from '@/components/CityIntentVariantLinks'

export default function CharlotteMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({ city: 'Charlotte', state: 'NC', grouped: 'true' })
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
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in Charlotte, NC</h1>
          <p className="text-xl text-primary-100">Professional at-home blood draw services in Charlotte — request same-day or next-day availability.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <InlineLeadForm city="Charlotte" state="NC" />

        {!loading && providers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Mobile Phlebotomists Serving Charlotte</h2>
            <div className="space-y-6">
              {providers.slice(0, 5).map(provider => (
                <div key={provider.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/provider/${provider.slug}`} className="text-xl font-bold text-gray-900 hover:text-primary-600">{provider.name}</Link>
                    {(provider as any).isFeatured && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Featured</span>}
                  </div>
                  {provider.description && <p className="text-gray-600 mb-3 line-clamp-2">{provider.description}</p>}
                  <ProviderActions provider={provider} currentLocation="Charlotte, NC" variant="compact" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Nearby Areas We Serve</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link key="Concord" href={"/us/north-carolina/concord"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Concord, NC</span>
            </Link>
            <Link key="Gastonia" href={"/us/north-carolina/gastonia"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Gastonia, NC</span>
            </Link>
            <Link key="Huntersville" href={"/us/north-carolina/huntersville"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Huntersville, NC</span>
            </Link>
            <Link key="Matthews" href={"/us/north-carolina/matthews"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Matthews, NC</span>
            </Link>
            <Link key="Mooresville" href={"/us/north-carolina/mooresville"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Mooresville, NC</span>
            </Link>
            <Link key="Mint Hill" href={"/us/north-carolina/mint-hill"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Mint Hill, NC</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">About Mobile Phlebotomy in Charlotte</h2>
          <p className="text-gray-700 leading-relaxed mb-4">Charlotte is the largest city in North Carolina and a major financial hub — Bank of America, Wells Fargo, and Truist are all headquartered here. The city&apos;s rapid growth has pushed residents into suburbs like Concord, Huntersville, and Mooresville, where lab access can be limited. Mobile phlebotomy bridges that gap.</p>
          <p className="text-gray-700 leading-relaxed mb-4">Common services in the Charlotte metro include routine venipuncture for Atrium Health and Novant Health lab orders, corporate wellness screenings for Uptown offices, pre-employment and DOT drug testing for distribution centers along I-85, and home health draws for agencies serving Mecklenburg County.</p>
          <p className="text-gray-700 leading-relaxed">Charlotte-area mobile phlebotomy visits typically cost $60&ndash;$120. North Carolina does not require a separate phlebotomy license, but all providers on our platform carry relevant clinical certifications.</p>
        </div>

        <CityIntentVariantLinks citySlug="charlotte-nc" cityName="Charlotte, NC" current="mobile-phlebotomy" />
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Charlotte" defaultState="NC" defaultZip="" />
    </div>
  )
}
