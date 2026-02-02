import { prisma } from '@/lib/prisma'

async function analyzeLeadCoverage() {
  console.log('📊 Lead Coverage Gap Analysis\n')
  console.log('=' .repeat(60))

  // Get all leads from the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    select: {
      id: true,
      city: true,
      state: true,
      zip: true,
      status: true,
      routedToId: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`\n📈 LEAD VOLUME (Last 30 days): ${leads.length} total leads\n`)

  // Group leads by state
  const leadsByState: Record<string, any[]> = {}
  for (const lead of leads) {
    const state = lead.state?.toUpperCase() || 'UNKNOWN'
    if (!leadsByState[state]) leadsByState[state] = []
    leadsByState[state].push(lead)
  }

  // Sort states by lead volume
  const sortedStates = Object.entries(leadsByState)
    .sort((a, b) => b[1].length - a[1].length)

  console.log('🗺️  LEADS BY STATE (Top 15):')
  console.log('-'.repeat(60))

  for (const [state, stateLeads] of sortedStates.slice(0, 15)) {
    const routed = stateLeads.filter(l => l.routedToId).length
    const unrouted = stateLeads.length - routed
    const routeRate = ((routed / stateLeads.length) * 100).toFixed(0)

    // Count providers in this state
    const providerCount = await prisma.provider.count({
      where: { primaryState: state }
    })

    // Count providers eligible for leads in this state
    const eligibleCount = await prisma.provider.count({
      where: {
        primaryState: state,
        eligibleForLeads: true
      }
    })

    console.log(`${state}: ${stateLeads.length} leads | Routed: ${routed} (${routeRate}%) | Providers: ${providerCount} (${eligibleCount} eligible)`)

    if (unrouted > 0 && eligibleCount === 0) {
      console.log(`   ⚠️  COVERAGE GAP - ${unrouted} unrouted leads, no eligible providers!`)
    }
  }

  // Group leads by city
  console.log('\n\n🏙️  TOP CITIES BY LEAD VOLUME:')
  console.log('-'.repeat(60))

  const leadsByCity: Record<string, any[]> = {}
  for (const lead of leads) {
    const key = `${lead.city}, ${lead.state}`.toUpperCase()
    if (!leadsByCity[key]) leadsByCity[key] = []
    leadsByCity[key].push(lead)
  }

  const sortedCities = Object.entries(leadsByCity)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)

  for (const [cityState, cityLeads] of sortedCities) {
    const [city, state] = cityState.split(', ')
    const routed = cityLeads.filter(l => l.routedToId).length
    const unrouted = cityLeads.length - routed

    // Find providers in or near this city
    const nearbyProviders = await prisma.provider.findMany({
      where: {
        OR: [
          { primaryCity: { contains: city, mode: 'insensitive' } },
          { primaryState: state }
        ]
      },
      select: {
        name: true,
        primaryCity: true,
        eligibleForLeads: true,
        email: true,
        phone: true,
        smsOptInAt: true
      },
      take: 5
    })

    const eligibleNearby = nearbyProviders.filter(p => p.eligibleForLeads).length

    console.log(`\n${cityState}: ${cityLeads.length} leads | Routed: ${routed} | Unrouted: ${unrouted}`)

    if (unrouted > 0) {
      console.log(`   Nearby providers: ${nearbyProviders.length} (${eligibleNearby} eligible for leads)`)

      // Show providers who could be contacted
      const notEligible = nearbyProviders.filter(p => !p.eligibleForLeads)
      if (notEligible.length > 0) {
        console.log(`   📧 Providers to contact:`)
        for (const p of notEligible.slice(0, 3)) {
          console.log(`      - ${p.name} (${p.primaryCity}) - ${p.email || 'no email'} | ${p.phone || 'no phone'}`)
        }
      }
    }
  }

  // Find states with leads but few/no eligible providers
  console.log('\n\n🚨 CRITICAL COVERAGE GAPS (Leads but no eligible providers):')
  console.log('-'.repeat(60))

  for (const [state, stateLeads] of sortedStates) {
    const eligibleCount = await prisma.provider.count({
      where: {
        primaryState: state,
        eligibleForLeads: true
      }
    })

    if (stateLeads.length >= 2 && eligibleCount === 0) {
      // Find providers in this state who could be contacted
      const providers = await prisma.provider.findMany({
        where: { primaryState: state },
        select: {
          name: true,
          primaryCity: true,
          email: true,
          phone: true,
          smsOptInAt: true
        },
        take: 10
      })

      console.log(`\n${state}: ${stateLeads.length} leads, 0 eligible providers`)
      console.log(`   Total providers in state: ${providers.length}`)

      if (providers.length > 0) {
        console.log(`   📧 Providers to outreach:`)
        for (const p of providers) {
          const contact = p.email ? `📧 ${p.email}` : (p.phone ? `📱 ${p.phone}` : 'no contact')
          console.log(`      - ${p.name} (${p.primaryCity}) - ${contact}`)
        }
      } else {
        console.log(`   ❌ No providers in database for this state!`)
      }
    }
  }

  // Summary of outreach opportunities
  console.log('\n\n📋 OUTREACH OPPORTUNITY SUMMARY:')
  console.log('-'.repeat(60))

  // Get all providers with contact info who aren't eligible for leads
  const outreachCandidates = await prisma.provider.findMany({
    where: {
      eligibleForLeads: false,
      OR: [
        { email: { not: null } },
        { phone: { not: null } }
      ],
      primaryState: {
        in: sortedStates.slice(0, 10).map(([state]) => state)
      }
    },
    select: {
      id: true,
      name: true,
      primaryCity: true,
      primaryState: true,
      email: true,
      phone: true,
      smsOptInAt: true
    },
    orderBy: { primaryState: 'asc' }
  })

  console.log(`\nTotal outreach candidates in top 10 lead states: ${outreachCandidates.length}`)

  const withEmail = outreachCandidates.filter(p => p.email).length
  const withPhone = outreachCandidates.filter(p => p.phone).length
  const withSmsOptIn = outreachCandidates.filter(p => p.smsOptInAt).length

  console.log(`   With email: ${withEmail}`)
  console.log(`   With phone: ${withPhone}`)
  console.log(`   Already SMS opted in: ${withSmsOptIn}`)

  // Group by state for easy outreach
  const candidatesByState: Record<string, typeof outreachCandidates> = {}
  for (const p of outreachCandidates) {
    if (!p.primaryState) continue
    if (!candidatesByState[p.primaryState]) candidatesByState[p.primaryState] = []
    candidatesByState[p.primaryState].push(p)
  }

  console.log('\n📍 Candidates by state:')
  for (const [state, candidates] of Object.entries(candidatesByState).sort((a, b) => b[1].length - a[1].length).slice(0, 10)) {
    const stateLeadCount = leadsByState[state]?.length || 0
    console.log(`   ${state}: ${candidates.length} providers to contact (${stateLeadCount} recent leads)`)
  }
}

analyzeLeadCoverage()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
