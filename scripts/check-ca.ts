#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCA() {
  try {
    const caProviders = await prisma.provider.findMany({
      where: {
        OR: [
          { address: { state: 'CA' } },
          { coverage: { some: { state: { abbr: 'CA' } } } }
        ]
      },
      include: { 
        address: true, 
        coverage: { include: { city: true, state: true } } 
      }
    })
    
    console.log(`CA Providers: ${caProviders.length}`)
    caProviders.forEach(p => {
      console.log(`- ${p.name}`)
      if (p.address) console.log(`  Address: ${p.address.city}, ${p.address.state}`)
      p.coverage.forEach(c => console.log(`  Coverage: ${c.city?.name || 'statewide'}, ${c.state.abbr}`))
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCA()