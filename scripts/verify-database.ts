#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDatabase() {
  console.log('🔍 Verifying database contents...\n')

  try {
    // Count providers
    const providerCount = await prisma.provider.count()
    console.log(`📊 Providers: ${providerCount}`)

    // Count reference data
    const serviceCount = await prisma.service.count()
    const stateCount = await prisma.state.count() 
    const cityCount = await prisma.city.count()
    const availabilityCount = await prisma.availability.count()
    const paymentCount = await prisma.payment.count()
    const badgeCount = await prisma.badge.count()

    console.log(`🔧 Reference data:`)
    console.log(`   - Services: ${serviceCount}`)
    console.log(`   - States: ${stateCount}`)
    console.log(`   - Cities: ${cityCount}`)
    console.log(`   - Availability: ${availabilityCount}`)
    console.log(`   - Payments: ${paymentCount}`)
    console.log(`   - Badges: ${badgeCount}`)

    // Sample some providers with relations
    console.log(`\n👥 Sample providers:`)
    const providers = await prisma.provider.findMany({
      take: 3,
      include: {
        services: {
          include: {
            service: true
          }
        },
        coverage: {
          include: {
            state: true,
            city: true
          }
        },
        address: true,
        coords: true,
        availability: {
          include: {
            availability: true
          }
        },
        payment: {
          include: {
            payment: true
          }
        },
        badges: {
          include: {
            badge: true
          }
        }
      }
    })

    providers.forEach((provider, index) => {
      console.log(`\n${index + 1}. ${provider.name}`)
      console.log(`   Phone: ${provider.phone}`)
      console.log(`   Website: ${provider.website}`)
      console.log(`   Services: ${provider.services.map(s => s.service.name).join(', ')}`)
      console.log(`   Coverage: ${provider.coverage.map(c => 
        c.city ? `${c.city.name}, ${c.state.abbr}` : c.state.abbr
      ).join('; ')}`)
      if (provider.address) {
        console.log(`   Address: ${[
          provider.address.street,
          provider.address.city, 
          provider.address.state,
          provider.address.zip
        ].filter(Boolean).join(', ')}`)
      }
      console.log(`   Availability: ${provider.availability.map(a => a.availability.name).join(', ')}`)
      console.log(`   Payment: ${provider.payment.map(p => p.payment.name).join(', ')}`)
      console.log(`   Badges: ${provider.badges.map(b => b.badge.name).join(', ')}`)
      if (provider.rating) {
        console.log(`   Rating: ${provider.rating}/5 (${provider.reviewsCount || 0} reviews)`)
      } else {
        console.log(`   Rating: No rating data`)
      }
    })

    console.log(`\n✅ Database verification complete!`)
    
  } catch (error) {
    console.error('❌ Database verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  verifyDatabase()
}

export { verifyDatabase }