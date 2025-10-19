import { MetadataRoute } from 'next'
import statesData from '@/data/states.json'
import citiesData from '@/data/cities.json'
import { State, City } from '@/lib/schemas'
import { getAllProviders } from '@/lib/providers'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'
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

  return routes
}