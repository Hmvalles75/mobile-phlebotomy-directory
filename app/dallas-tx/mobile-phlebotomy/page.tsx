'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import InlineLeadForm from '@/components/InlineLeadForm'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'

export default function DallasMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({ city: 'Dallas', state: 'TX', grouped: 'true' })
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
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in Dallas, TX</h1>
          <p className="text-xl text-primary-100">Professional at-home blood draw services in Dallas — request same-day or next-day availability.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <InlineLeadForm city="Dallas" state="TX" />

        {!loading && providers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Mobile Phlebotomists Serving Dallas</h2>
            <div className="space-y-6">
              {providers.slice(0, 5).map(provider => (
                <div key={provider.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/provider/${provider.slug}`} className="text-xl font-bold text-gray-900 hover:text-primary-600">{provider.name}</Link>
                    {(provider as any).isFeatured && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Featured</span>}
                  </div>
                  {provider.description && <p className="text-gray-600 mb-3 line-clamp-2">{provider.description}</p>}
                  <ProviderActions provider={provider} currentLocation="Dallas, TX" variant="compact" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Nearby Areas We Serve</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link key="Plano" href={"/us/texas/plano"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Plano, TX</span>
            </Link>
            <Link key="Arlington" href={"/us/texas/arlington"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Arlington, TX</span>
            </Link>
            <Link key="Irving" href={"/us/texas/irving"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Irving, TX</span>
            </Link>
            <Link key="Garland" href={"/us/texas/garland"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Garland, TX</span>
            </Link>
            <Link key="Richardson" href={"/us/texas/richardson"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Richardson, TX</span>
            </Link>
            <Link key="Mesquite" href={"/us/texas/mesquite"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Mesquite, TX</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">About Mobile Phlebotomy in Dallas</h2>
          <p className="text-gray-700 leading-relaxed mb-4">Dallas anchors the fourth-largest metro in the U.S. — a sprawling 9,000+ square mile region that includes Fort Worth, Plano, Arlington, Irving, and dozens of rapidly growing suburbs. The Dallas-Fort Worth Metroplex is home to major medical systems like UT Southwestern, Baylor Scott &amp; White, and Medical City Healthcare, but with so much distance between communities, mobile phlebotomy is a practical alternative to driving 45 minutes for a 10-minute blood draw.</p>
          <p className="text-gray-700 leading-relaxed mb-4">DFW mobile phlebotomists handle routine lab draws for UT Southwestern and Baylor orders, pre-employment and DOT drug testing for the region&apos;s logistics and transportation companies, corporate wellness programs for the many Fortune 500 HQs in the metro, and home health collections for Dallas&apos;s growing retiree population across Collin and Denton counties.</p>
          <p className="text-gray-700 leading-relaxed">Dallas-area mobile phlebotomy typically runs $65&ndash;$130 per visit, below the national average. Texas requires phlebotomists to work under a CLIA-certified lab and carry appropriate certifications; all providers listed here meet those requirements.</p>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Dallas" defaultState="TX" defaultZip="" />
    </div>
  )
}
