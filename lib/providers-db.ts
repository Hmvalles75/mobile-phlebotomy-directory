// import { PrismaClient } from '@prisma/client'
// import { Provider } from './schemas'

// Use singleton pattern to prevent multiple Prisma clients
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Return state abbreviation as-is since data is stored with abbreviations
function getDbStateValue(stateAbbr: string): string {
  // Data is stored using standard state abbreviations (MI, CA, TX, etc.)
  return stateAbbr.toUpperCase()
}

// Helper function to convert database provider to Provider schema
function convertToProvider(dbProvider: any): Provider {
  return {
    id: dbProvider.id,
    name: dbProvider.name,
    slug: dbProvider.slug,
    phone: dbProvider.phone || undefined,
    email: dbProvider.email || undefined,
    website: dbProvider.website || undefined,
    bookingUrl: dbProvider.bookingUrl || undefined,
    description: dbProvider.description || undefined,
    services: dbProvider.services?.map((s: any) => s.service.name) || [],
    coverage: {
      states: dbProvider.coverage?.map((c: any) => c.state.abbr) || [],
      cities: dbProvider.coverage?.map((c: any) => c.city?.name).filter(Boolean) || [],
    },
    address: dbProvider.address ? {
      street: dbProvider.address.street || undefined,
      city: dbProvider.address.city || undefined,
      state: dbProvider.address.state || undefined,
      zip: dbProvider.address.zip || undefined,
    } : undefined,
    coords: dbProvider.coords ? {
      lat: dbProvider.coords.lat,
      lng: dbProvider.coords.lng,
    } : undefined,
    availability: dbProvider.availability?.map((a: any) => a.availability.name) || [],
    payment: dbProvider.payment?.map((p: any) => p.payment.name) || [],
    rating: dbProvider.rating || undefined,
    reviewsCount: dbProvider.reviewsCount || undefined,
    badges: dbProvider.badges?.map((b: any) => b.badge.name) || [],
    createdAt: dbProvider.createdAt.toISOString(),
    updatedAt: dbProvider.updatedAt.toISOString(),
  }
}

export async function getAllProviders(): Promise<Provider[]> {
  const dbProviders = await prisma.provider.findMany({
    include: {
      services: { include: { service: true } },
      coverage: { include: { state: true, city: true } },
      address: true,
      coords: true,
      availability: { include: { availability: true } },
      payment: { include: { payment: true } },
      badges: { include: { badge: true } },
    },
  })
  
  return dbProviders.map(convertToProvider)
}

export async function getProvidersByCity(city: string, state: string): Promise<Provider[]> {
  try {
    const normalizedCity = city.toLowerCase().replace(/-/g, ' ')
    const dbStateValue = getDbStateValue(state)
    
    console.log(`Searching for providers in ${normalizedCity}, ${state} (db: ${dbStateValue})`)
    
    const dbProviders = await prisma.provider.findMany({
    where: {
      OR: [
        // Providers with specific city coverage
        {
          coverage: {
            some: {
              state: { abbr: dbStateValue },
              city: { name: { contains: normalizedCity } }
            }
          }
        },
        // Providers with address in the city
        {
          AND: [
            { address: { city: { contains: normalizedCity } } },
            { address: { state: dbStateValue } }
          ]
        },
        // Providers with statewide coverage (no specific city)
        {
          coverage: {
            some: {
              state: { abbr: dbStateValue },
              city: null
            }
          }
        }
      ]
    },
    include: {
      services: { include: { service: true } },
      coverage: { include: { state: true, city: true } },
      address: true,
      coords: true,
      availability: { include: { availability: true } },
      payment: { include: { payment: true } },
      badges: { include: { badge: true } },
    },
  })
    
    console.log(`Found ${dbProviders.length} providers in database`)
    return dbProviders.map(convertToProvider)
  } catch (error) {
    console.error('Error in getProvidersByCity:', error)
    return []
  }
}

export async function getProvidersByState(state: string): Promise<Provider[]> {
  const dbStateValue = getDbStateValue(state)
  
  const dbProviders = await prisma.provider.findMany({
    where: {
      coverage: {
        some: {
          state: { abbr: dbStateValue }
        }
      }
    },
    include: {
      services: { include: { service: true } },
      coverage: { include: { state: true, city: true } },
      address: true,
      coords: true,
      availability: { include: { availability: true } },
      payment: { include: { payment: true } },
      badges: { include: { badge: true } },
    },
  })
  
  return dbProviders.map(convertToProvider)
}

