import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getStatesWithProviders() {
  console.log('📊 Analyzing states with provider coverage...\n')

  // Get all provider coverage with state info
  const coverage = await prisma.providerCoverage.findMany({
    include: {
      state: true,
      provider: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    }
  })

  // Group by state
  const stateMap = new Map<string, {
    state: any,
    providerCount: number,
    providers: Set<string>
  }>()

  for (const cov of coverage) {
    if (!cov.state || !cov.provider) continue
    // Only count active/verified providers
    if (cov.provider.status !== 'ACTIVE' && cov.provider.status !== 'VERIFIED') continue

    const key = cov.state.abbr
    const existing = stateMap.get(key)

    if (existing) {
      existing.providers.add(cov.provider.id)
    } else {
      stateMap.set(key, {
        state: cov.state,
        providerCount: 0,
        providers: new Set([cov.provider.id])
      })
    }
  }

  // Convert to array and count unique providers
  const states = Array.from(stateMap.values())
    .map(item => ({
      ...item.state,
      providerCount: item.providers.size
    }))
    .sort((a, b) => b.providerCount - a.providerCount)

  console.log('📍 States with Provider Coverage:\n')
  console.log('State                           Providers')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  states.forEach((state) => {
    const name = `${state.name} (${state.abbr})`
    console.log(`${name.padEnd(30)} ${state.providerCount.toString().padStart(3)}`)
  })

  console.log('\n📊 Total states with coverage:', states.length)
  console.log('📊 Total unique providers:', Array.from(stateMap.values()).reduce((sum, s) => sum + s.providers.size, 0))

  await prisma.$disconnect()
}

getStatesWithProviders()
