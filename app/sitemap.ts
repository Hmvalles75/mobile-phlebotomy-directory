import { MetadataRoute } from 'next'
import { STATE_DATA, ABBR_TO_SLUG } from '@/data/states-full'
import { CITY_MAPPING } from '@/data/cities-full'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/seo'
import { PROVIDERS_PER_PAGE } from '@/lib/seo/providersIndex'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL

  // Optimized: only fetch fields needed for sitemap (much faster)
  const providers = await prisma.provider.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  })

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

  // Add all 51 state pages (50 states + DC)
  for (const stateSlug of Object.keys(STATE_DATA)) {
    routes.push({
      url: `${baseUrl}/us/${stateSlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  // Add all ~260 city pages from the full city mapping
  for (const [citySlug, cityInfo] of Object.entries(CITY_MAPPING)) {
    const stateSlug = ABBR_TO_SLUG[cityInfo.state]
    if (stateSlug) {
      routes.push({
        url: `${baseUrl}/us/${stateSlug}/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }

  // Add custom metro area pages (Detroit, NYC, LA)
  const customPages = [
    // (Maryland/CAREWITHLUVS hardcoded landing removed 2026-04-24 —
    // consolidated to the canonical /provider/carewithluvs-llc URL,
    // which renders the same rich template via the premiumPage flag.)

    // DETROIT METRO
    // Main hub
    { slug: 'detroit-mi/mobile-phlebotomy', priority: 0.9 },
    // Suburbs
    { slug: 'dearborn-mi/mobile-phlebotomy', priority: 0.8 },
    { slug: 'livonia-mi/mobile-phlebotomy', priority: 0.8 },
    { slug: 'troy-mi/mobile-phlebotomy', priority: 0.8 },
    { slug: 'southfield-mi/mobile-phlebotomy', priority: 0.8 },
    { slug: 'warren-mi/mobile-phlebotomy', priority: 0.8 },
    // Intent variants
    { slug: 'detroit-mi/in-home-blood-draw', priority: 0.7 },
    { slug: 'detroit-mi/mobile-phlebotomist', priority: 0.7 },
    { slug: 'detroit-mi/blood-draw-at-home', priority: 0.7 },
    { slug: 'detroit-mi/lab-draw-at-home', priority: 0.7 },

    // NYC METRO
    // Main hub
    { slug: 'new-york-ny/mobile-phlebotomy', priority: 0.9 },
    // Five Boroughs
    { slug: 'manhattan-ny/mobile-phlebotomy', priority: 0.85 },
    { slug: 'brooklyn-ny/mobile-phlebotomy', priority: 0.85 },
    { slug: 'queens-ny/mobile-phlebotomy', priority: 0.85 },
    { slug: 'bronx-ny/mobile-phlebotomy', priority: 0.85 },
    { slug: 'staten-island-ny/mobile-phlebotomy', priority: 0.85 },
    // Northern NJ
    { slug: 'newark-nj/mobile-phlebotomy', priority: 0.8 },
    { slug: 'jersey-city-nj/mobile-phlebotomy', priority: 0.8 },
    { slug: 'bayonne-nj/mobile-phlebotomy', priority: 0.8 },
    // Intent variants
    { slug: 'new-york-ny/in-home-blood-draw', priority: 0.7 },
    { slug: 'new-york-ny/blood-draw-at-home', priority: 0.7 },
    { slug: 'new-york-ny/lab-draw-at-home', priority: 0.7 },

    // LA METRO
    // Main hub
    { slug: 'los-angeles-ca/mobile-phlebotomy', priority: 0.9 },
    // Suburbs
    { slug: 'pasadena-ca/mobile-phlebotomy', priority: 0.8 },
    { slug: 'santa-monica-ca/mobile-phlebotomy', priority: 0.8 },
    { slug: 'burbank-ca/mobile-phlebotomy', priority: 0.8 },
    { slug: 'glendale-ca/mobile-phlebotomy', priority: 0.8 },
    { slug: 'long-beach-ca/mobile-phlebotomy', priority: 0.8 },
    { slug: 'torrance-ca/mobile-phlebotomy', priority: 0.8 },
    { slug: 'west-hollywood-ca/mobile-phlebotomy', priority: 0.8 },
    { slug: 'beverly-hills-ca/mobile-phlebotomy', priority: 0.8 },
    // Intent variants
    { slug: 'los-angeles-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'los-angeles-ca/blood-draw-at-home', priority: 0.7 },
    { slug: 'los-angeles-ca/lab-draw-at-home', priority: 0.7 },

    // HOUSTON METRO
    { slug: 'houston-tx/mobile-phlebotomy', priority: 0.85 },
    { slug: 'houston-tx/in-home-blood-draw', priority: 0.7 },
    { slug: 'houston-tx/blood-draw-at-home', priority: 0.7 },

    // CHICAGO METRO
    { slug: 'chicago-il/mobile-phlebotomy', priority: 0.85 },
    { slug: 'chicago-il/in-home-blood-draw', priority: 0.7 },
    { slug: 'chicago-il/blood-draw-at-home', priority: 0.7 },

    // SAN DIEGO METRO
    { slug: 'san-diego-ca/mobile-phlebotomy', priority: 0.85 },
    { slug: 'san-diego-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'san-diego-ca/blood-draw-at-home', priority: 0.7 },

    // COLUMBUS METRO
    { slug: 'columbus-oh/mobile-phlebotomy', priority: 0.85 },
    { slug: 'columbus-oh/in-home-blood-draw', priority: 0.7 },
    { slug: 'columbus-oh/blood-draw-at-home', priority: 0.7 },

    // CHARLOTTE METRO
    { slug: 'charlotte-nc/mobile-phlebotomy', priority: 0.85 },
    { slug: 'charlotte-nc/in-home-blood-draw', priority: 0.7 },
    { slug: 'charlotte-nc/blood-draw-at-home', priority: 0.7 },

    // BOSTON METRO (MA)
    { slug: 'boston-ma/mobile-phlebotomy', priority: 0.9 },
    { slug: 'boston-ma/in-home-blood-draw', priority: 0.75 },
    { slug: 'boston-ma/blood-draw-at-home', priority: 0.75 },

    // WORCESTER METRO (MA)
    { slug: 'worcester-ma/mobile-phlebotomy', priority: 0.85 },
    { slug: 'worcester-ma/in-home-blood-draw', priority: 0.7 },
    { slug: 'worcester-ma/blood-draw-at-home', priority: 0.7 },

    // LOWELL / MERRIMACK VALLEY (MA)
    { slug: 'lowell-ma/mobile-phlebotomy', priority: 0.8 },
    { slug: 'lowell-ma/in-home-blood-draw', priority: 0.7 },
    { slug: 'lowell-ma/blood-draw-at-home', priority: 0.7 },

    // MIAMI METRO (FL)
    { slug: 'miami-fl/mobile-phlebotomy', priority: 0.9 },
    { slug: 'miami-fl/in-home-blood-draw', priority: 0.75 },
    { slug: 'miami-fl/blood-draw-at-home', priority: 0.75 },

    // DALLAS METRO (TX)
    { slug: 'dallas-tx/mobile-phlebotomy', priority: 0.9 },
    { slug: 'dallas-tx/in-home-blood-draw', priority: 0.75 },
    { slug: 'dallas-tx/blood-draw-at-home', priority: 0.75 },

    // INTENT VARIANTS — added 2026-04-18 for 21 cities that previously
    // only had /mobile-phlebotomy. New variants are in-home-blood-draw
    // and blood-draw-at-home for each.
    { slug: 'bayonne-nj/in-home-blood-draw', priority: 0.7 },
    { slug: 'bayonne-nj/blood-draw-at-home', priority: 0.7 },
    { slug: 'beverly-hills-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'beverly-hills-ca/blood-draw-at-home', priority: 0.7 },
    { slug: 'bronx-ny/in-home-blood-draw', priority: 0.7 },
    { slug: 'bronx-ny/blood-draw-at-home', priority: 0.7 },
    { slug: 'brooklyn-ny/in-home-blood-draw', priority: 0.7 },
    { slug: 'brooklyn-ny/blood-draw-at-home', priority: 0.7 },
    { slug: 'burbank-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'burbank-ca/blood-draw-at-home', priority: 0.7 },
    { slug: 'dearborn-mi/in-home-blood-draw', priority: 0.7 },
    { slug: 'dearborn-mi/blood-draw-at-home', priority: 0.7 },
    { slug: 'glendale-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'glendale-ca/blood-draw-at-home', priority: 0.7 },
    { slug: 'jersey-city-nj/in-home-blood-draw', priority: 0.7 },
    { slug: 'jersey-city-nj/blood-draw-at-home', priority: 0.7 },
    { slug: 'livonia-mi/in-home-blood-draw', priority: 0.7 },
    { slug: 'livonia-mi/blood-draw-at-home', priority: 0.7 },
    { slug: 'long-beach-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'long-beach-ca/blood-draw-at-home', priority: 0.7 },
    { slug: 'manhattan-ny/in-home-blood-draw', priority: 0.75 },
    { slug: 'manhattan-ny/blood-draw-at-home', priority: 0.75 },
    { slug: 'newark-nj/in-home-blood-draw', priority: 0.7 },
    { slug: 'newark-nj/blood-draw-at-home', priority: 0.7 },
    { slug: 'pasadena-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'pasadena-ca/blood-draw-at-home', priority: 0.7 },
    { slug: 'queens-ny/in-home-blood-draw', priority: 0.7 },
    { slug: 'queens-ny/blood-draw-at-home', priority: 0.7 },
    { slug: 'santa-monica-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'santa-monica-ca/blood-draw-at-home', priority: 0.7 },
    { slug: 'southfield-mi/in-home-blood-draw', priority: 0.7 },
    { slug: 'southfield-mi/blood-draw-at-home', priority: 0.7 },
    { slug: 'staten-island-ny/in-home-blood-draw', priority: 0.7 },
    { slug: 'staten-island-ny/blood-draw-at-home', priority: 0.7 },
    { slug: 'torrance-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'torrance-ca/blood-draw-at-home', priority: 0.7 },
    { slug: 'troy-mi/in-home-blood-draw', priority: 0.7 },
    { slug: 'troy-mi/blood-draw-at-home', priority: 0.7 },
    { slug: 'warren-mi/in-home-blood-draw', priority: 0.7 },
    { slug: 'warren-mi/blood-draw-at-home', priority: 0.7 },
    { slug: 'west-hollywood-ca/in-home-blood-draw', priority: 0.7 },
    { slug: 'west-hollywood-ca/blood-draw-at-home', priority: 0.7 },
  ]

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