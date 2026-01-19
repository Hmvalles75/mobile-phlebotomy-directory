import { prisma } from './prisma'
import type { EnrichedProvider } from './providers'

// Re-export EnrichedProvider type for consumers
export type { EnrichedProvider } from './providers'

/**
 * Convert database provider to EnrichedProvider format
 */
function toEnrichedProvider(provider: any): EnrichedProvider {
  // Use PRIMARY fields as source of truth, fallback to legacy for backwards compat
  const primaryState = provider.primaryState || provider.address?.state || provider.coverage?.find((c: any) => c.stateId)?.state?.abbr
  const primaryCity = provider.primaryCity || provider.address?.city || provider.coverage?.find((c: any) => c.cityId)?.city?.name

  return {
    id: provider.id,
    name: provider.name,
    slug: provider.slug,
    phone: provider.phone || provider.phonePublic || undefined,
    website: provider.website || undefined,
    email: provider.email || undefined,
    description: provider.description || undefined,
    bio: provider.description || undefined,
    zipCodes: provider.zipCodes || undefined,
    status: provider.status,
    totalScore: provider.rating || undefined,
    reviewsCount: provider.reviewCount || undefined,

    // Coverage: Use primary state + relational coverage cities
    coverage: {
      // PRIMARY STATE goes in states array (single source of truth)
      states: primaryState ? [primaryState] : [],
      // Cities from ProviderCoverage relation
      cities: provider.coverage?.filter((c: any) => c.cityId).map((c: any) => c.city?.name) || [],
      regions: []
    },

    // Use primary location fields
    city: primaryCity,
    state: primaryState,

    // Include address if available
    address: provider.address ? {
      street: provider.address.street || undefined,
      city: provider.address.city || undefined,
      state: provider.address.state || undefined,
      zip: provider.address.zip || undefined
    } : undefined,

    // Include services from ProviderService relationships
    services: provider.services?.map((ps: any) => ps.service.name) || [],
    availability: [],
    payment: [],
    badges: provider.status === 'VERIFIED' ? ['Verified'] : [],
    featured: provider.listingTier === 'FEATURED',

    // Add monetization fields (pilot - visibility only)
    listingTier: provider.listingTier,
    isFeatured: provider.isFeatured || false,
    isFeaturedCity: provider.isFeaturedCity || false,
    // Images
    logo: provider.logo,
    profileImage: provider.profileImage,

    createdAt: provider.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: provider.updatedAt?.toISOString() || new Date().toISOString()
  }
}

export async function getAllProviders(): Promise<EnrichedProvider[]> {
  try {
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        phonePublic: true,
        website: true,
        email: true,
        description: true,
        rating: true,
        reviewsCount: true,
        zipCodes: true,
        status: true,
        listingTier: true,
        isFeatured: true,
        isFeaturedCity: true,
        logo: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        // PRIMARY LOCATION FIELDS (Source of Truth)
        primaryState: true,
        primaryStateName: true,
        primaryStateSlug: true,
        primaryCity: true,
        primaryCitySlug: true,
        primaryMetro: true,
        // Relations
        coverage: {
          include: {
            state: true,
            city: true
          }
        },
        address: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return providers.map(toEnrichedProvider)
  } catch (error) {
    console.error('Error fetching providers from database:', error)
    return []
  }
}

export async function getProviderBySlug(slug: string): Promise<EnrichedProvider | null> {
  try {
    const provider = await prisma.provider.findUnique({
      where: { slug },
      include: {
        coverage: {
          include: {
            state: true,
            city: true
          }
        },
        address: true,
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!provider) return null
    return toEnrichedProvider(provider)
  } catch (error) {
    console.error('Error fetching provider by slug:', error)
    return null
  }
}

export async function getProviderById(id: string): Promise<EnrichedProvider | null> {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        coverage: {
          include: {
            state: true,
            city: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!provider) return null
    return toEnrichedProvider(provider)
  } catch (error) {
    console.error('Error fetching provider by id:', error)
    return null
  }
}

export async function getProvidersByCity(cityName: string, stateAbbr?: string): Promise<EnrichedProvider[]> {
  try {
    const providers = await prisma.provider.findMany({
      where: {
        coverage: {
          some: {
            city: {
              name: {
                equals: cityName,
                mode: 'insensitive'
              }
            },
            ...(stateAbbr && {
              state: {
                abbr: stateAbbr
              }
            })
          }
        }
      },
      include: {
        coverage: {
          include: {
            state: true,
            city: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
      }
    })

    return providers.map(toEnrichedProvider)
  } catch (error) {
    console.error('Error fetching providers by city:', error)
    return []
  }
}

export async function getProvidersByState(stateAbbr: string): Promise<EnrichedProvider[]> {
  try {
    const providers = await prisma.provider.findMany({
      where: {
        coverage: {
          some: {
            state: {
              abbr: stateAbbr
            }
          }
        }
      },
      include: {
        coverage: {
          include: {
            state: true,
            city: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
      }
    })

    return providers.map(toEnrichedProvider)
  } catch (error) {
    console.error('Error fetching providers by state:', error)
    return []
  }
}

export async function searchProviders(query: string): Promise<EnrichedProvider[]> {
  try {
    const providers = await prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        coverage: {
          include: {
            state: true,
            city: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
      }
    })

    return providers.map(toEnrichedProvider)
  } catch (error) {
    console.error('Error searching providers:', error)
    return []
  }
}

export async function getFeaturedProviders(): Promise<EnrichedProvider[]> {
  try {
    const providers = await prisma.provider.findMany({
      where: {
        listingTier: 'FEATURED'
      },
      include: {
        coverage: {
          include: {
            state: true,
            city: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
      },
      take: 10
    })

    return providers.map(toEnrichedProvider)
  } catch (error) {
    console.error('Error fetching featured providers:', error)
    return []
  }
}

export async function getTopRatedProviders(): Promise<EnrichedProvider[]> {
  try {
    const providers = await prisma.provider.findMany({
      where: {
        rating: {
          gte: 4.0
        }
      },
      include: {
        coverage: {
          include: {
            state: true,
            city: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      },
      take: 10
    })

    return providers.map(toEnrichedProvider)
  } catch (error) {
    console.error('Error fetching top rated providers:', error)
    return []
  }
}

export async function getProvidersByService(service: string): Promise<EnrichedProvider[]> {
  // Service filtering would require a services field in the database
  // For now, return all providers
  return getAllProviders()
}

export async function getCitiesWithProviders(): Promise<Array<{ city: string; state: string; count: number }>> {
  try {
    const cities = await prisma.providerCoverage.groupBy({
      by: ['cityId', 'stateId'],
      where: {
        cityId: {
          not: null
        }
      },
      _count: {
        providerId: true
      }
    })

    const citiesWithNames = await Promise.all(
      cities.map(async (c) => {
        const city = await prisma.city.findUnique({
          where: { id: c.cityId! },
          include: { state: true }
        })

        return {
          city: city?.name || '',
          state: city?.state?.abbr || '',
          count: c._count.providerId
        }
      })
    )

    return citiesWithNames.filter(c => c.city && c.state)
  } catch (error) {
    console.error('Error fetching cities with providers:', error)
    return []
  }
}