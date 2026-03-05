import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Already contacted
const contacted = [
  'phlebitomynerd@gmail.com',
  'xtreamvein@gmail.com',
  'info@collabdiagnostics.com',
  'info@essentiallifediag.com',
  'myinfo@trublood.org'
].map(e => e.toLowerCase())

async function main() {
  // Get all providers with real emails
  const providers = await prisma.provider.findMany({
    where: {
      email: { not: null }
    },
    select: {
      id: true,
      name: true,
      email: true,
      primaryCity: true,
      primaryState: true,
      eligibleForLeads: true
    },
    orderBy: { primaryState: 'asc' }
  })

  // Filter: has real email, not contacted, not already eligible
  const candidates = providers.filter(p => {
    if (!p.email) return false
    if (p.email.includes('filler@')) return false
    if (contacted.includes(p.email.toLowerCase())) return false
    if (p.eligibleForLeads) return false
    return true
  })

  console.log('=== Outreach Candidates ===')
  console.log(`Total providers: ${providers.length}`)
  console.log(`Already eligible: ${providers.filter(p => p.eligibleForLeads).length}`)
  console.log(`Already contacted: ${contacted.length}`)
  console.log(`Candidates for outreach: ${candidates.length}`)
  console.log('')

  // Group by state
  const byState: Record<string, typeof candidates> = {}
  candidates.forEach(p => {
    const state = p.primaryState || 'Unknown'
    if (!byState[state]) byState[state] = []
    byState[state].push(p)
  })

  Object.keys(byState).sort().forEach(state => {
    console.log(`--- ${state} (${byState[state].length}) ---`)
    byState[state].forEach(p => {
      console.log(`  ${p.name}`)
      console.log(`    Email: ${p.email}`)
      console.log(`    City: ${p.primaryCity || 'N/A'}`)
    })
    console.log('')
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
