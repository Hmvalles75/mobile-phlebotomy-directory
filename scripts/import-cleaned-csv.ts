#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'
import { ProviderSchema, type Provider } from '../lib/schemas'

interface CleanedCSVProvider {
  title?: string
  totalScore?: string
  reviewsCount?: string
  street?: string
  city?: string
  'regions serviced'?: string
  state?: string
  countryCode?: string
  website?: string
  phone?: string
  categoryName?: string
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

function parseServices(category?: string, name?: string): Array<'At-Home Blood Draw' | 'Corporate Wellness' | 'Pediatric' | 'Geriatric' | 'Fertility/IVF' | 'Specimen Pickup' | 'Lab Partner'> {
  const services: Array<'At-Home Blood Draw' | 'Corporate Wellness' | 'Pediatric' | 'Geriatric' | 'Fertility/IVF' | 'Specimen Pickup' | 'Lab Partner'> = ['At-Home Blood Draw']
  
  if (category && typeof category === 'string') {
    const cat = category.toLowerCase()
    if (cat.includes('medical laboratory') || cat.includes('laboratory')) {
      services.push('Specimen Pickup', 'Lab Partner')
    }
    if (cat.includes('health care') || cat.includes('healthcare')) {
      services.push('Corporate Wellness')
    }
    if (cat.includes('blood testing')) {
      // Blood testing is core service, already included
    }
  }
  
  if (name && typeof name === 'string') {
    const nameLower = name.toLowerCase()
    
    if (nameLower.includes('corporate') || nameLower.includes('workplace') || nameLower.includes('employee')) {
      services.push('Corporate Wellness')
    }
    if (nameLower.includes('pediatric') || nameLower.includes('children') || nameLower.includes('kid')) {
      services.push('Pediatric')
    }
    if (nameLower.includes('geriatric') || nameLower.includes('senior') || nameLower.includes('elderly')) {
      services.push('Geriatric')
    }
    if (nameLower.includes('fertility') || nameLower.includes('ivf') || nameLower.includes('reproductive')) {
      services.push('Fertility/IVF')
    }
    if (nameLower.includes('laboratory') || nameLower.includes('lab ')) {
      services.push('Lab Partner')
    }
    if (nameLower.includes('specimen') || nameLower.includes('collection') || nameLower.includes('pickup')) {
      services.push('Specimen Pickup')
    }
    if (nameLower.includes('wellness') || nameLower.includes('health screening')) {
      services.push('Corporate Wellness')
    }
  }
  
  return Array.from(new Set(services))
}

function parseRegions(regionsStr?: string): string[] {
  if (!regionsStr || regionsStr.trim() === '') return []
  
  // Convert regional names to slugs
  const regionMap: Record<string, string> = {
    'tri-state': 'tri-state-area',
    'tri state': 'tri-state-area',
    'tri-state area': 'tri-state-area',
    'sf bay area': 'sf-bay-area',
    'san francisco bay area': 'sf-bay-area',
    'bay area': 'sf-bay-area',
    'san diego county': 'san-diego-county',
    'orange county': 'orange-county',
    'los angeles county': 'los-angeles-county',
    'riverside county': 'riverside-county',
    'sacramento valley': 'sacramento-valley',
    'central valley': 'central-valley',
    'inland empire': 'inland-empire',
    'north bay': 'north-bay',
    'south bay': 'south-bay',
    'east bay': 'east-bay',
    'peninsula': 'peninsula',
    'silicon valley': 'silicon-valley'
  }
  
  return regionsStr
    .split(',')
    .map(r => r.trim().toLowerCase())
    .map(r => regionMap[r] || r.replace(/\s+/g, '-'))
    .filter(r => r.length > 0)
}

function normalizeState(state?: string): string {
  if (!state) return 'CA' // Default
  
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'conneticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
  }
  
  const normalized = state.toLowerCase().trim()
  return stateMap[normalized] || state.toUpperCase()
}

