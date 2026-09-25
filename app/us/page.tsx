import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo'
import { STATE_DATA } from '@/data/states-full'
import { CITY_MAPPING } from '@/data/cities-full'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

// /us never existed as a page, yet every static city override lists it as the
// "United States" breadcrumb item in JSON-LD, so Google crawled it and logged
// a 404 (GSC, 2026-09-25). This is the state index that breadcrumb implies:
// one link per state with live counts, so it is a real hub, not a placeholder.
const canonical = `${SITE_URL}/us`

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy by State: At-Home Blood Draw Providers Across the US',
  description: 'Browse licensed mobile phlebotomists in all 50 states and DC. Pick your state to see providers, cities served, and typical at-home blood draw pricing.',
  alternates: { canonical },
  openGraph: { title: 'Mobile Phlebotomy by State', description: 'At-home blood draw providers across the United States, by state.', url: canonical, type: 'website' },
}

export default async function UsIndexPage() {
  const rows = await prisma.provider.groupBy({
    by: ['primaryState'],
    where: { removedAt: null, eligibleForLeads: true, isFixedSite: false },
    _count: { _all: true },
  })
  const counts = new Map(rows.map(r => [(r.primaryState || '').toUpperCase(), r._count._all]))
  const citiesByState = new Map<string, number>()
  for (const c of Object.values(CITY_MAPPING)) if (!c.noProviders) citiesByState.set(c.stateSlug, (citiesByState.get(c.stateSlug) || 0) + 1)

  const states = Object.entries(STATE_DATA)
    .map(([slug, info]) => ({ slug, name: info.name, abbr: info.abbr, providers: counts.get(info.abbr) || 0, cities: citiesByState.get(slug) || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const total = states.reduce((s, x) => s + x.providers, 0)

  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'United States', item: canonical },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <nav className="text-sm text-primary-100 mb-3"><Link href="/" className="hover:underline">Home</Link> <span className="mx-1">/</span> United States</nav>
          <h1 className="text-4xl font-bold mb-3">Mobile Phlebotomy by State</h1>
          <p className="text-xl text-primary-100 max-w-3xl">
            {total} active mobile phlebotomists across the United States. Choose your state to see who comes to your home, the cities they serve, and what a visit typically costs.
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {states.map(s => (
            <li key={s.slug}>
              <Link href={`/us/${s.slug}`} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <span className="font-medium text-gray-900">{s.name}</span>
                <span className="text-sm text-gray-500">
                  {s.providers > 0 ? `${s.providers} provider${s.providers === 1 ? '' : 's'}` : 'request coverage'}
                  {s.cities > 0 ? ` · ${s.cities} ${s.cities === 1 ? 'city' : 'cities'}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-600 mt-8">
          Don&apos;t see a provider near you? <Link href="/request-blood-draw" className="text-primary-700 font-medium hover:underline">Submit a request</Link> and we&apos;ll match you with the nearest phlebotomist who travels to your area.
        </p>
      </div>
    </div>
  )
}
