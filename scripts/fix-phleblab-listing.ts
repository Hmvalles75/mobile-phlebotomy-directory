/**
 * Phleb Lab LLC (Richmond Hts, OH) — re-enable notifications and apply Renee's
 * second submission to the listing she already has.
 *
 * She has received nothing since 2026-08-20, when notifyEnabled was set false.
 * That date is ambiguous in the data: two cleanups ran that day, the bounced-
 * address reconciliation and the opt-out compliance work. She is named in
 * neither script.
 *
 * Gmail settles it — there is no correspondence from her at all, so no opt-out
 * was ever requested. The disable came from the bounce sweep, which is
 * consistent with her writing from a .org address today while the record holds
 * .com. Both domains accept mail (Google Workspace and Microsoft 365
 * respectively), so .org is a switch to the address she actually uses, not a
 * repair of a dead one.
 *
 * Her new submission ticks "wants to receive leads", which is current consent
 * regardless of which cleanup caught her.
 *
 * Radius 25 -> 50: her stated area, "All of Cleveland west east south and
 * west", parses to no mileage, so approving the submission fresh would have
 * given her the 50-mile default anyway. 25 miles does not cover the metro she
 * describes.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

const PHONE = '2162889433'
const NEW_EMAIL = 'medicalprofessionals@phleblab.org'
const NEW_RADIUS = 50

async function main() {
  console.log(APPLY ? '*** APPLYING ***\n' : '--- DRY RUN (pass --apply) ---\n')

  const p = await prisma.provider.findFirst({ where: { phone: { contains: PHONE } } })
  if (!p) return console.log('ABORT — provider not found')
  if (p.removedAt) return console.log('ABORT — provider is soft-removed; removal is a separate decision')

  const sub = await prisma.pendingSubmission.findFirst({
    where: { phone: { contains: PHONE }, status: 'PENDING' },
    orderBy: { submittedAt: 'desc' },
  })
  if (!sub) return console.log('ABORT — no PENDING submission to apply')

  console.log(`provider        ${p.name}`)
  console.log(`  notifyEnabled ${p.notifyEnabled} -> true`)
  console.log(`  email         ${p.email} -> ${NEW_EMAIL}`)
  console.log(`  notification  ${p.notificationEmail} -> ${NEW_EMAIL}`)
  console.log(`  radius        ${p.serviceRadiusMiles} -> ${NEW_RADIUS}`)
  console.log(`  eligible      ${p.eligibleForLeads} (unchanged)`)
  console.log(`submission ${sub.id} -> REJECTED (applied to the existing listing)`)

  if (!APPLY) return console.log('\n(dry run — nothing written)')

  await prisma.provider.update({
    where: { id: p.id },
    data: {
      notifyEnabled: true,
      email: NEW_EMAIL,
      notificationEmail: NEW_EMAIL,
      serviceRadiusMiles: NEW_RADIUS,
    },
  })
  await prisma.pendingSubmission.update({ where: { id: sub.id }, data: { status: 'REJECTED' } })

  const after = await prisma.provider.findUnique({
    where: { id: p.id },
    select: { name: true, notifyEnabled: true, eligibleForLeads: true, email: true,
      notificationEmail: true, serviceRadiusMiles: true, primaryCity: true, primaryState: true, status: true },
  })
  console.log('\nresult:', JSON.stringify(after))
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
