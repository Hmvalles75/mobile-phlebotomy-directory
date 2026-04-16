'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import InlineLeadForm from '@/components/InlineLeadForm'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'

export default function MiamiMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({ city: 'Miami', state: 'FL', grouped: 'true' })
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
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in Miami, FL</h1>
          <p className="text-xl text-primary-100">Professional at-home blood draw services in Miami — request same-day or next-day availability.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <InlineLeadForm city="Miami" state="FL" />

        {!loading && providers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Mobile Phlebotomists Serving Miami</h2>
            <div className="space-y-6">
              {providers.slice(0, 5).map(provider => (
                <div key={provider.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/provider/${provider.slug}`} className="text-xl font-bold text-gray-900 hover:text-primary-600">{provider.name}</Link>
                    {(provider as any).isFeatured && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Featured</span>}
                  </div>
                  {provider.description && <p className="text-gray-600 mb-3 line-clamp-2">{provider.description}</p>}
                  <ProviderActions provider={provider} currentLocation="Miami, FL" variant="compact" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Nearby Areas We Serve</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link key="Miami Beach" href={"/us/florida/miami-beach"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Miami Beach, FL</span>
            </Link>
            <Link key="Coral Gables" href={"/us/florida/coral-gables"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Coral Gables, FL</span>
            </Link>
            <Link key="Hialeah" href={"/us/florida/hialeah"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Hialeah, FL</span>
            </Link>
            <Link key="Kendall" href={"/us/florida/kendall"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Kendall, FL</span>
            </Link>
            <Link key="Doral" href={"/us/florida/doral"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Doral, FL</span>
            </Link>
            <Link key="Aventura" href={"/us/florida/aventura"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Aventura, FL</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">About Mobile Phlebotomy in Miami</h2>
          <p className="text-gray-700 leading-relaxed mb-4">Miami&apos;s sprawling geography, heavy traffic, and large senior population make mobile phlebotomy an essential service across Miami-Dade. Whether you&apos;re in a high-rise in Brickell, a home in Coral Gables, or a condo in Aventura, getting to a lab can eat up hours — mobile phlebotomists eliminate that entirely.</p>
          <p className="text-gray-700 leading-relaxed mb-4">Florida providers in the Miami area serve a mix of needs: routine draws for Jackson Health System, Baptist Health, and Cleveland Clinic Florida lab orders, Spanish-speaking patient care (critical in a city where 70%+ of residents speak Spanish at home), fertility and specialty testing for the region&apos;s concierge medical practices, and home health collections for Miami&apos;s substantial retiree population.</p>
          <p className="text-gray-700 leading-relaxed">Miami-area mobile phlebotomy typically costs $75&ndash;$140. Florida doesn&apos;t require a separate state phlebotomy license, but all providers on our platform carry national certifications (ASCP, NHA, or AMT) and work under CLIA-approved lab supervision.</p>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Miami" defaultState="FL" defaultZip="" />
    </div>
  )
}
