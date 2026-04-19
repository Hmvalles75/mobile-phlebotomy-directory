'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import InlineLeadForm from '@/components/InlineLeadForm'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import CityIntentVariantLinks from '@/components/CityIntentVariantLinks'
import CityFAQ from '@/components/seo/CityFAQ'

export default function LowellMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({ city: 'Lowell', state: 'MA', grouped: 'true' })
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
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in Lowell, MA</h1>
          <p className="text-xl text-primary-100">Professional at-home blood draw services in Lowell — request same-day or next-day availability.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <InlineLeadForm city="Lowell" state="MA" />

        {!loading && providers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Mobile Phlebotomists Serving Lowell</h2>
            <div className="space-y-6">
              {providers.slice(0, 5).map(provider => (
                <div key={provider.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/provider/${provider.slug}`} className="text-xl font-bold text-gray-900 hover:text-primary-600">{provider.name}</Link>
                    {(provider as any).isFeatured && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Featured</span>}
                  </div>
                  {provider.description && <p className="text-gray-600 mb-3 line-clamp-2">{provider.description}</p>}
                  <ProviderActions provider={provider} currentLocation="Lowell, MA" variant="compact" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Nearby Areas We Serve</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link key="Chelmsford" href={"/us/massachusetts/chelmsford"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Chelmsford, MA</span>
            </Link>
            <Link key="Dracut" href={"/us/massachusetts/dracut"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Dracut, MA</span>
            </Link>
            <Link key="Tewksbury" href={"/us/massachusetts/tewksbury"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Tewksbury, MA</span>
            </Link>
            <Link key="Billerica" href={"/us/massachusetts/billerica"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Billerica, MA</span>
            </Link>
            <Link key="Lawrence" href={"/us/massachusetts/lawrence"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Lawrence, MA</span>
            </Link>
            <Link key="Andover" href={"/us/massachusetts/andover"}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all">
              <span className="font-medium text-gray-900">Andover, MA</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">About Mobile Phlebotomy in Lowell</h2>
          <p className="text-gray-700 leading-relaxed mb-4">Lowell sits at the heart of the Merrimack Valley, 30 miles northwest of Boston and 40 miles south of New Hampshire. The city&apos;s large immigrant communities — particularly Cambodian, Brazilian, and Puerto Rican — make bilingual mobile phlebotomy services especially valuable for patients who prefer to receive care at home.</p>
          <p className="text-gray-700 leading-relaxed mb-4">Local providers serve Lowell General Hospital and Circle Health lab orders, UMass Lowell student and faculty health draws, home health collections throughout the Merrimack Valley, and corporate wellness for the biotech and defense contractors along Route 3. Coverage typically extends to Chelmsford, Dracut, Tewksbury, Billerica, Andover, and Lawrence.</p>
          <p className="text-gray-700 leading-relaxed">Mobile phlebotomy visits in the Lowell area run $75&ndash;$145. Massachusetts phlebotomists operate under CLIA-certified lab oversight, and MassHealth covers home draws for homebound patients with a physician&apos;s order documenting medical necessity.</p>
        </div>

        <CityFAQ cityName="Lowell, MA" cityShort="Lowell" variant="mobile-phlebotomy" />

        <CityIntentVariantLinks citySlug="lowell-ma" cityName="Lowell, MA" current="mobile-phlebotomy" />
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Lowell" defaultState="MA" defaultZip="" />
    </div>
  )
}
