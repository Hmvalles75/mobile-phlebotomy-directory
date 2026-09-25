import { MetadataRoute } from 'next'
import { STATE_DATA } from '@/data/states-full'
import { CITY_MAPPING } from '@/data/cities-full'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/seo'
import { PROVIDERS_PER_PAGE } from '@/lib/seo/providersIndex'
import { topMetroAreas } from '@/data/top-metros'
import { metroHref } from '@/lib/seo/metroCanonical'
import { isStubNoindex } from '@/lib/providerIndexing'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL

  // Optimized: only fetch fields needed for sitemap (much faster)
  //
  // removedAt filter added 2026-08-20. Without it every soft-removed provider
  // was still submitted to Google, and each of those URLs 301-redirects via
  // next.config.mjs — Search Console reports them as "Page with redirect"
  // errors. Seven were in here, including `test-provider`, a test record being
  // advertised to search engines. Soft removal is the only removal we do, so
  // this is the filter that makes it mean something externally.
  // isFixedSite filter added 2026-09-17. Hospital outpatient labs and blood
  // banks were quarantined off city pages on 2026-08-21 but stayed in the
  // sitemap with "Mobile Phlebotomy Services" titles; two of them drew ~1,600
  // Search Console impressions at 0.1% CTR on branded facility searches that
  // can never convert here. Their pages now carry noindex (see the provider
  // route's generateMetadata) and are no longer advertised.
  // Stub rule (lib/providerIndexing.ts) added 2026-09-25: a noindexed page
  // must not be advertised either. Same predicate the page uses.
  const providerRows = await prisma.provider.findMany({
    where: { removedAt: null, isFixedSite: false },
    select: {
      slug: true,
      updatedAt: true,
      status: true,
      description: true,
      primaryCity: true,
      _count: { select: { leadNotifications: true } },
    },
  })
  const providers = providerRows.filter(p => !isStubNoindex({ status: p.status, description: p.description, primaryCity: p.primaryCity, notifiedCount: p._count.leadNotifications }))

  // Count of active providers drives /providers index pagination URLs.
  const activeProviderCount = await prisma.provider.count({
    where: { status: 'VERIFIED', eligibleForLeads: true },
  })
  const providerIndexPages = Math.max(1, Math.ceil(activeProviderCount / PROVIDERS_PER_PAGE))

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/add-provider`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/mobile-phlebotomy-cost`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      // State-level companion to the national cost page. Florida is the second
      // largest lead source and the national page ranks for the generic query
      // but not the state one.
      url: `${baseUrl}/mobile-phlebotomy-cost-florida`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Provider-facing. Distinct from /mobile-phlebotomy-insurance-coverage,
      // which answers the patient question about their own insurance; this one
      // answers what a phlebotomist needs to carry.
      url: `${baseUrl}/mobile-phlebotomist-insurance-requirements`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/can-mobile-phlebotomists-bill-medicare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-to-get-patients-as-a-mobile-phlebotomist`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-to-get-contracts-mobile-phlebotomy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mobile-phlebotomy-1099-contractor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-website-builders-mobile-phlebotomy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-networks`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // ── Institutional funnel ──────────────────────────────────────────────
    // /request-coverage is the only institutional page that converts: all
    // three attributed coverage requests (The Wellness Group, Monell Chemical
    // Senses Center, I Peace) landed on it directly from search. It was
    // missing from this sitemap entirely, as were two of the three
    // institutional content pages. Priority 0.9 — these buyers are worth
    // 10-100x a single consumer draw.
    {
      url: `${baseUrl}/request-coverage`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/corporate-phlebotomy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Raised to 0.9 alongside /request-coverage on 2026-08-19. Research
      // draws are the largest institutional requests received to date — Monell
      // at 51-200/month, a Harvard group at 50-100 — and both arrived through
      // search. Same buyer value as /request-coverage, so same priority.
      url: `${baseUrl}/clinical-trials-mobile-phlebotomy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      // Event staffing (2026-09-10). 21 requests had arrived via ChatGPT
      // referrals, two of them event/institutional, with no page an assistant
      // could cite for 'event phlebotomy staffing'. Same buyer value as the
      // research page, same priority.
      url: `${baseUrl}/event-phlebotomy-staffing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      // Was in neither the sitemap nor any internal link — fully orphaned, so
      // Google had no path to it at all. Targets "partnership" and "contract
      // services" queries, which is the same buyer as the pages above.
      url: `${baseUrl}/mobile-phlebotomy-partnership`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/providers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ]

  // Paginated provider index pages (page 2..N) — page 1 already added above.
  for (let i = 2; i <= providerIndexPages; i++) {
    routes.push({
      url: `${baseUrl}/providers/page/${i}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  // Add provider pages
  providers.forEach((provider) => {
    routes.push({
      url: `${baseUrl}/provider/${provider.slug}`,
      lastModified: new Date(provider.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  })

  routes.push({ url: `${baseUrl}/us`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 })

  // Add all 51 state pages (50 states + DC)
  for (const stateSlug of Object.keys(STATE_DATA)) {
    routes.push({
      url: `${baseUrl}/us/${stateSlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  // Add city pages from the unified compound-keyed city mapping.
  // Skip cities flagged noProviders (zero matching providers in the coverage
  // DB) so we don't advertise thin pages in the sitemap.
  for (const cityInfo of Object.values(CITY_MAPPING)) {
    if (cityInfo.noProviders) continue
    routes.push({
      url: `${baseUrl}/us/${cityInfo.stateSlug}/${cityInfo.citySlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  // ── /us/metro/* ────────────────────────────────────────────────────────
  // Only self-canonical metros belong here, which is two of the fifty.
  //
  // Four slugs (chicago, phoenix, san-antonio, san-diego) 308-redirect to their
  // city page and must never be submitted. The other forty-four carry
  // <link rel="canonical"> pointing AT their city twin — see the metro layout's
  // generateMetadata, which deliberately cross-canonicalises to consolidate
  // duplicates. Submitting a URL that disclaims itself asks Google to index a
  // page that says "index the other one"; at best it is ignored, at worst it is
  // a contradictory signal. So the filter is metroHref() returning the metro's
  // own path, which is true only for New York City and Washington DC.
  //
  // Raising the other 44 would mean reversing the consolidation strategy, not
  // adding sitemap entries. Flagged for Hector rather than decided here.
  for (const metro of topMetroAreas) {
    if (metroHref(metro) !== `/us/metro/${metro.slug}`) continue
    routes.push({
      url: `${baseUrl}/us/metro/${metro.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // ── Legacy /{city}-{st}/{slug} tier: fully retired ─────────────────────
  // All 106 legacy URLs now 308 to their /us/{state}/{city} page (the last
  // 12 — columbus-oh, charlotte-nc, worcester-ma, lowell-ma — on 2026-09-24,
  // once their prose was ported into data/city-longform.ts and rendered by
  // the dynamic city layout). Submitting a redirected URL wastes crawl budget
  // and muddies the consolidation signal, so nothing is listed here.
  const customPages: { slug: string; priority: number }[] = []

  customPages.forEach((page) => {
    routes.push({
      url: `${baseUrl}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: page.priority,
    })
  })

  return routes
}