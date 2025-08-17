const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkStates() {
  try {
    console.log('🔍 Checking states in database...\n')
    
    // Get all states
    const states = await prisma.state.findMany()
    console.log('📊 States in database:')
    states.forEach((state, index) => {
      console.log(`${index + 1}. ${state.name} (${state.abbr})`)
    })
    
    console.log('\n🏥 Provider coverage breakdown:')
    
    // Get coverage stats by state
    for (const state of states.slice(0, 10)) { // Check first 10 states
      const coverageCount = await prisma.providerCoverage.count({
        where: {
          state: { abbr: state.abbr }
        }
      })
      
      const providerCount = await prisma.provider.count({
        where: {
          coverage: {
            some: {
              state: { abbr: state.abbr }
            }
          }
        }
      })
      
      console.log(`   ${state.name} (${state.abbr}): ${providerCount} providers, ${coverageCount} coverage entries`)
    }
    
    console.log('\n🔍 Sample provider coverage:')
    const sampleProviders = await prisma.provider.findMany({
      take: 5,
      include: {
        coverage: {
          include: {
            state: true,
            city: true
          }
        }
      }
    })
    
    sampleProviders.forEach((provider, index) => {
      console.log(`${index + 1}. ${provider.name}`)
      provider.coverage.forEach(cov => {
        console.log(`   - ${cov.city?.name || 'Statewide'}, ${cov.state.name} (${cov.state.abbr})`)
      })
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStates()