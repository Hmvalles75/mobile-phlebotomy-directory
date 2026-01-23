import fs from 'fs/promises'
import path from 'path'

/**
 * Generate NYC expansion pages:
 * - 5 borough pages
 * - 3 NYC intent variants
 * - 3 NJ spillover pages
 */

// Borough definitions
const boroughs = [
  { slug: 'manhattan-ny', name: 'Manhattan', state: 'NY', neighborhoods: 'Midtown, Upper East Side, Lower Manhattan, Harlem, Chelsea' },
  { slug: 'brooklyn-ny', name: 'Brooklyn', state: 'NY', neighborhoods: 'Williamsburg, Park Slope, Brooklyn Heights, DUMBO, Bushwick' },
  { slug: 'queens-ny', name: 'Queens', state: 'NY', neighborhoods: 'Astoria, Flushing, Long Island City, Forest Hills, Jamaica' },
  { slug: 'bronx-ny', name: 'Bronx', state: 'NY', neighborhoods: 'Riverdale, Fordham, Pelham Bay, Parkchester, Mott Haven' },
  { slug: 'staten-island-ny', name: 'Staten Island', state: 'NY', neighborhoods: 'St. George, Tottenville, New Springville, Great Kills, Port Richmond' }
]

// NJ cities
const njCities = [
  { slug: 'newark-nj', name: 'Newark', state: 'NJ' },
  { slug: 'jersey-city-nj', name: 'Jersey City', state: 'NJ' },
  { slug: 'bayonne-nj', name: 'Bayonne', state: 'NJ' }
]

// NYC intent variants
const nycIntents = [
  { slug: 'in-home-blood-draw', title: 'In-Home Blood Draw', h1: 'In-Home Blood Draw Services in NYC' },
  { slug: 'blood-draw-at-home', title: 'Blood Draw at Home', h1: 'Blood Draw at Home in New York City' },
  { slug: 'lab-draw-at-home', title: 'Lab Draw at Home', h1: 'Lab Draw at Home in NYC' }
]

const appDir = 'c:/Users/hmval/OneDrive/Desktop/MobilePhlebotomy/app'

// Generate borough page template
function generateBoroughPage(borough: typeof boroughs[0]) {
  return `'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { ga4 } from '@/lib/ga4'

export default function ${borough.name.replace(/\s+/g, '')}MobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({
          city: '${borough.name}',
          state: '${borough.state}',
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

  const featuredProvider = providers.find((p: any) =>
    p.isFeatured || p.listingTier === 'FEATURED' || p.isFeaturedCity
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in ${borough.name}, NY</h1>
          <p className="text-xl text-primary-100">At-home blood draw services in ${borough.name} — request same-day or next-day availability when scheduling allows.</p>
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
            Serving ${borough.name} + All NYC Boroughs
          </h2>
          <p className="text-gray-700 mb-6">
            Our network of mobile phlebotomists serves ${borough.name} and all five NYC boroughs.
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
              <strong>Neighborhoods served in ${borough.name}:</strong> ${borough.neighborhoods}
            </p>
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'metro_links' })
                setLeadFormOpen(true)
              }}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
            >
              📋 Request Service in ${borough.name}
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
                  Featured Provider in ${borough.name}
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

              <ProviderActions provider={featuredProvider} currentLocation="${borough.name}, ${borough.state}" variant="compact" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">What to Expect</h2>
          <p className="text-gray-700">Licensed phlebotomists come to your ${borough.name} location for convenient blood draws. Same-day and next-day appointments typically available when scheduling allows.</p>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="${borough.name}" defaultState="${borough.state}" defaultZip="" />
    </div>
  )
}
`
}

// Generate NYC intent variant page
function generateNYCIntentPage(intent: typeof nycIntents[0]) {
  return `'use client'
import { useState } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { ga4 } from '@/lib/ga4'

export default function NYC${intent.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">${intent.h1}</h1>
          <p className="text-xl text-primary-100">Professional mobile phlebotomy services across New York City — request same-day or next-day availability when scheduling allows.</p>
        </div>
      </div>
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 text-center">
          <button onClick={() => { ga4.leadCtaClick({ placement: 'hero' }); setLeadFormOpen(true) }} className="px-8 py-4 bg-primary-600 text-white font-bold rounded-lg">Request a Blood Draw</button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg border-2 border-primary-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ${intent.title} Services in New York City
          </h2>
          <p className="text-gray-700 mb-6">
            Looking for ${intent.title.toLowerCase()} services in NYC? Browse our comprehensive directory of mobile phlebotomy providers serving all five boroughs.
          </p>

          <Link
            href="/new-york-ny/mobile-phlebotomy"
            className="block bg-gradient-to-br from-primary-50 to-white rounded-lg p-5 hover:from-primary-100 hover:to-primary-50 hover:shadow-md border-2 border-primary-200 hover:border-primary-400 transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏙️</span>
              <span className="font-bold text-gray-900 text-lg">View All NYC Mobile Phlebotomy Providers</span>
            </div>
            <span className="text-sm text-primary-600 group-hover:text-primary-700 font-medium">Browse providers in all five boroughs →</span>
          </Link>

          <div className="pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'metro_links' })
                setLeadFormOpen(true)
              }}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
            >
              📋 Request Service in NYC
            </button>
          </div>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="New York" defaultState="NY" defaultZip="" />
    </div>
  )
}
`
}

// Generate NJ city page
function generateNJPage(city: typeof njCities[0]) {
  return `'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { ga4 } from '@/lib/ga4'

export default function ${city.name.replace(/\s+/g, '')}MobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({
          city: '${city.name}',
          state: '${city.state}',
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

  const featuredProvider = providers.find((p: any) =>
    p.isFeatured || p.listingTier === 'FEATURED' || p.isFeaturedCity
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in ${city.name}, NJ</h1>
          <p className="text-xl text-primary-100">At-home blood draw services in ${city.name} — request same-day or next-day availability when scheduling allows.</p>
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
            Serving ${city.name} + NYC Metro Area
          </h2>
          <p className="text-gray-700 mb-6">
            Our network of mobile phlebotomists serves ${city.name} and the greater NYC metro area including all five boroughs.
            Explore providers across the region:
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
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'metro_links' })
                setLeadFormOpen(true)
              }}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
            >
              📋 Request Service in ${city.name}
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
                  Featured Provider in ${city.name}
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

              <ProviderActions provider={featuredProvider} currentLocation="${city.name}, ${city.state}" variant="compact" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">What to Expect</h2>
          <p className="text-gray-700">Licensed phlebotomists come to your ${city.name} location for convenient blood draws. Same-day and next-day appointments typically available when scheduling allows.</p>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="${city.name}" defaultState="${city.state}" defaultZip="" />
    </div>
  )
}
`
}

// Generate layout file
function generateLayout(city: string, state: string) {
  return `import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy ${city} ${state} | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in ${city}, ${state}. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy ${city} ${state}',
    description: 'At-home blood draw services in ${city}. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
`
}

async function main() {
  console.log('🏙️ Generating NYC expansion pages...\n')

  let created = 0

  // 1. Generate borough pages
  console.log('📍 Creating 5 borough pages...')
  for (const borough of boroughs) {
    const dir = path.join(appDir, borough.slug, 'mobile-phlebotomy')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'page.tsx'), generateBoroughPage(borough))
    await fs.writeFile(path.join(dir, 'layout.tsx'), generateLayout(borough.name, borough.state))
    console.log(`   ✅ Created ${borough.slug}/mobile-phlebotomy`)
    created++
  }

  // 2. Generate NYC intent variants
  console.log('\n📝 Creating 3 NYC intent variant pages...')
  for (const intent of nycIntents) {
    const dir = path.join(appDir, 'new-york-ny', intent.slug)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'page.tsx'), generateNYCIntentPage(intent))
    await fs.writeFile(path.join(dir, 'layout.tsx'), generateLayout(`${intent.title} NYC`, 'NY'))
    console.log(`   ✅ Created new-york-ny/${intent.slug}`)
    created++
  }

  // 3. Generate NJ pages
  console.log('\n📍 Creating 3 NJ spillover pages...')
  for (const city of njCities) {
    const dir = path.join(appDir, city.slug, 'mobile-phlebotomy')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'page.tsx'), generateNJPage(city))
    await fs.writeFile(path.join(dir, 'layout.tsx'), generateLayout(city.name, city.state))
    console.log(`   ✅ Created ${city.slug}/mobile-phlebotomy`)
    created++
  }

  console.log()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 NYC EXPANSION COMPLETE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log(`✅ Created ${created} new pages:`)
  console.log(`   • 1 NYC hub`)
  console.log(`   • 5 borough pages`)
  console.log(`   • 3 intent variants`)
  console.log(`   • 3 NJ pages`)
  console.log()
  console.log('📋 Next steps:')
  console.log('   1. Configure CMB as featured provider for NY/NJ')
  console.log('   2. Run build to verify pages')
  console.log('   3. Test internal linking structure')
  console.log()
}

main().catch(console.error)