export async function searchProviders(
  query: string,
  filters: {
    services?: string[]
    city?: string
    state?: string
    availability?: string[]
    payment?: string[]
    sortBy?: 'rating' | 'distance' | 'reviews' | 'name'
    minRating?: number
  } = {}
): Promise<Provider[]> {
  try {
  let whereClause: any = {}
  
  // Build WHERE clause based on filters
  const andConditions: any[] = []
  
  // Location filters
  if (filters.state || filters.city) {
    if (filters.city && filters.state) {
      const normalizedCity = filters.city.toLowerCase().replace(/-/g, ' ')
      const dbStateValue = getDbStateValue(filters.state)
      
      andConditions.push({
        OR: [
          {
            coverage: {
              some: {
                state: { abbr: dbStateValue },
                city: { name: { contains: normalizedCity } }
              }
            }
          },
          {
            AND: [
              { address: { city: { contains: normalizedCity } } },
              { address: { state: dbStateValue } }
            ]
          }
        ]
      })
    } else if (filters.state) {
      const dbStateValue = getDbStateValue(filters.state)
      andConditions.push({
        coverage: {
          some: {
            state: { abbr: dbStateValue }
          }
        }
      })
    }
  }
  
  // Service filters
  if (filters.services && filters.services.length > 0) {
    andConditions.push({
      services: {
        some: {
          service: {
            name: { in: filters.services }
          }
        }
      }
    })
  }
  
  // Availability filters
  if (filters.availability && filters.availability.length > 0) {
    andConditions.push({
      availability: {
        some: {
          availability: {
            name: { in: filters.availability }
          }
        }
      }
    })
  }
  
  // Payment filters
  if (filters.payment && filters.payment.length > 0) {
    andConditions.push({
      payment: {
        some: {
          payment: {
            name: { in: filters.payment }
          }
        }
      }
    })
  }
  
  // Rating filter
  if (filters.minRating && filters.minRating >= 3.0) {
    andConditions.push({
      rating: { gte: filters.minRating }
    })
  }
  
  // Search query
  if (query) {
    const normalizedQuery = query.toLowerCase()
    andConditions.push({
      OR: [
        { name: { contains: normalizedQuery } },
        { description: { contains: normalizedQuery } },
        { services: { some: { service: { name: { contains: normalizedQuery } } } } },
        { coverage: { some: { city: { name: { contains: normalizedQuery } } } } },
        { address: { city: { contains: normalizedQuery } } },
      ]
    })
  }
  
  if (andConditions.length > 0) {
    whereClause.AND = andConditions
  }
  
  // Build ORDER BY clause
  let orderBy: any = {}
  switch (filters.sortBy) {
    case 'rating':
      orderBy = [
        { rating: 'desc' },
        { reviewsCount: 'desc' }
      ]
      break
    case 'reviews':
      orderBy = [
        { reviewsCount: 'desc' },
        { rating: 'desc' }
      ]
      break
    case 'name':
      orderBy = { name: 'asc' }
      break
    default:
      // Default to rating-based relevance
      orderBy = [
        { rating: 'desc' },
        { reviewsCount: 'desc' },
        { name: 'asc' }
      ]
  }
  
  const dbProviders = await prisma.provider.findMany({
    where: whereClause,
    orderBy: orderBy,
    include: {
      services: { include: { service: true } },
      coverage: { include: { state: true, city: true } },
      address: true,
      coords: true,
      availability: { include: { availability: true } },
      payment: { include: { payment: true } },
      badges: { include: { badge: true } },
    },
  })
  
  return dbProviders.map(convertToProvider)
  } catch (error) {
    console.error('Error in searchProviders:', error)
    return []
  }
}

export async function getProviderById(id: string): Promise<Provider | undefined> {
  const dbProvider = await prisma.provider.findUnique({
    where: { id },
    include: {
      services: { include: { service: true } },
      coverage: { include: { state: true, city: true } },
      address: true,
      coords: true,
      availability: { include: { availability: true } },
      payment: { include: { payment: true } },
      badges: { include: { badge: true } },
    },
  })
  
  return dbProvider ? convertToProvider(dbProvider) : undefined
}

