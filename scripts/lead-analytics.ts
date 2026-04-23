import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const allLeads = await prisma.lead.findMany({
    select: {
      id: true, createdAt: true, source: true, gclid: true,
      preferredProviderId: true, status: true, city: true, state: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Total leads in DB: ${allLeads.length}\n`)

  // ========== QUERY 1: Leads by month ==========
  const byMonth = new Map<string, number>()
  for (const lead of allLeads) {
    const ym = lead.createdAt.toISOString().slice(0, 7)  // YYYY-MM
    byMonth.set(ym, (byMonth.get(ym) || 0) + 1)
  }
  console.log(`=== QUERY 1: Leads by month ===`)
  console.log(`month     | count`)
  console.log(`-`.repeat(20))
  for (const [ym, count] of Array.from(byMonth.entries()).sort()) {
    console.log(`${ym}   | ${count}`)
  }

  // ========== QUERY 2: Lead attribution ==========
  // Lead model captures: source, gclid, preferredProviderId
  // (Landing page / referrer / utmSource are only on PendingSubmission, not Lead)
  const bySource = new Map<string, number>()
  let withGclid = 0
  let fromProviderPage = 0
  for (const lead of allLeads) {
    bySource.set(lead.source, (bySource.get(lead.source) || 0) + 1)
    if (lead.gclid) withGclid++
    if (lead.preferredProviderId) fromProviderPage++
  }
  console.log(`\n=== QUERY 2: Lead attribution ===`)
  console.log(`(Only source/gclid/preferredProviderId are captured on Lead.`)
  console.log(` Full landing-page/referrer/utmSource tracking exists on PendingSubmission`)
  console.log(` [provider signups], not Lead [patient submissions].)\n`)
  console.log(`By source field:`)
  for (const [src, count] of Array.from(bySource.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src.padEnd(30)} ${count} (${((count / allLeads.length) * 100).toFixed(1)}%)`)
  }
  console.log(`\nGoogle Ads (gclid present):         ${withGclid} (${((withGclid / allLeads.length) * 100).toFixed(1)}%)`)
  console.log(`From a provider page (preferredProviderId present): ${fromProviderPage} (${((fromProviderPage / allLeads.length) * 100).toFixed(1)}%)`)

  // ========== QUERY 3: Provider-page driven leads (inverse of page-view ratio) ==========
  // We can't get page views from Prisma (that's GA4). But we CAN see which providers
  // had leads come through their profile page CTA (preferredProviderId).
  const byProvider = new Map<string, number>()
  for (const lead of allLeads) {
    if (lead.preferredProviderId) {
      byProvider.set(lead.preferredProviderId, (byProvider.get(lead.preferredProviderId) || 0) + 1)
    }
  }

  console.log(`\n=== QUERY 3: Provider profile page -> form submission conversion ===`)
  console.log(`(Total page views are in GA4, not Prisma. This is the converted half`)
  console.log(` of the funnel — leads that cite a specific provider as their source.)\n`)

  if (byProvider.size === 0) {
    console.log(`No leads currently have preferredProviderId set — either patients aren't`)
    console.log(`clicking provider-page lead CTAs or the field isn't being populated.`)
    console.log(`If the latter, check the lead form paths that should pass preferredProviderId`)
    console.log(`when submitted from a provider detail page.`)
  } else {
    console.log(`${byProvider.size} providers had leads attributed to their profile page.`)
    console.log(`\nTop provider-page lead contributors:`)
    const providers = await prisma.provider.findMany({
      where: { id: { in: Array.from(byProvider.keys()) } },
      select: { id: true, name: true, isFeatured: true, featuredTier: true },
    })
    const providerMap = new Map(providers.map(p => [p.id, p]))
    const sorted = Array.from(byProvider.entries()).sort((a, b) => b[1] - a[1])
    for (const [providerId, count] of sorted.slice(0, 20)) {
      const p = providerMap.get(providerId)
      const tier = p?.featuredTier || (p?.isFeatured ? 'isFeatured' : 'free')
      console.log(`  ${count.toString().padStart(3)} | ${(p?.name || providerId).slice(0, 50).padEnd(50)} | ${tier}`)
    }
    console.log(`\nFunnel ratio:`)
    console.log(`  Total leads:                           ${allLeads.length}`)
    console.log(`  Leads from provider-page CTAs:         ${fromProviderPage} (${((fromProviderPage / allLeads.length) * 100).toFixed(1)}%)`)
    console.log(`  Leads from other paths:                ${allLeads.length - fromProviderPage} (${(((allLeads.length - fromProviderPage) / allLeads.length) * 100).toFixed(1)}%)`)
  }

  // ========== QUERY 4: Phone click-to-call events ==========
  const phoneClicks = await prisma.phoneClickEvent.findMany({
    select: { id: true, providerId: true, source: true, createdAt: true },
  })

  console.log(`\n=== QUERY 4: Phone click-to-call events ===`)
  console.log(`Captures INTENT to call from provider-listing click-to-call links.`)
  console.log(`Distinct from CallLog (Twilio-tracked actual call completions).\n`)
  console.log(`Total phone-click events:   ${phoneClicks.length}`)

  if (phoneClicks.length > 0) {
    // By month
    const clicksByMonth = new Map<string, number>()
    for (const c of phoneClicks) {
      const ym = c.createdAt.toISOString().slice(0, 7)
      clicksByMonth.set(ym, (clicksByMonth.get(ym) || 0) + 1)
    }
    console.log(`\nBy month:`)
    for (const [ym, count] of Array.from(clicksByMonth.entries()).sort()) {
      console.log(`  ${ym}   | ${count}`)
    }

    // By source
    const clicksBySource = new Map<string, number>()
    for (const c of phoneClicks) {
      clicksBySource.set(c.source, (clicksBySource.get(c.source) || 0) + 1)
    }
    console.log(`\nBy source:`)
    for (const [src, count] of Array.from(clicksBySource.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${src.padEnd(30)} ${count}`)
    }

    // Top providers by click volume
    const clicksByProvider = new Map<string, number>()
    for (const c of phoneClicks) {
      clicksByProvider.set(c.providerId, (clicksByProvider.get(c.providerId) || 0) + 1)
    }
    const topProviderIds = Array.from(clicksByProvider.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
    if (topProviderIds.length > 0) {
      const providers = await prisma.provider.findMany({
        where: { id: { in: topProviderIds.map(([id]) => id) } },
        select: { id: true, name: true, isFeatured: true, featuredTier: true },
      })
      const pmap = new Map(providers.map(p => [p.id, p]))
      console.log(`\nTop providers by click-to-call volume:`)
      console.log(`clicks | leads | provider | tier`)
      for (const [pid, clicks] of topProviderIds) {
        const p = pmap.get(pid)
        const tier = p?.featuredTier || (p?.isFeatured ? 'isFeatured' : 'free')
        const leadsFromThisProvider = byProvider.get(pid) || 0
        console.log(`${clicks.toString().padStart(6)} | ${leadsFromThisProvider.toString().padStart(5)} | ${(p?.name || pid).slice(0, 45).padEnd(45)} | ${tier}`)
      }
    }

    // Click-to-lead ratio
    const clicksInProviders = Array.from(clicksByProvider.keys())
    const totalClicks = phoneClicks.length
    const totalProviderLeads = fromProviderPage
    console.log(`\nCombined intent signal:`)
    console.log(`  Provider-page click-to-call clicks: ${totalClicks}`)
    console.log(`  Provider-page lead form submissions: ${totalProviderLeads}`)
    console.log(`  Total provider-page conversions:    ${totalClicks + totalProviderLeads}`)
  } else {
    console.log(`\n(No events yet — tracking just deployed.)`)
  }

  console.log(`\n=== NOTES ===`)
  console.log(`- Full funnel (page views -> form starts -> submissions / clicks) requires GA4`)
  console.log(`  joined with Prisma. Query GA4 for provider-detail pageviews and join by slug.`)
  console.log(`- Phone click events are captured via /api/analytics/phone-click (sendBeacon).`)
  console.log(`- Two intent signals per provider now: lead submissions + click-to-call.`)
  console.log(`  Together they approximate the full conversion side of the provider-page funnel.`)

  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
