#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLosAngeles() {
  try {
    // Check if we have any providers with LA in their address
    const providersWithLA = await prisma.provider.findMany({
      where: {
        OR: [
          { address: { city: { contains: 'Los Angeles' } } },
          { address: { city: { contains: 'los angeles' } } },
          { address: { city: { contains: 'LA' } } },
        ]
      },
      include: { address: true }
    })

    console.log(`Found ${providersWithLA.length} providers with LA in address:`)
    providersWithLA.forEach(p => {
      console.log(`- ${p.name}: ${p.address?.city}, ${p.address?.state}`)
    })

    // Check coverage
    const providersWithLACoverage = await prisma.provider.findMany({
      where: {
        coverage: {
          some: {
            city: { name: { contains: 'Los Angeles' } }
          }
        }
      },
      include: { 
        coverage: { 
          include: { city: true, state: true } 
        } 
      }
    })

    console.log(`\nFound ${providersWithLACoverage.length} providers with LA coverage:`)
    providersWithLACoverage.forEach(p => {
      console.log(`- ${p.name}`)
      p.coverage.forEach(c => {
        console.log(`  Coverage: ${c.city?.name || 'statewide'}, ${c.state.abbr}`)
      })
    })

    // Check all cities in CA
    const citiesInCA = await prisma.city.findMany({
      where: {
        state: { abbr: 'CA' }
      },
      include: { state: true }
    })

    console.log(`\nCities in CA (${citiesInCA.length}):`)
    citiesInCA.slice(0, 10).forEach(city => {
      console.log(`- ${city.name}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLosAngeles()