import { promises as fs } from 'fs'
import path from 'path'

export interface EnrichedProvider {
  id: string
  name: string
  totalScore?: number
  reviewsCount?: number
  street?: string
  'regions serviced'?: string
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
  // Extract just the first few words (business name) if name is too long
  let cleanName = name
  if (name.length > 100) {
    // Take first 10 words or first 50 characters, whichever is shorter
    const words = name.split(/\s+/).slice(0, 10).join(' ')
    cleanName = words.length > 50 ? words.substring(0, 50) : words
  }

  return cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) // Ensure max 50 characters
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
  if (provider.state && provider.state !== '') {
    coverage.states.push(provider.state)
  }

  // Parse city
  if (provider.city && provider.city !== '') {
    coverage.cities = [provider.city]
  }

  // Parse regions serviced (cleaned data field)
  if (provider['regions serviced'] && provider['regions serviced'] !== '') {
    coverage.regions = [provider['regions serviced']]
  }
  // Also check verified_service_areas for backward compatibility
  else if (provider.verified_service_areas && provider.verified_service_areas !== '') {
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

  // Handle various boolean representations
  const weekendAvail = provider.weekendAvailable?.toString().toLowerCase()
  const emergencyAvail = provider.emergencyAvailable?.toString().toLowerCase()

  if (weekendAvail === 'true' || weekendAvail === 'yes') {
    availability.push('Weekends')
  }
  if (emergencyAvail === 'true' || emergencyAvail === 'yes') {
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

  // Check for certifications (ASCP Certified is our default)
  if (provider.certifications && (provider.certifications.includes('CERTIFIED') || provider.certifications.includes('ASCP'))) {
    badges.push('Certified')
  }

  // Check for insurance
  if (provider.insuranceAmount && provider.insuranceAmount !== '' && provider.insuranceAmount !== 'nan') {
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

// Enhanced CSV parser that handles quoted fields and commas within quotes
function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // Parse headers
  const headers = parseCSVLine(lines[0])
  const records = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const record: any = {}

    for (let j = 0; j < headers.length; j++) {
      const value = values[j]?.trim() || ''
      // Convert 'nan' string to empty
      record[headers[j]] = value.toLowerCase() === 'nan' ? '' : value
    }

    records.push(record)
  }

  return records
}

// Helper function to parse a CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current)

  return result.map(field => field.trim())
}

async function loadProviders(): Promise<EnrichedProvider[]> {
  if (providersCache) {
    return providersCache
  }

  try {
    const csvPath = path.join(process.cwd(), 'cleaned_providers.csv')
    const fileContent = await fs.readFile(csvPath, 'utf-8')

    const records = parseCSV(fileContent)

    const providers: EnrichedProvider[] = records.map((record: any, index: number) => {
      // Create a simple hash for very long names to ensure unique but short IDs
      const baseSlug = generateSlug(record.name)
      const id = baseSlug.length > 30 ? `provider-${index.toString().padStart(3, '0')}` : `${baseSlug}-${index}`

      // Clean the name field to extract business name
      const cleanName = record.name?.length > 100
        ? record.name.split(/\s+/).slice(0, 8).join(' ').substring(0, 80)
        : record.name

      // Filter out empty/invalid values and handle cleaned data
      const processedRecord = {
        ...record,
        id,
        name: cleanName || 'Unknown Provider',
        slug: generateSlug(cleanName || 'provider'),
        description: record.bio || record.validation_notes || `${cleanName} provides mobile phlebotomy services`,
        services: parseServices(record),
        coverage: parseCoverage(record),
        address: {
          street: record.street && record.street !== '' ? record.street : undefined,
          city: record.city && record.city !== '' ? record.city : undefined,
          state: record.state && record.state !== '' ? record.state : undefined,
          zip: record.zipCodes?.split(',')[0]?.trim() || undefined
        },
        availability: parseAvailability(record),
        payment: parsePayment(),
        rating: record.totalScore && !isNaN(parseFloat(record.totalScore)) ? parseFloat(record.totalScore) : undefined,
        reviewsCount: record.reviewsCount && !isNaN(parseInt(record.reviewsCount)) ? parseInt(record.reviewsCount) : undefined,
        badges: parseBadges(record),
        bookingUrl: record.website && record.website !== '' ? record.website : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return processedRecord
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