function csvToProvider(csvRow: CleanedCSVProvider, index: number): Provider {
  const now = new Date().toISOString()
  const id = (index + 1).toString()
  
  const providerName = csvRow.title || 'Unknown Provider'
  const providerPhone = csvRow.phone || undefined
  const providerWebsite = csvRow.website || undefined
  const providerRating = csvRow.totalScore ? parseFloat(csvRow.totalScore) : undefined
  const providerReviewsCount = csvRow.reviewsCount ? parseInt(csvRow.reviewsCount) : undefined
  const providerCategory = csvRow.categoryName || undefined
  
  // Handle regional coverage
  const regions = parseRegions(csvRow['regions serviced'])
  const stateAbbr = normalizeState(csvRow.state)
  
  const provider: Provider = {
    id,
    name: providerName,
    slug: generateSlug(providerName),
    phone: providerPhone,
    website: providerWebsite,
    bookingUrl: csvRow.url || undefined,
    description: `Professional mobile phlebotomy services. ${providerCategory || 'Medical laboratory'} providing at-home blood draw services.`,
    services: parseServices(providerCategory, providerName),
    coverage: {
      states: [stateAbbr],
      cities: csvRow.city ? [csvRow.city] : [],
      regions: regions.length > 0 ? regions : undefined
    },
    address: {
      street: csvRow.street || '',
      city: csvRow.city || '',
      state: stateAbbr || '',
      zip: ''
    },
    availability: ['Weekdays'],
    payment: ['Cash', 'Major Insurance'],
    rating: providerRating,
    reviewsCount: providerReviewsCount,
    badges: ['Certified', 'Insured'],
    createdAt: now,
    updatedAt: now
  }

  return provider
}

async function importCleanedCSV(csvFilePath: string): Promise<void> {
  console.log(`🔍 Reading cleaned CSV file: ${csvFilePath}`)
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found: ${csvFilePath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
  
  console.log('📊 Parsing CSV data...')
  const parseResult = Papa.parse<CleanedCSVProvider>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  })

  if (parseResult.errors.length > 0) {
    console.warn('⚠️ CSV parsing warnings:', parseResult.errors)
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
        errors.push(`Row ${index + 1} (${csvRow.title}): ${validationResult.error.message}`)
      }
    } catch (error) {
      errors.push(`Row ${index + 1} (${csvRow.title}): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  if (errors.length > 0) {
    console.warn('⚠️ Validation warnings:')
    errors.slice(0, 10).forEach(error => console.warn(`   ${error}`))
    if (errors.length > 10) {
      console.warn(`   ... and ${errors.length - 10} more warnings`)
    }
  }

  console.log(`✅ Successfully validated ${providers.length} providers`)

  // Show regional coverage stats
  const providersWithRegions = providers.filter(p => p.coverage.regions && p.coverage.regions.length > 0)
  console.log(`🌐 Providers with regional coverage: ${providersWithRegions.length}`)
  
  if (providersWithRegions.length > 0) {
    console.log('📍 Regional coverage examples:')
    providersWithRegions.slice(0, 5).forEach(p => {
      console.log(`   ${p.name}: ${p.coverage.regions?.join(', ')}`)
    })
  }

  // Write to JSON file
  const outputPath = path.join(process.cwd(), 'data', 'providers.json')
  fs.writeFileSync(outputPath, JSON.stringify(providers, null, 2))
  
  console.log(`💾 Saved providers to: ${outputPath}`)
  console.log(`🎉 Import complete! ${providers.length} providers imported with regional data.`)
}

// Main execution
async function main() {
  const csvPath = process.argv[2] || 'cleaned_data_mobile_phleb.csv'
  
  console.log('🚀 Starting cleaned CSV import process...')
  console.log(`📁 CSV file path: ${csvPath}`)
  
  try {
    await importCleanedCSV(csvPath)
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { importCleanedCSV }