import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStateMismatch() {
  try {
    // Check all states in database
    const allStates = await prisma.state.findMany()
    console.log('All states in database:')
    allStates.forEach(state => {
      if (state.abbr.includes('OH') || state.name.toLowerCase().includes('ohio')) {
        console.log(`*** OHIO: Name="${state.name}" Abbr="${state.abbr}"`)
      } else {
        console.log(`    Name="${state.name}" Abbr="${state.abbr}"`)
      }
    })

    // Check if there's a mismatch between the mapping and what's in the database
    const ohioState = await prisma.state.findFirst({
      where: {
        OR: [
          { abbr: 'OH' },
          { abbr: 'OHIO' },
          { name: 'Ohio' },
          { name: 'OHIO' },
          { name: 'OH' }
        ]
      }
    })

    if (ohioState) {
      console.log(`\nOhio state found: Name="${ohioState.name}" Abbr="${ohioState.abbr}"`)
      
      // Check providers with this state
      const providersCount = await prisma.providerCoverage.count({
        where: {
          stateId: ohioState.id
        }
      })
      
      console.log(`Providers with Ohio coverage: ${providersCount}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStateMismatch()