import { promises as fs } from 'fs'
import path from 'path'

export interface EnrichedProvider {
  id: string
  name: string
  totalScore?: number
  reviewsCount?: number
  street?: string
  city?: string
  state?: string
  countryCode?: string
  website?: string
  phone?: string
  categoryName?: string
  url?: string
  is_mobile_phlebotomy?: string
  is_nationwide?: string
  verified_service_areas?: string
  validation_notes?: string
  logo?: string
  profileImage?: string
  businessImages?: string
  bio?: string
  foundedYear?: string
  teamSize?: string
  yearsExperience?: string
  zipCodes?: string
  serviceRadius?: string
  travelFee?: string
  googlePlaceId?: string
  testimonials?: string
  certifications?: string
  licenseNumber?: string
  insuranceAmount?: string
  specialties?: string
  emergencyAvailable?: string
  weekendAvailable?: string
  email?: string
  contactPerson?: string
  languages?: string
  // Schema fields for compatibility
  slug: string
  description?: string
  services: string[]
  coverage: {
    states: string[]
    cities?: string[]
    regions?: string[]
  }
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
  }
  availability?: string[]
  payment?: string[]
  rating?: number
  badges?: string[]
  bookingUrl?: string
  createdAt: string
  updatedAt: string
}

let providersCache: EnrichedProvider[] | null = null

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseServices(provider: any): string[] {
  const services: string[] = []

  // Check for specific services mentioned in validation notes or bio
  const text = `${provider.validation_notes || ''} ${provider.bio || ''} ${provider.specialties || ''}`.toLowerCase()

  if (text.includes('blood') || text.includes('phlebotomy')) {
    services.push('At-Home Blood Draw')
  }
  if (text.includes('corporate') || text.includes('workplace') || text.includes('business')) {
    services.push('Corporate Wellness')
  }
  if (text.includes('specimen') || text.includes('pickup')) {
    services.push('Specimen Pickup')
  }
  if (text.includes('lab') || text.includes('laboratory')) {
    services.push('Lab Partner')
  }
  if (text.includes('pediatric') || text.includes('children')) {
    services.push('Pediatric')
  }
  if (text.includes('geriatric') || text.includes('elderly') || text.includes('senior')) {
    services.push('Geriatric')
  }
  if (text.includes('fertility') || text.includes('ivf')) {
    services.push('Fertility/IVF')
  }

  // Default services if none found
  if (services.length === 0 && provider.is_mobile_phlebotomy === 'Yes') {
    services.push('At-Home Blood Draw')
  }

  return services
}

function parseCoverage(provider: any): EnrichedProvider['coverage'] {
  const coverage: EnrichedProvider['coverage'] = {
    states: [],
    cities: [],
    regions: []
  }

  // Parse state from address
  if (provider.state) {
    coverage.states.push(provider.state)
  }

  // Parse city
  if (provider.city) {
    coverage.cities = [provider.city]
  }

  // Parse service areas
  if (provider.verified_service_areas) {
    const areas = provider.verified_service_areas.toLowerCase()

    // Check for statewide coverage
    if (areas.includes('statewide') || areas.includes('(statewide)')) {
      // Already have state from above
    } else if (areas.includes('and')) {
      // Multiple states/regions
      const parts = areas.split('and').map((s: string) => s.trim())
      parts.forEach((part: string) => {
        if (!coverage.states.includes(part)) {
          coverage.regions?.push(part)
        }
      })
    } else {
      coverage.regions = [provider.verified_service_areas]
    }
  }

  return coverage
}

function parseAvailability(provider: any): string[] {
  const availability: string[] = []

  if (provider.weekendAvailable === 'TRUE') {
    availability.push('Weekends')
  }
  if (provider.emergencyAvailable === 'TRUE') {
    availability.push('24/7')
  }
  if (availability.length === 0) {
    availability.push('Weekdays')
  }

  return availability
}

function parsePayment(): string[] {
  // Default payment methods - can be enhanced based on data
  return ['Cash', 'Major Insurance']
}

function parseBadges(provider: any): string[] {
  const badges: string[] = []

  if (provider.certifications && provider.certifications.includes('CERTIFIED')) {
    badges.push('Certified')
  }
  if (provider.insuranceAmount) {
    badges.push('Insured')
  }

  // Default badges for mobile phlebotomy services
  if (provider.is_mobile_phlebotomy === 'Yes') {
    if (!badges.includes('Certified')) {
      badges.push('Certified')
    }
    badges.push('HIPAA-Compliant')
  }

  return badges
}

// Simple CSV parser for our use case
function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const records = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const record: any = {}

    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j]?.trim() || ''
    }

    records.push(record)
  }

  return records
}

async function loadProviders(): Promise<EnrichedProvider[]> {
  if (providersCache) {
    return providersCache
  }

  try {
    const csvPath = path.join(process.cwd(), 'fully_enriched_providers_batch.csv')
    const fileContent = await fs.readFile(csvPath, 'utf-8')

    const records = parseCSV(fileContent)

    const providers: EnrichedProvider[] = records.map((record: any, index: number) => {
      const id = generateSlug(record.name) + '-' + index

      return {
        ...record,
        id,
        slug: generateSlug(record.name),
        description: record.bio || record.validation_notes,
        services: parseServices(record),
        coverage: parseCoverage(record),
        address: {
          street: record.street,
          city: record.city,
          state: record.state,
          zip: record.zipCodes?.split(',')[0]?.trim()
        },
        availability: parseAvailability(record),
        payment: parsePayment(),
        rating: record.totalScore ? parseFloat(record.totalScore) : undefined,
        reviewsCount: record.reviewsCount ? parseInt(record.reviewsCount) : undefined,
        badges: parseBadges(record),
        bookingUrl: record.website,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    providersCache = providers
    return providers
  } catch (error) {
    console.error('Error loading providers:', error)
    return []
  }
}

export async function getAllProviders(): Promise<EnrichedProvider[]> {
  return loadProviders()
}

export async function getProviderById(id: string): Promise<EnrichedProvider | null> {
  const providers = await loadProviders()
  return providers.find(p => p.id === id) || null
}

export async function getProvidersByState(state: string): Promise<EnrichedProvider[]> {
  const providers = await loadProviders()
  return providers.filter(p =>
    p.state?.toLowerCase() === state.toLowerCase() ||
    p.coverage.states.some(s => s.toLowerCase() === state.toLowerCase())
  )
}

export async function getProvidersByCity(city: string, state?: string): Promise<EnrichedProvider[]> {
  const providers = await loadProviders()
  return providers.filter(p => {
    const cityMatch = p.city?.toLowerCase() === city.toLowerCase() ||
                     p.coverage.cities?.some(c => c.toLowerCase() === city.toLowerCase())

    if (state) {
      const stateMatch = p.state?.toLowerCase() === state.toLowerCase() ||
                        p.coverage.states.some(s => s.toLowerCase() === state.toLowerCase())
      return cityMatch && stateMatch
    }

    return cityMatch
  })
}

export async function searchProviders(query: string): Promise<EnrichedProvider[]> {
  const providers = await loadProviders()
  const searchTerm = query.toLowerCase()

  return providers.filter(p => {
    return p.name.toLowerCase().includes(searchTerm) ||
           p.city?.toLowerCase().includes(searchTerm) ||
           p.state?.toLowerCase().includes(searchTerm) ||
           p.description?.toLowerCase().includes(searchTerm) ||
           p.bio?.toLowerCase().includes(searchTerm) ||
           p.specialties?.toLowerCase().includes(searchTerm)
  })
}