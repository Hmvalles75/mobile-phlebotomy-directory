'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { ga4 } from '@/lib/ga4'

export default function BrooklynMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({
          city: 'Brooklyn',
          state: 'NY',
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
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in Brooklyn, NY</h1>
          <p className="text-xl text-primary-100">At-home blood draw services in Brooklyn — request same-day or next-day availability when scheduling allows.</p>
        </div>
      </div>
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 text-center">
          <button onClick={() => { ga4.leadCtaClick({ placement: 'hero' }); setLeadFormOpen(true) }} className="px-8 py-4 bg-primary-600 text-white font-bold rounded-lg">Request a Blood Draw</button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        {/* Link back to NYC hub */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-primary-100 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Serving Brooklyn + All NYC Boroughs
          </h2>
          <p className="text-gray-700 mb-6">
            Our network of mobile phlebotomists serves Brooklyn and all five NYC boroughs.
            Explore providers across the New York metro area:
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <Link
              href="/new-york-ny/mobile-phlebotomy"
              className="block bg-gradient-to-br from-primary-50 to-white rounded-lg p-5 hover:from-primary-100 hover:to-primary-50 hover:shadow-md border-2 border-primary-200 hover:border-primary-400 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏙️</span>
                <span className="font-bold text-gray-900 text-lg">NYC Mobile Phlebotomy</span>
              </div>
              <span className="text-sm text-primary-600 group-hover:text-primary-700 font-medium">View all NYC area services →</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              <strong>Neighborhoods served in Brooklyn:</strong> Williamsburg, Park Slope, Brooklyn Heights, DUMBO, Bushwick
            </p>
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'metro_links' })
                setLeadFormOpen(true)
              }}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
            >
              📋 Request Service in Brooklyn
            </button>
          </div>
        </div>

        {/* Featured Provider Card */}
        {!loading && featuredProvider && (
          <div className="bg-white rounded-lg shadow-lg border-2 border-amber-300">
            <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 p-4 border-b border-amber-200">
              <div className="flex items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  Featured Provider in Brooklyn
                </h2>
              </div>
              <p className="text-gray-700 font-medium">
                Premium provider with verified credentials and enhanced visibility
              </p>
            </div>
            <div className="p-5 bg-gradient-to-r from-amber-50/40 to-transparent">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">
                  {featuredProvider.name}
                </h3>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md">
                  ⭐ Featured Provider
                </span>
              </div>

              {/* Service Scope Notice */}
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-blue-900">
                  <strong>Requests submitted through MobilePhlebotomy.org are routed for at-home blood draw and laboratory specimen collection services.</strong>
                </p>
              </div>

              {featuredProvider.description && (
                <div className="mb-4 p-3 bg-white/60 rounded-lg border border-gray-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {featuredProvider.description}
                  </p>
                </div>
              )}

              <div className="bg-white/60 p-4 rounded-lg border border-gray-200 mb-4">
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  {featuredProvider.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-primary-600">📞</span>
                      <span className="font-medium text-gray-900">{featuredProvider.phone}</span>
                    </div>
                  )}
                  {featuredProvider.address?.city && featuredProvider.address?.state && (
                    <div className="flex items-center gap-2">
                      <span className="text-primary-600">📍</span>
                      <span className="text-gray-700">Based in {featuredProvider.address.city}, {featuredProvider.address.state}</span>
                    </div>
                  )}
                </div>
              </div>

              <ProviderActions provider={featuredProvider} currentLocation="Brooklyn, NY" variant="compact" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">What to Expect</h2>
          <p className="text-gray-700">Licensed phlebotomists come to your Brooklyn location for convenient blood draws. Same-day and next-day appointments typically available when scheduling allows.</p>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Brooklyn" defaultState="NY" defaultZip="" />
    </div>
  )
}
