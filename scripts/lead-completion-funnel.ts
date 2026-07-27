/**
 * Where do leads die on the way to a completed draw?
 * Read-only. Internal analysis.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const SINCE = new Date('2026-06-02T00:00:00.000Z')
const EXCLUDED = ['CLOSED_DUPLICATE', 'CLOSED_PRICING_ONLY', 'CLOSED_UNCONFIRMED']

// Outcomes grouped by what they tell us about WHY the lead died.
const DEAD_PATIENT_SIDE = ['NO_ANSWER', 'VOICEMAIL', 'UNABLE_TO_REACH', 'WRONG_NUMBER', 'INVALID_CONTACT_INFO', 'BUSY_OR_DISCONNECTED']
const DEAD_INTENT = ['DECLINED', 'NOT_INTERESTED', 'NO_ORDER', 'WRONG_SERVICE', 'PATIENT_FOUND_OTHER']
const IN_PROGRESS = ['CONTACTED', 'WORKING_IT', 'TEXT_SENT', 'EMAIL_SENT']
const WON = ['APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED']

function pct(n: number, d: number) { return d ? `${((n / d) * 100).toFixed(1)}%` : '—' }

async function main() {
  const raw = await prisma.lead.findMany({
    where: { createdAt: { gte: SINCE } },
    select: {
      id: true, createdAt: true, status: true, urgency: true, city: true, state: true,
      routedToId: true, routedProviderIds: true, claimedAt: true, firstContactAt: true,
      callAttempts: true, outcome: true, appointmentDate: true, completedAt: true,
      releasedAt: true, staleReleaseCount: true,
      hasDoctorOrder: true, paymentMethod: true, drawCount: true, isHighValue: true,
      source: true, attributionSource: true, phone: true,
    },
  })
  const leads = raw.filter(l => !EXCLUDED.includes(String(l.status)))

  // Dedup: intake has none. Count distinct people for honest rates.
  const norm = (p: string) => (p || '').replace(/\D/g, '').slice(-10)
  const seen = new Set<string>()
  const dedup = leads.filter(l => {
    const k = norm(l.phone)
    if (!k) return true
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  console.log('='.repeat(92))
  console.log('LEAD COMPLETION FUNNEL — 2026-06-02 → today')
  console.log('='.repeat(92))
  console.log(`raw rows: ${leads.length}   distinct people: ${dedup.length}   (${leads.length - dedup.length} duplicate submissions)\n`)

  const L = dedup
  const routed = L.filter(l => l.routedProviderIds.length > 0)
  const everClaimed = L.filter(l => l.claimedAt || l.routedToId || l.releasedAt || l.staleReleaseCount > 0)
  const contacted = L.filter(l => l.firstContactAt || (l.callAttempts ?? 0) > 0 || l.outcome)
  const booked = L.filter(l => String(l.outcome) === 'APPOINTMENT_BOOKED' || l.appointmentDate)
  const completed = L.filter(l => String(l.outcome) === 'APPOINTMENT_COMPLETED' || l.completedAt)

  const stage = (label: string, n: number, prev: number) =>
    console.log(`  ${label.padEnd(34)} ${String(n).padStart(4)}   ${pct(n, L.length).padStart(7)} of all   ${pct(n, prev).padStart(7)} of prior stage`)

  console.log('FUNNEL')
  stage('1. Leads (distinct people)', L.length, L.length)
  stage('2. Routed to ≥1 provider', routed.length, L.length)
  stage('3. Claimed by a provider', everClaimed.length, routed.length)
  stage('4. Provider made contact', contacted.length, everClaimed.length)
  stage('5. Appointment booked', booked.length, contacted.length)
  stage('6. Draw completed', completed.length, booked.length)

  console.log(`\n  BIGGEST DROP: see percentages above. Overall completion: ${pct(completed.length, L.length)}`)

  // ---- Where claimed leads die ----
  console.log('\n' + '='.repeat(92))
  console.log('WHY CLAIMED LEADS DIE (outcome distribution)')
  console.log('='.repeat(92))
  const oc: Record<string, number> = {}
  for (const l of everClaimed) oc[String(l.outcome ?? 'NO_OUTCOME_LOGGED')] = (oc[String(l.outcome ?? 'NO_OUTCOME_LOGGED')] || 0) + 1
  for (const [k, v] of Object.entries(oc).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(24)} ${String(v).padStart(4)}  ${pct(v, everClaimed.length)}`)
  }
  const bucket = (name: string, list: string[]) => {
    const n = everClaimed.filter(l => list.includes(String(l.outcome))).length
    console.log(`  ${name.padEnd(34)} ${String(n).padStart(4)}  ${pct(n, everClaimed.length)}`)
  }
  console.log('\n  GROUPED:')
  bucket('Won (booked or completed)', WON)
  bucket("Died: couldn't reach patient", DEAD_PATIENT_SIDE)
  bucket('Died: patient intent / wrong fit', DEAD_INTENT)
  bucket('Still in progress', IN_PROGRESS)
  console.log(`  ${'No outcome ever logged'.padEnd(34)} ${String(oc['NO_OUTCOME_LOGGED'] ?? 0).padStart(4)}  ${pct(oc['NO_OUTCOME_LOGGED'] ?? 0, everClaimed.length)}`)

  // ---- Completion by lead-quality attribute ----
  console.log('\n' + '='.repeat(92))
  console.log('COMPLETION BY LEAD ATTRIBUTE (does the intake gate predict completion?)')
  console.log('='.repeat(92))
  const seg = (label: string, key: (l: typeof L[number]) => string) => {
    const groups = new Map<string, { n: number; claimed: number; done: number }>()
    for (const l of L) {
      const k = key(l) || '(unset)'
      if (!groups.has(k)) groups.set(k, { n: 0, claimed: 0, done: 0 })
      const g = groups.get(k)!
      g.n++
      if (everClaimed.includes(l)) g.claimed++
      if (completed.includes(l)) g.done++
    }
    console.log(`\n  ${label}`)
    console.log(`    ${'value'.padEnd(18)} leads  claimed  completed  completion%`)
    for (const [k, g] of [...groups.entries()].sort((a, b) => b[1].n - a[1].n)) {
      console.log(`    ${k.slice(0, 18).padEnd(18)} ${String(g.n).padStart(5)}  ${String(g.claimed).padStart(7)}  ${String(g.done).padStart(9)}  ${pct(g.done, g.n).padStart(10)}`)
    }
  }
  seg('Doctor order on file?', l => String(l.hasDoctorOrder))
  seg('Payment method', l => String(l.paymentMethod))
  seg('Draw count', l => String(l.drawCount))
  seg('Urgency', l => String(l.urgency))
  seg('Traffic source', l => String(l.attributionSource))

  // ---- Speed to claim vs completion ----
  console.log('\n' + '='.repeat(92))
  console.log('DOES CLAIMING FASTER PRODUCE MORE COMPLETIONS?')
  console.log('='.repeat(92))
  const clean = L.filter(l => l.claimedAt && !l.releasedAt && l.staleReleaseCount === 0)
  const sb = { '<15 min': [0, 0], '15–60 min': [0, 0], '1–6 hr': [0, 0], '6 hr+': [0, 0] } as Record<string, number[]>
  for (const l of clean) {
    const mins = (l.claimedAt!.getTime() - l.createdAt.getTime()) / 60000
    const k = mins < 15 ? '<15 min' : mins < 60 ? '15–60 min' : mins < 360 ? '1–6 hr' : '6 hr+'
    sb[k][0]++
    if (completed.includes(l)) sb[k][1]++
  }
  console.log(`    ${'bucket'.padEnd(12)} claimed  completed  rate`)
  for (const [k, [n, d]] of Object.entries(sb)) {
    console.log(`    ${k.padEnd(12)} ${String(n).padStart(7)}  ${String(d).padStart(9)}  ${pct(d, n).padStart(6)}`)
  }

  // ---- Provider completion performance ----
  console.log('\n' + '='.repeat(92))
  console.log('PROVIDER COMPLETION PERFORMANCE (claimed ≥2)')
  console.log('='.repeat(92))
  const byProv = new Map<string, { claimed: number; done: number; noOutcome: number; dead: number }>()
  for (const l of L) {
    if (!l.routedToId) continue
    if (!byProv.has(l.routedToId)) byProv.set(l.routedToId, { claimed: 0, done: 0, noOutcome: 0, dead: 0 })
    const g = byProv.get(l.routedToId)!
    g.claimed++
    if (completed.includes(l)) g.done++
    if (!l.outcome) g.noOutcome++
    if (DEAD_PATIENT_SIDE.includes(String(l.outcome))) g.dead++
  }
  const provs = await prisma.provider.findMany({
    where: { id: { in: [...byProv.keys()] } },
    select: { id: true, name: true, primaryCity: true, primaryState: true },
  })
  const nameById = new Map(provs.map(p => [p.id, p]))
  const rows = [...byProv.entries()].filter(([, g]) => g.claimed >= 2).sort((a, b) => b[1].done - a[1].done || b[1].claimed - a[1].claimed)
  console.log(`    ${'provider'.padEnd(40)} claimed  done  rate    noOutcome  unreachable`)
  for (const [id, g] of rows) {
    const p = nameById.get(id)
    console.log(`    ${(p?.name || id).slice(0, 40).padEnd(40)} ${String(g.claimed).padStart(7)}  ${String(g.done).padStart(4)}  ${pct(g.done, g.claimed).padStart(6)}  ${String(g.noOutcome).padStart(9)}  ${String(g.dead).padStart(11)}`)
  }
}

main().catch(e => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
