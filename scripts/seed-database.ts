#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { type Provider } from '../lib/schemas'

const prisma = new PrismaClient()

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Read the providers JSON file
    const providersPath = path.join(process.cwd(), 'data', 'providers.json')
    const providersData = JSON.parse(fs.readFileSync(providersPath, 'utf-8')) as Provider[]
    
    console.log(`📋 Found ${providersData.length} providers to seed`)

    // Clear existing data
    console.log('🧹 Cleaning existing data...')
    await prisma.providerBadge.deleteMany()
    await prisma.providerPayment.deleteMany() 
    await prisma.providerAvailability.deleteMany()
    await prisma.providerCoords.deleteMany()
    await prisma.providerAddress.deleteMany()
    await prisma.providerCoverage.deleteMany()
    await prisma.providerService.deleteMany()
    await prisma.provider.deleteMany()
    await prisma.badge.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.availability.deleteMany()
    await prisma.city.deleteMany()
    await prisma.state.deleteMany()
    await prisma.service.deleteMany()

    // Seed reference data
    console.log('🔧 Seeding reference data...')
    
    // Services
    const services = [
      'At-Home Blood Draw',
      'Corporate Wellness', 
      'Pediatric',
      'Geriatric',
      'Fertility/IVF',
      'Specimen Pickup',
      'Lab Partner'
    ]
    
    for (const serviceName of services) {
      await prisma.service.create({
        data: { name: serviceName }
      })
    }

    // Availability options
    const availabilities = ['Weekdays', 'Weekends', 'Evenings', '24/7']
    for (const availName of availabilities) {
      await prisma.availability.create({
        data: { name: availName }
      })
    }

    // Payment methods
    const payments = ['Cash', 'Major Insurance', 'Medicare', 'HSA/FSA']
    for (const paymentName of payments) {
      await prisma.payment.create({
        data: { name: paymentName }
      })
    }

    // Badges
    const badges = ['Certified', 'Background-Checked', 'Insured', 'HIPAA-Compliant']
    for (const badgeName of badges) {
      await prisma.badge.create({
        data: { name: badgeName }
      })
    }

    // States
    const states = new Set<string>()
    providersData.forEach(p => {
      p.coverage.states.forEach(state => states.add(state))
    })
    
    const stateMap = new Map<string, string>()
    for (const stateAbbr of Array.from(states)) {
      const state = await prisma.state.create({
        data: { 
          name: getStateName(stateAbbr),
          abbr: stateAbbr 
        }
      })
      stateMap.set(stateAbbr, state.id)
    }

    // Cities
    const cityMap = new Map<string, string>()
    const citySet = new Set<string>()
    providersData.forEach(p => {
      p.coverage.cities?.forEach(city => {
        const key = `${city}|${p.coverage.states[0]}`
        citySet.add(key)
      })
    })

    for (const cityKey of Array.from(citySet)) {
      const [cityName, stateAbbr] = cityKey.split('|')
      const stateId = stateMap.get(stateAbbr)
      if (stateId && cityName) {
        const city = await prisma.city.create({
          data: {
            name: cityName,
            stateId: stateId,
            slug: cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          }
        })
        cityMap.set(cityKey, city.id)
      }
    }

    // Seed providers
    console.log('👥 Seeding providers...')
    let successCount = 0

    for (const providerData of providersData) {
      try {
        // Create provider
        const provider = await prisma.provider.create({
          data: {
            name: providerData.name,
            slug: providerData.slug,
            phone: providerData.phone,
            email: providerData.email,
            website: providerData.website,
            bookingUrl: providerData.bookingUrl,
            description: providerData.description,
            rating: providerData.rating,
            reviewsCount: providerData.reviewsCount
          }
        })

        // Add services
        if (providerData.services?.length > 0) {
          const serviceRecords = await prisma.service.findMany({
            where: { name: { in: providerData.services } }
          })
          
          for (const service of serviceRecords) {
            await prisma.providerService.create({
              data: {
                providerId: provider.id,
                serviceId: service.id
              }
            })
          }
        }

        // Add coverage
        for (const stateAbbr of providerData.coverage.states) {
          const stateId = stateMap.get(stateAbbr)
          if (stateId) {
            if (providerData.coverage.cities && providerData.coverage.cities.length > 0) {
              for (const cityName of providerData.coverage.cities) {
                const cityKey = `${cityName}|${stateAbbr}`
                const cityId = cityMap.get(cityKey)
                await prisma.providerCoverage.create({
                  data: {
                    providerId: provider.id,
                    stateId: stateId,
                    cityId: cityId
                  }
                })
              }
            } else {
              await prisma.providerCoverage.create({
                data: {
                  providerId: provider.id,
                  stateId: stateId
                }
              })
            }
          }
        }

        // Add address
        if (providerData.address && (
          providerData.address.street || 
          providerData.address.city || 
          providerData.address.state || 
          providerData.address.zip
        )) {
          await prisma.providerAddress.create({
            data: {
              providerId: provider.id,
              street: providerData.address.street,
              city: providerData.address.city,
              state: providerData.address.state,
              zip: providerData.address.zip
            }
          })
        }

        // Add coordinates
        if (providerData.coords) {
          await prisma.providerCoords.create({
            data: {
              providerId: provider.id,
              lat: providerData.coords.lat,
              lng: providerData.coords.lng
            }
          })
        }

        // Add availability
        if (providerData.availability && providerData.availability.length > 0) {
          const availRecords = await prisma.availability.findMany({
            where: { name: { in: providerData.availability } }
          })
          
          for (const avail of availRecords) {
            await prisma.providerAvailability.create({
              data: {
                providerId: provider.id,
                availabilityId: avail.id
              }
            })
          }
        }

        // Add payment methods
        if (providerData.payment && providerData.payment.length > 0) {
          const paymentRecords = await prisma.payment.findMany({
            where: { name: { in: providerData.payment } }
          })
          
          for (const payment of paymentRecords) {
            await prisma.providerPayment.create({
              data: {
                providerId: provider.id,
                paymentId: payment.id
              }
            })
          }
        }

        // Add badges
        if (providerData.badges && providerData.badges.length > 0) {
          const badgeRecords = await prisma.badge.findMany({
            where: { name: { in: providerData.badges } }
          })
          
          for (const badge of badgeRecords) {
            await prisma.providerBadge.create({
              data: {
                providerId: provider.id,
                badgeId: badge.id
              }
            })
          }
        }

        successCount++
        console.log(`✅ Seeded provider: ${provider.name}`)

      } catch (error) {
        console.error(`❌ Failed to seed provider: ${providerData.name}`, error)
      }
    }

    console.log(`🎉 Successfully seeded ${successCount}/${providersData.length} providers`)
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

function getStateName(abbr: string): string {
  const stateNames: Record<string, string> = {
    'CA': 'California',
    'TX': 'Texas',
    'FL': 'Florida',
    'NY': 'New York',
    // Add more as needed
  }
  return stateNames[abbr] || abbr
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database seeding failed:', error)
      process.exit(1)
    })
}

export { seedDatabase }