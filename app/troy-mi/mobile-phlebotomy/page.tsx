'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { ga4 } from '@/lib/ga4'

export default function TroyMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({
          city: 'Troy',
          state: 'MI',
          grouped: 'true'
        })
        const response = await fetch(`/api/providers/city?${params.toString()}`)
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

  const featuredProvider = providers.find((p: any) =>
    p.isFeatured || p.listingTier === 'FEATURED' || p.isFeaturedCity
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in Troy, MI</h1>
          <p className="text-xl text-primary-100">Professional at-home blood draw services in Troy and Oakland County.</p>
        </div>
      </div>
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 text-center">
          <button onClick={() => { ga4.leadCtaClick({ placement: 'hero' }); setLeadFormOpen(true) }} className="px-8 py-4 bg-primary-600 text-white font-bold rounded-lg">Request a Blood Draw</button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        {/* Featured Provider Card */}
        {!loading && featuredProvider && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-400 rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⭐</span>
              <h2 className="text-2xl font-bold text-gray-900">Featured Provider in Troy</h2>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{featuredProvider.name}</h3>
              {featuredProvider.description && <p className="text-gray-700 mb-4">{featuredProvider.description}</p>}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {featuredProvider.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>📞</span>
                    <span>{featuredProvider.phone}</span>
                  </div>
                )}
                {featuredProvider.website && (
                  <div className="flex items-center gap-2">
                    <span>🌐</span>
                    <a href={featuredProvider.website} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-600 hover:text-primary-700 underline">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
              <ProviderActions provider={featuredProvider} currentLocation="Troy, MI" variant="compact" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Now Serving Troy and Nearby Areas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/detroit-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Detroit</Link>
            <span className="text-gray-600">Royal Oak</span>
            <span className="text-gray-600">Sterling Heights</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">What to Expect</h2>
          <p className="text-gray-700">Licensed phlebotomists come to your Troy location for convenient blood draws. Appointments typically within 24-48 hours.</p>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Troy" defaultState="MI" defaultZip="" />
    </div>
  )
}
