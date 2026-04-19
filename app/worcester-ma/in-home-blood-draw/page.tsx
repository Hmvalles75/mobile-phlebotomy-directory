'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import InlineLeadForm from '@/components/InlineLeadForm'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import CityIntentVariantLinks from '@/components/CityIntentVariantLinks'
import CityFAQ from '@/components/seo/CityFAQ'

export default function WorcesterInHomeBloodDraw() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({ city: 'Worcester', state: 'MA', grouped: 'true' })
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
          <h1 className="text-4xl font-bold mb-4">In-Home Blood Draw Services in Worcester, MA</h1>
          <p className="text-xl text-primary-100">Professional at-home blood draw services in Worcester — request same-day or next-day availability.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <InlineLeadForm city="Worcester" state="MA" />

        {!loading && providers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Mobile Phlebotomists Serving Worcester</h2>
            <div className="space-y-6">
              {providers.slice(0, 5).map(provider => (
                <div key={provider.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/provider/${provider.slug}`} className="text-xl font-bold text-gray-900 hover:text-primary-600">{provider.name}</Link>
                    {(provider as any).isFeatured && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Featured</span>}
                  </div>
                  {provider.description && <p className="text-gray-600 mb-3 line-clamp-2">{provider.description}</p>}
                  <ProviderActions provider={provider} currentLocation="Worcester, MA" variant="compact" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Nearby Areas We Serve</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link key="Fitchburg" href={"/us/massachusetts/fitchburg"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Fitchburg, MA</span>
            </Link>
            <Link key="Leominster" href={"/us/massachusetts/leominster"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Leominster, MA</span>
            </Link>
            <Link key="Shrewsbury" href={"/us/massachusetts/shrewsbury"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Shrewsbury, MA</span>
            </Link>
            <Link key="Westborough" href={"/us/massachusetts/westborough"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Westborough, MA</span>
            </Link>
            <Link key="Auburn" href={"/us/massachusetts/auburn"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Auburn, MA</span>
            </Link>
            <Link key="Millbury" href={"/us/massachusetts/millbury"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Millbury, MA</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">About Mobile Phlebotomy in Worcester</h2>
          <p className="text-gray-700 leading-relaxed">Licensed phlebotomists come to your Worcester-area location for convenient blood draws. Services include routine lab work, drug testing, wellness panels, and specialty collections. Same-day and next-day appointments are typically available throughout the greater Worcester metro area.</p>
        </div>

        <CityFAQ cityName="Worcester, MA" cityShort="Worcester" variant="in-home-blood-draw" />

        <CityIntentVariantLinks citySlug="worcester-ma" cityName="Worcester, MA" current="in-home-blood-draw" />
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Worcester" defaultState="MA" defaultZip="" />
    </div>
  )
}