export async function getProviderBySlug(slug: string): Promise<Provider | undefined> {
  const dbProvider = await prisma.provider.findUnique({
    where: { slug },
    include: {
      services: { include: { service: true } },
      coverage: { include: { state: true, city: true } },
      address: true,
      coords: true,
      availability: { include: { availability: true } },
      payment: { include: { payment: true } },
      badges: { include: { badge: true } },
    },
  })
  
  return dbProvider ? convertToProvider(dbProvider) : undefined
}

export async function getFeaturedProviders(limit: number = 6): Promise<Provider[]> {
  const dbProviders = await prisma.provider.findMany({
    where: {
      AND: [
        { rating: { gte: 4.5 } }, // 4.5+ stars for featured
        { reviewsCount: { gte: 3 } } // At least 3 reviews
      ]
    },
    orderBy: [
      { rating: 'desc' },
      { reviewsCount: 'desc' }
    ],
    take: limit,
    include: {
      services: { include: { service: true } },
      coverage: { include: { state: true, city: true } },
      address: true,
      coords: true,
      availability: { include: { availability: true } },
      payment: { include: { payment: true } },
      badges: { include: { badge: true } },
    },
  })
  
  return dbProviders.map(convertToProvider)
}

export async function getTopRatedProviders(limit: number = 8): Promise<Provider[]> {
  const dbProviders = await prisma.provider.findMany({
    where: {
      AND: [
        { rating: { gte: 4.0 } }, // 4.0+ stars
        { reviewsCount: { not: null } }
      ]
    },
    orderBy: [
      { rating: 'desc' },
      { reviewsCount: 'desc' },
      { name: 'asc' }
    ],
    take: limit,
    include: {
      services: { include: { service: true } },
      coverage: { include: { state: true, city: true } },
      address: true,
      coords: true,
      availability: { include: { availability: true } },
      payment: { include: { payment: true } },
      badges: { include: { badge: true } },
    },
  })
  
  return dbProviders.map(convertToProvider)
}

export async function getProvidersByService(service: string): Promise<Provider[]> {
  const dbProviders = await prisma.provider.findMany({
    where: {
      services: {
        some: {
          service: { name: service }
        }
      }
    },
    include: {
      services: { include: { service: true } },
      coverage: { include: { state: true, city: true } },
      address: true,
      coords: true,
      availability: { include: { availability: true } },
      payment: { include: { payment: true } },
      badges: { include: { badge: true } },
    },
  })
  
  return dbProviders.map(convertToProvider)
}

export async function getCitiesWithProviders(): Promise<Array<{city: string, state: string, count: number}>> {
  const cityResults = await prisma.$queryRaw`
    SELECT 
      c.name as city,
      s.abbr as state,
      COUNT(DISTINCT pc.providerId) as count
    FROM provider_coverage pc
    JOIN cities c ON pc.cityId = c.id
    JOIN states s ON pc.stateId = s.id
    WHERE c.name IS NOT NULL
    GROUP BY c.name, s.abbr
    ORDER BY count DESC
  ` as Array<{city: string, state: string, count: bigint}>
  
  const addressResults = await prisma.$queryRaw`
    SELECT 
      pa.city,
      pa.state,
      COUNT(*) as count
    FROM provider_addresses pa
    WHERE pa.city IS NOT NULL AND pa.state IS NOT NULL
    GROUP BY pa.city, pa.state
    ORDER BY count DESC
  ` as Array<{city: string, state: string, count: bigint}>
  
  // Combine and deduplicate results
  const cityMap = new Map<string, number>()
  
  cityResults.forEach(result => {
    const key = `${result.city}|${result.state}`
    cityMap.set(key, Number(result.count))
  })
  
  addressResults.forEach(result => {
    const key = `${result.city}|${result.state}`
    const existingCount = cityMap.get(key) || 0
    cityMap.set(key, existingCount + Number(result.count))
  })
  
  return Array.from(cityMap.entries())
    .map(([key, count]) => {
      const [city, state] = key.split('|')
      return { city, state, count }
    })
    .sort((a, b) => b.count - a.count)
}