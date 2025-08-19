import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkOhioProviders() {
  try {
    // First check if OH state exists in the database
    const ohioState = await prisma.state.findFirst({
      where: {
        OR: [
          { abbr: 'OH' },
          { name: 'Ohio' },
          { name: 'OHIO' }
        ]
      }
    })

    if (!ohioState) {
      console.log('Ohio state not found in states table')
      
      // Check all states to see what's there
      const allStates = await prisma.state.findMany()
      console.log('\nAll states in database:')
      allStates.forEach(state => {
        console.log(`- ${state.name} (${state.abbr})`)
      })
      return
    }

    console.log(`Found Ohio state: ${ohioState.name} (${ohioState.abbr})`)

    // Check for providers with Ohio coverage
    const ohioProviders = await prisma.provider.findMany({
      where: {
        OR: [
          {
            coverage: {
              some: {
                stateId: ohioState.id
              }
            }
          },
          {
            address: {
              OR: [
                { state: 'OH' },
                { state: 'Ohio' },
                { state: 'OHIO' },
                { city: { contains: 'Cincinnati' } }
              ]
            }
          }
        ]
      },
      include: {
        address: true,
        coverage: {
          include: {
            state: true,
            city: true
          }
        }
      }
    })

    console.log(`\nFound ${ohioProviders.length} Ohio providers in database`)
    
    if (ohioProviders.length > 0) {
      console.log('\nFirst 10 Ohio providers:')
      ohioProviders.slice(0, 10).forEach(provider => {
        console.log(`- ${provider.name} in ${provider.address?.city || 'Unknown city'}, ${provider.address?.state || 'Unknown state'}`)
      })
    }

    // Check specifically for Cincinnati in addresses
    const cincinnatiProviders = await prisma.provider.findMany({
      where: {
        address: {
          city: {
            contains: 'Cincinnati'
          }
        }
      },
      include: {
        address: true
      }
    })

    console.log(`\nFound ${cincinnatiProviders.length} Cincinnati providers specifically:`)
    cincinnatiProviders.forEach(provider => {
      console.log(`- ${provider.name} at ${provider.address?.street || 'No street'}, ${provider.address?.city}`)
    })
    
  } catch (error) {
    console.error('Error checking Ohio providers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOhioProviders()