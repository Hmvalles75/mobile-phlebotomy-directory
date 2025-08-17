#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugMobileAL() {
  try {
    console.log('Debugging Mobile, AL query...')
    
    // Check states in database
    const states = await prisma.state.findMany({
      where: {
        OR: [
          { abbr: 'AL' },
          { name: { contains: 'Alabama' } }
        ]
      }
    })
    console.log('Alabama states found:', states)

    // Check cities named "Mobile"
    const mobileCities = await prisma.city.findMany({
      where: {
        name: { contains: 'mobile' }
      },
      include: { state: true }
    })
    console.log('Mobile cities found:', mobileCities)

    // Check providers with Mobile in address
    const providersWithMobileAddress = await prisma.provider.findMany({
      where: {
        address: {
          city: { contains: 'mobile' }
        }
      },
      include: { address: true }
    })
    console.log('Providers with Mobile address:', providersWithMobileAddress.length)
    providersWithMobileAddress.slice(0, 3).forEach(p => {
      console.log(`- ${p.name}: ${p.address?.city}, ${p.address?.state}`)
    })

    // Check providers with Mobile coverage
    const providersWithMobileCoverage = await prisma.provider.findMany({
      where: {
        coverage: {
          some: {
            city: { name: { contains: 'mobile' } }
          }
        }
      },
      include: { 
        coverage: { 
          include: { city: true, state: true } 
        } 
      }
    })
    console.log('Providers with Mobile coverage:', providersWithMobileCoverage.length)
    providersWithMobileCoverage.slice(0, 3).forEach(p => {
      console.log(`- ${p.name}`)
      p.coverage.forEach(c => {
        if (c.city?.name.toLowerCase().includes('mobile')) {
          console.log(`  Coverage: ${c.city.name}, ${c.state.abbr}`)
        }
      })
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugMobileAL()