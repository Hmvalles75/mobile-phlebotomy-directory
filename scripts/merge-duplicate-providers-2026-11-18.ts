// One-off 2026-11-18: six duplicate provider pairs. Keep one record, move
// lead / claim / notification / outreach history onto it, soft-remove the
// other (removedAt + removedReason + doNotRelist, never delete), turn its
// leads and notifications off. 301s for the removed slugs go in
// next.config.mjs in a separate commit. ProviderChangeLog stays where it is:
// it is the audit trail OF the removed record. Coverage / services /
// address rows are the removed record's own configuration and stay too.
//   npx tsx --env-file=.env.local scripts/merge-duplicate-providers-2026-11-18.ts [--apply]
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const APPLY = process.argv.includes('--apply')
const TODAY = '2026-11-18'

type Plan = { keep: string; remove: string; patch?: Record<string, unknown>; why: string }
const PLAN: Plan[] = [
  { keep: 'rapid-reach-diagnostics-llc', remove: 'rapid-reach-diagnostics-llc-1', why: 'self-signup record with the full description and a claimed lead; -1 is a scraped shell created the next day (eligible=false)' },
  { keep: 'smooth-stick-mobile-labs', remove: 'smooth-stick-mobile-labs-1', why: 'self-signup record carries 17 notifications / 3 claimed; -1 is a scraped shell with an empty description and a typo email' },
  { keep: 'unique-touch-mobile-lab-llc', remove: 'unique-touch-mobile-labs-llc', why: 'self-signup record; -labs- is a scraped shell created the next day with a misspelled email' },
  {
    keep: 'minustouchmobilephlebotomyservices-', remove: 'minustouchmobilephlebotomyservices-health',
    // Login email (email) stays karlyne64@gmail.com per Hector; only the lead
    // notification address and the website come over from -health.
    patch: { website: 'https://www.minustouchmobilephlebotomyservices.health/', notificationEmail: 'karlyne@minustouchmobilephlebotomyservices.health' },
    why: 'keep the VERIFIED record; port website + notification email from -health, which is the record that claimed a lead',
  },
  { keep: 'precision-health-and-diagnostic', remove: 'precision-health-diagnostic-', why: 'older, fuller self-signup with a real website; the trailing-hyphen twin has a bogus website field' },
  { keep: 'expresslabsdivineblendingllc', remove: 'expresslabsdbllc', why: '12 notifications / 2 claimed and the website; the second signup has 3 notifications and a phone typo' },
]

const SEL = { id: true, slug: true, name: true, status: true, eligibleForLeads: true, notifyEnabled: true, removedAt: true, website: true, email: true, notificationEmail: true, claimEmail: true }

async function counts(providerId: string) {
  const [leads, notifs, claims, outreach, calls, clicks, emailEv, smsEv, orders, corr, corrQ] = await Promise.all([
    prisma.lead.count({ where: { routedToId: providerId } }),
    prisma.leadNotification.count({ where: { providerId } }),
    prisma.businessClaim.count({ where: { providerId } }),
    prisma.outreachLog.count({ where: { providerId } }),
    prisma.callLog.count({ where: { providerId } }),
    prisma.phoneClickEvent.count({ where: { providerId } }),
    prisma.emailEvent.count({ where: { providerId } }),
    prisma.smsEvent.count({ where: { providerId } }),
    prisma.institutionalOrder.count({ where: { assignedProviderId: providerId } }),
    prisma.providerCorrection.count({ where: { providerId } }),
    prisma.providerCorrections.count({ where: { providerId } }),
  ])
  return { leads, notifs, claims, outreach, calls, clicks, emailEv, smsEv, orders, corr, corrQ }
}

