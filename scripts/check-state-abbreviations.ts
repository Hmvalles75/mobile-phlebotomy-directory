#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStateAbbreviations() {
  try {
    const states = await prisma.state.findMany({
      orderBy: { abbr: 'asc' }
    })
    
    console.log('All state abbreviations in database:')
    console.log('===================================')
    states.forEach(state => {
      console.log(`${state.abbr} - ${state.name}`)
    })

    // Check how many use full names vs abbreviations
    const fullNames = states.filter(s => s.abbr.length > 2)
    const abbreviations = states.filter(s => s.abbr.length <= 2)
    
    console.log(`\nFull names as abbr: ${fullNames.length}`)
    console.log(`Actual abbreviations: ${abbreviations.length}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStateAbbreviations()