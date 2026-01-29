import { MetadataRoute } from 'next'
import statesData from '@/data/states.json'
import citiesData from '@/data/cities.json'
import { State, City } from '@/lib/schemas'
import { getAllProviders } from '@/lib/providers-db'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL
  const states = statesData as State[]
  const cities = citiesData as City[]
  const providers = await getAllProviders()

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
  ]

  // Add provider pages
  providers.forEach((provider) => {
    routes.push({
      url: `${baseUrl}/provider/${provider.slug}`,
      lastModified: new Date(provider.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  })

  // Add state pages
  states.forEach((state) => {
    routes.push({
      url: `${baseUrl}/us/${state.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  })

  // Add city pages
  cities.forEach((city) => {
    const state = states.find(s => s.abbr === city.stateAbbr)
    if (state) {
      routes.push({
        url: `${baseUrl}/us/${state.slug}/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  })

  // Add custom metro area pages (Detroit, NYC, LA)
  const customPages = [
    // PREMIUM PROVIDER LANDING PAGES
    { slug: 'maryland/carewithluvs-mobile-phlebotomy', priority: 0.95 },

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