async function main() {
  const redirects: string[] = []
  for (const p of PLAN) {
    const [keep, remove] = await Promise.all([
      prisma.provider.findUnique({ where: { slug: p.keep }, select: SEL }),
      prisma.provider.findUnique({ where: { slug: p.remove }, select: SEL }),
    ])
    if (!keep || !remove) throw new Error(`missing ${p.keep} / ${p.remove}`)
    const [ck, cr] = await Promise.all([counts(keep.id), counts(remove.id)])
    // Notifications where BOTH records were notified for the same lead: moving
    // them would give the kept record two rows per lead and skew the response
    // score, so they stay behind. Reported, not moved.
    const keptLeadIds = new Set((await prisma.leadNotification.findMany({ where: { providerId: keep.id }, select: { leadId: true } })).map(n => n.leadId))
    const removeNotifs = await prisma.leadNotification.findMany({ where: { providerId: remove.id }, select: { id: true, leadId: true } })
    const overlap = removeNotifs.filter(n => keptLeadIds.has(n.leadId))
    const movable = removeNotifs.filter(n => !keptLeadIds.has(n.leadId)).map(n => n.id)

    console.log(`\n== ${keep.name.trim()} ==`)
    console.log(`  keep   /provider/${keep.slug}  ${keep.status} eligible=${keep.eligibleForLeads} notify=${keep.notifyEnabled}${keep.removedAt ? ' REMOVED?!' : ''}`)
    console.log(`  remove /provider/${remove.slug}  ${remove.status} eligible=${remove.eligibleForLeads} notify=${remove.notifyEnabled}${remove.removedAt ? '  ALREADY REMOVED' : ''}`)
    console.log(`  why    ${p.why}`)
    console.log(`  history on removed -> moves to kept: leads=${cr.leads} notifications=${movable.length} (${overlap.length} overlap stay) claims=${cr.claims} outreach=${cr.outreach} calls=${cr.calls} phoneClicks=${cr.clicks} emailEvents=${cr.emailEv} smsEvents=${cr.smsEv} institutionalOrders=${cr.orders} corrections=${cr.corr + cr.corrQ}`)
    console.log(`  kept already has: leads=${ck.leads} notifications=${ck.notifs} claims=${ck.claims} outreach=${ck.outreach}`)
    if (p.patch) console.log(`  patch kept: ${JSON.stringify(p.patch)}\n  (currently website=${keep.website ?? '-'} email=${keep.email ?? '-'} notificationEmail=${keep.notificationEmail ?? '-'} claimEmail=${keep.claimEmail ?? '-'})`)
    console.log(`  after: kept eligible=${keep.eligibleForLeads}, removed eligible=false notify=false`)
    redirects.push(`      { source: '/provider/${remove.slug}', destination: '/provider/${keep.slug}', permanent: true },`)
    if (!APPLY || remove.removedAt) continue

    await runAsActor('admin', 'scripts/merge-duplicate-providers-2026-11-18.ts', () => prisma.$transaction(async tx => {
      const to = keep.id, from = remove.id
      await tx.lead.updateMany({ where: { routedToId: from }, data: { routedToId: to } })
      if (movable.length) await tx.leadNotification.updateMany({ where: { id: { in: movable } }, data: { providerId: to } })
      await tx.businessClaim.updateMany({ where: { providerId: from }, data: { providerId: to } })
      await tx.outreachLog.updateMany({ where: { providerId: from }, data: { providerId: to } })
      await tx.callLog.updateMany({ where: { providerId: from }, data: { providerId: to } })
      await tx.phoneClickEvent.updateMany({ where: { providerId: from }, data: { providerId: to } })
      await tx.emailEvent.updateMany({ where: { providerId: from }, data: { providerId: to } })
      await tx.smsEvent.updateMany({ where: { providerId: from }, data: { providerId: to } })
      await tx.institutionalOrder.updateMany({ where: { assignedProviderId: from }, data: { assignedProviderId: to } })
      await tx.providerCorrection.updateMany({ where: { providerId: from }, data: { providerId: to } })
      await tx.providerCorrections.updateMany({ where: { providerId: from }, data: { providerId: to } })
      if (p.patch) await tx.provider.update({ where: { id: to }, data: p.patch as any })
      await tx.provider.update({ where: { id: from }, data: { removedAt: new Date(), removedReason: `duplicate of /provider/${keep.slug} (merged ${TODAY})`, doNotRelist: true, eligibleForLeads: false, notifyEnabled: false } })
    }))
    console.log('  applied')
  }
  console.log(`\nnext.config.mjs lines (separate commit):\n${redirects.join('\n')}`)
  console.log(APPLY ? '\ndone' : '\ndry run; add --apply')
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
