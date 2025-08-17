#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'
import { ProviderSchema, type Provider } from '../lib/schemas'

interface CSVProvider {
  // Original format fields
  name?: string
  phone?: string
  email?: string
  website?: string
  description?: string
  services?: string // comma-separated
  city?: string
  state?: string
  zip?: string
  street?: string
  availability?: string // comma-separated
  payment?: string // comma-separated
  rating?: string
  reviewsCount?: string
  totalReviews?: string
  badges?: string // comma-separated
  lat?: string
  lng?: string
  address?: string
  category?: string
  businessStatus?: string
  hours?: string
  bookingLinks?: string
  googleMapsUrl?: string
  
  // New format fields (crawler-google-places)
  title?: string
  totalScore?: string
  categoryName?: string
  countryCode?: string
  url?: string
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function parseServices(servicesStr: string, category?: string, name?: string): Array<'At-Home Blood Draw' | 'Corporate Wellness' | 'Pediatric' | 'Geriatric' | 'Fertility/IVF' | 'Specimen Pickup' | 'Lab Partner'> {
  // Default service based on category and name
  const services: Array<'At-Home Blood Draw' | 'Corporate Wellness' | 'Pediatric' | 'Geriatric' | 'Fertility/IVF' | 'Specimen Pickup' | 'Lab Partner'> = ['At-Home Blood Draw']
  
  // Analyze category for additional services
  if (category && typeof category === 'string') {
    const cat = category.toLowerCase()
    if (cat.includes('medical laboratory') || cat.includes('laboratory')) {
      services.push('Specimen Pickup', 'Lab Partner')
    }
    if (cat.includes('health care') || cat.includes('healthcare')) {
      services.push('Corporate Wellness')
    }
  }
  
  // Analyze name for specific service indicators
  if (name && typeof name === 'string') {
    const nameLower = name.toLowerCase()
    
    // Corporate/workplace services
    if (nameLower.includes('corporate') || nameLower.includes('workplace') || nameLower.includes('employee')) {
      services.push('Corporate Wellness')
    }
    
    // Pediatric services
    if (nameLower.includes('pediatric') || nameLower.includes('children') || nameLower.includes('kid') || nameLower.includes('baby') || nameLower.includes('infant')) {
      services.push('Pediatric')
    }
    
    // Geriatric/senior services
    if (nameLower.includes('geriatric') || nameLower.includes('senior') || nameLower.includes('elderly') || nameLower.includes('aging')) {
      services.push('Geriatric')
    }
    
    // Fertility/IVF services
    if (nameLower.includes('fertility') || nameLower.includes('ivf') || nameLower.includes('reproductive') || nameLower.includes('pregnancy')) {
      services.push('Fertility/IVF')
    }
    
    // Lab partnership
    if (nameLower.includes('hospital') || nameLower.includes('clinic') || nameLower.includes('medical center') || nameLower.includes('laboratory')) {
      services.push('Lab Partner')
    }
    
    // Specimen services
    if (nameLower.includes('specimen') || nameLower.includes('collection') || nameLower.includes('pickup') || nameLower.includes('transport')) {
      services.push('Specimen Pickup')
    }
    
    // Corporate wellness indicators
    if (nameLower.includes('wellness') || nameLower.includes('health screening') || nameLower.includes('occupational')) {
      services.push('Corporate Wellness')
    }
  }
  
  if (!servicesStr) return Array.from(new Set(services))
  
  const serviceMap: Record<string, string> = {
    'blood draw': 'At-Home Blood Draw',
    'at-home blood draw': 'At-Home Blood Draw',
    'mobile blood draw': 'At-Home Blood Draw',
    'phlebotomy': 'At-Home Blood Draw',
    'mobile phlebotomy': 'At-Home Blood Draw',
    'corporate wellness': 'Corporate Wellness',
    'corporate': 'Corporate Wellness',
    'wellness': 'Corporate Wellness',
    'pediatric': 'Pediatric',
    'pediatric collection': 'Pediatric',
    'children': 'Pediatric',
    'geriatric': 'Geriatric',
    'elderly': 'Geriatric',
    'senior': 'Geriatric',
    'fertility': 'Fertility/IVF',
    'ivf': 'Fertility/IVF',
    'fertility/ivf': 'Fertility/IVF',
    'specimen pickup': 'Specimen Pickup',
    'pickup': 'Specimen Pickup',
    'lab partner': 'Lab Partner',
    'lab': 'Lab Partner',
    'laboratory': 'Lab Partner'
  }

  const parsedServices = servicesStr
    .split(',')
    .map(s => s.trim().toLowerCase())
    .map(s => serviceMap[s] || null)
    .filter(s => s !== null)
  
  // Combine with defaults and remove duplicates
  const allServices = Array.from(new Set([...services, ...parsedServices]))
  return allServices as Array<'At-Home Blood Draw' | 'Corporate Wellness' | 'Pediatric' | 'Geriatric' | 'Fertility/IVF' | 'Specimen Pickup' | 'Lab Partner'>
}

function parseAvailability(availabilityStr: string, businessStatus?: string, hours?: string): Array<'Weekdays' | 'Weekends' | 'Evenings' | '24/7'> {
  const availability: Array<'Weekdays' | 'Weekends' | 'Evenings' | '24/7'> = []
  
  // Check business status and hours for 24/7 operation
  if ((businessStatus && businessStatus.toLowerCase().includes('24 hours')) || 
      (hours && hours.toLowerCase().includes('24 hours')) || 
      (businessStatus && businessStatus.toLowerCase().includes('open 24 hours'))) {
    availability.push('24/7')
  } else if (businessStatus && businessStatus.toLowerCase().includes('closes') && businessStatus.toLowerCase().includes('pm')) {
    availability.push('Weekdays', 'Evenings')
  } else {
    availability.push('Weekdays')
  }
  
  if (availabilityStr) {
    const availMap: Record<string, 'Weekdays' | 'Weekends' | 'Evenings' | '24/7'> = {
      'weekdays': 'Weekdays',
      'monday-friday': 'Weekdays',
      'weekends': 'Weekends',
      'saturday-sunday': 'Weekends',
      'evenings': 'Evenings',
      'evening': 'Evenings',
      '24/7': '24/7',
      '24-7': '24/7',
      'always': '24/7'
    }

    const parsed = availabilityStr
      .split(',')
      .map(a => a.trim().toLowerCase())
      .map(a => availMap[a])
      .filter(a => a) as Array<'Weekdays' | 'Weekends' | 'Evenings' | '24/7'>
    
    availability.push(...parsed)
  }

  return availability.filter((avail, index, array) => array.indexOf(avail) === index)
}

function parsePayment(paymentStr: string): Array<'Cash' | 'Major Insurance' | 'Medicare' | 'HSA/FSA'> {
  if (!paymentStr) return ['Cash', 'Major Insurance']
  
  const paymentMap: Record<string, string> = {
    'cash': 'Cash',
    'insurance': 'Major Insurance',
    'major insurance': 'Major Insurance',
    'medicare': 'Medicare',
    'hsa': 'HSA/FSA',
    'fsa': 'HSA/FSA',
    'hsa/fsa': 'HSA/FSA'
  }

  return paymentStr
    .split(',')
    .map(p => p.trim().toLowerCase())
    .map(p => paymentMap[p] || 'Cash')
    .filter((payment, index, array) => array.indexOf(payment) === index) as Array<'Cash' | 'Major Insurance' | 'Medicare' | 'HSA/FSA'>
}

function parseBadges(badgesStr: string): Array<'Certified' | 'Background-Checked' | 'Insured' | 'HIPAA-Compliant'> {
  if (!badgesStr) return ['Certified', 'Insured']
  
  const badgeMap: Record<string, string> = {
    'certified': 'Certified',
    'licensed': 'Certified',
    'background checked': 'Background-Checked',
    'background-checked': 'Background-Checked',
    'insured': 'Insured',
    'bonded': 'Insured',
    'hipaa': 'HIPAA-Compliant',
    'hipaa compliant': 'HIPAA-Compliant',
    'hipaa-compliant': 'HIPAA-Compliant'
  }

  return badgesStr
    .split(',')
    .map(b => b.trim().toLowerCase())
    .map(b => badgeMap[b] || 'Certified')
    .filter((badge, index, array) => array.indexOf(badge) === index) as Array<'Certified' | 'Background-Checked' | 'Insured' | 'HIPAA-Compliant'>
}

function parseAddress(addressStr?: string, street?: string, city?: string, state?: string, zip?: string) {
  if (addressStr) {
    // Parse full address string like "7869 Ventura Canyon Ave UNIT 202, Panorama City, CA 91402"
    const parts = addressStr.split(',').map(p => p.trim())
    if (parts.length >= 3) {
      const streetPart = parts[0]
      const cityPart = parts[1]
      const stateZipPart = parts[2].split(' ')
      const statePart = stateZipPart[0]
      const zipPart = stateZipPart[1]
      
      return {
        street: streetPart || street,
        city: cityPart || city,
        state: statePart || state,
        zip: zipPart || zip
      }
    }
  }
  
  return {
    street: street,
    city: city,
    state: state,
    zip: zip
  }
}

function getRegionForCity(city: string, state: string): string[] {
  const cityLower = city?.toLowerCase() || ''
  const stateLower = state?.toLowerCase() || ''
  
  // Major metropolitan regions mapping
  const regionMap: Record<string, string[]> = {
    // California
    'los angeles': ['Greater Los Angeles', 'Southern California'],
    'san francisco': ['San Francisco Bay Area', 'Northern California'],
    'san jose': ['San Francisco Bay Area', 'Silicon Valley'],
    'oakland': ['San Francisco Bay Area', 'East Bay'],
    'san diego': ['San Diego County', 'Southern California'],
    'sacramento': ['Central Valley', 'Northern California'],
    
    // Florida
    'miami': ['Greater Miami', 'South Florida'],
    'fort lauderdale': ['Greater Miami', 'Broward County'],
    'tampa': ['Tampa Bay Area', 'Central Florida'],
    'orlando': ['Greater Orlando', 'Central Florida'],
    'jacksonville': ['Northeast Florida'],
    
    // Texas
    'houston': ['Greater Houston', 'Gulf Coast'],
    'dallas': ['Dallas-Fort Worth Metroplex', 'North Texas'],
    'austin': ['Austin Metro', 'Central Texas'],
    'san antonio': ['San Antonio Metro', 'South Texas'],
    
    // New York
    'new york': ['New York City Metropolitan Area', 'Tri-State Area'],
    'brooklyn': ['New York City Metropolitan Area', 'Tri-State Area'],
    'queens': ['New York City Metropolitan Area', 'Tri-State Area'],
    'manhattan': ['New York City Metropolitan Area', 'Tri-State Area'],
    'bronx': ['New York City Metropolitan Area', 'Tri-State Area'],
    
    // Illinois
    'chicago': ['Chicagoland', 'Great Lakes Region'],
    
    // Washington
    'seattle': ['Puget Sound', 'Pacific Northwest'],
    
    // Colorado
    'denver': ['Denver Metro Area', 'Front Range'],
    
    // Massachusetts
    'boston': ['Greater Boston', 'New England']
  }
  
  // Check for direct city match
  if (regionMap[cityLower]) {
    return regionMap[cityLower]
  }
  
  // Check for state-level regions
  const stateRegions: Record<string, string[]> = {
    'ca': ['California'],
    'california': ['California'],
    'fl': ['Florida'],
    'florida': ['Florida'],
    'tx': ['Texas'],
    'texas': ['Texas'],
    'ny': ['New York State'],
    'new york': ['New York State'],
    'wa': ['Pacific Northwest'],
    'washington': ['Pacific Northwest'],
    'co': ['Rocky Mountain Region'],
    'colorado': ['Rocky Mountain Region']
  }
  
  return stateRegions[stateLower] || []
}

function csvToProvider(csvRow: CSVProvider, index: number): Provider {
  const now = new Date().toISOString()
  const id = (index + 1).toString()
  
  // Handle both CSV formats
  const providerName = csvRow.name || csvRow.title || 'Unknown Provider'
  const providerPhone = csvRow.phone || undefined
  const providerWebsite = csvRow.website || undefined
  const providerRating = csvRow.rating || csvRow.totalScore || undefined
  const providerReviewsCount = csvRow.reviewsCount || csvRow.totalReviews || undefined
  const providerCategory = csvRow.category || csvRow.categoryName || undefined
  
  // Parse address
  const parsedAddress = parseAddress(csvRow.address, csvRow.street, csvRow.city, csvRow.state, csvRow.zip)
  
  // Extract city from address if not provided
  const cityName = parsedAddress.city || (parsedAddress.city && parsedAddress.city.includes(',') ? parsedAddress.city.split(',')[0].trim() : undefined)
  
  // Default to CA if no state provided, or map from countryCode if available
  let defaultState = 'CA'
  if (csvRow.countryCode && csvRow.countryCode.toUpperCase() !== 'US') {
    // Skip non-US entries for now
    defaultState = 'CA'
  }
  
  const provider: Provider = {
    id,
    name: providerName,
    slug: generateSlug(providerName),
    phone: providerPhone,
    email: csvRow.email || undefined,
    website: providerWebsite,
    bookingUrl: csvRow.bookingLinks || csvRow.url || undefined,
    description: csvRow.description || `Professional mobile phlebotomy services. ${providerCategory || 'Medical laboratory'} providing at-home blood draw services.`,
    services: parseServices(csvRow.services || '', providerCategory, providerName),
    coverage: {
      states: parsedAddress.state ? [parsedAddress.state.toUpperCase()] : [defaultState],
      cities: cityName ? [cityName] : [],
      regions: getRegionForCity(cityName || '', parsedAddress.state || defaultState),
    },
    address: {
      street: parsedAddress.street,
      city: parsedAddress.city,
      state: parsedAddress.state?.toUpperCase(),
      zip: parsedAddress.zip,
    },
    coords: csvRow.lat && csvRow.lng ? {
      lat: parseFloat(csvRow.lat),
      lng: parseFloat(csvRow.lng)
    } : undefined,
    availability: parseAvailability(csvRow.availability || '', csvRow.businessStatus, csvRow.hours),
    payment: parsePayment(csvRow.payment || ''),
    rating: providerRating ? parseFloat(providerRating) : undefined,
    reviewsCount: providerReviewsCount ? parseInt(providerReviewsCount) : undefined,
    badges: parseBadges(csvRow.badges || ''),
    createdAt: now,
    updatedAt: now
  }

  return provider
}

async function importCSV(csvFilePath: string): Promise<void> {
  console.log(`🔍 Reading CSV file: ${csvFilePath}`)
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found: ${csvFilePath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
  
  console.log('📊 Parsing CSV data...')
  const parseResult = Papa.parse<CSVProvider>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '')
  })

  if (parseResult.errors.length > 0) {
    console.error('❌ CSV parsing errors:', parseResult.errors)
    process.exit(1)
  }

  console.log(`📋 Found ${parseResult.data.length} providers in CSV`)

  const providers: Provider[] = []
  const errors: string[] = []

  parseResult.data.forEach((csvRow, index) => {
    try {
      const provider = csvToProvider(csvRow, index)
      const validationResult = ProviderSchema.safeParse(provider)
      
      if (validationResult.success) {
        providers.push(validationResult.data)
      } else {
        errors.push(`Row ${index + 1}: ${validationResult.error.message}`)
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  if (errors.length > 0) {
    console.warn('⚠️  Validation warnings:')
    errors.forEach(error => console.warn(`   ${error}`))
  }

  console.log(`✅ Successfully validated ${providers.length} providers`)

  // Write to JSON file
  const outputPath = path.join(process.cwd(), 'data', 'providers.json')
  fs.writeFileSync(outputPath, JSON.stringify(providers, null, 2))
  
  console.log(`💾 Saved providers to: ${outputPath}`)
  console.log(`🎉 Import complete! ${providers.length} providers imported.`)
}

// Main execution
async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), 'data', 'providers.csv')
  
  console.log('🚀 Starting CSV import process...')
  console.log(`📁 CSV file path: ${csvPath}`)
  
  try {
    await importCSV(csvPath)
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { importCSV, csvToProvider }