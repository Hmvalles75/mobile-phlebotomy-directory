/**
 * Salina's Mobile Phlebotomy (Colorado Springs) — apply her fourth submission
 * to the existing record instead of creating a duplicate.
 *
 * She has submitted the same business four times since 2025-12-30, always from
 * the same address, phone and ZIP. The duplicate guard blocked today's attempt,
 * which is correct — but a rejection alone loses the two things she was actually
 * asking to change, and she would simply submit a fifth time.
 *
 * Re-submitting is how she edits her listing, because she has never completed a
 * claim (claimVerifiedAt is null) and so has never had dashboard access. That is
 * the same root cause behind two other providers' login problems this week.
 *
 * Applied from today's submission:
 *   serviceRadiusMiles  50 -> 60   ("60 miles")
 *   name                drops "Biometric screening", trailing space trimmed
 *
 * NOT applied: her new description is thinner than the one already live
 * ("Drawing blood at your convenience..." vs the current copy naming stat
 * testing, biometric screening for employment and DNA testing). Overwriting good
 * copy with weaker copy is not what she was asking for.
 *
 * The old slug carries a trailing hyphen from the trailing space in the stored
 * name; a 301 is added in next.config.mjs.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

const EMAIL = 'salinasmith21@gmail.com'
const NEW_NAME = "Salina's Mobile Phlebotomy & Healthcare Service"
const NEW_SLUG = 'salinas-mobile-phlebotomy-healthcare-service'
const NEW_RADIUS = 60

async function main() {
  console.log(APPLY ? '*** APPLYING ***\n' : '--- DRY RUN (pass --apply) ---\n')

  const p = await prisma.provider.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
  })
  if (!p) return console.log('ABORT — provider not found')
  if (p.removedAt) return console.log('ABORT — provider is soft-removed')

  const clash = await prisma.provider.findFirst({
    where: { slug: NEW_SLUG, id: { not: p.id } },
    select: { id: true, name: true },
  })
  if (clash) return console.log('ABORT — slug already taken by', clash.name)

  const sub = await prisma.pendingSubmission.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' }, status: 'PENDING' },
    orderBy: { submittedAt: 'desc' },
  })
  if (!sub) return console.log('ABORT — no PENDING submission to apply')

  console.log('provider :', JSON.stringify(p.name), '->', JSON.stringify(NEW_NAME))
  console.log('slug     :', p.slug, '->', NEW_SLUG)
  console.log('radius   :', p.serviceRadiusMiles, '->', NEW_RADIUS)
  console.log('desc     : unchanged (keeping the stronger existing copy)')
  console.log('submission', sub.id, 'will be marked REJECTED (applied to the existing listing)')

  if (!APPLY) return console.log('\n(dry run — nothing written)')

  await prisma.provider.update({
    where: { id: p.id },
    data: { name: NEW_NAME, slug: NEW_SLUG, serviceRadiusMiles: NEW_RADIUS },
  })
  await prisma.pendingSubmission.update({
    where: { id: sub.id },
    data: { status: 'REJECTED' },
  })

  const after = await prisma.provider.findUnique({
    where: { id: p.id },
    select: { name: true, slug: true, serviceRadiusMiles: true, primaryCity: true,
      primaryState: true, zipCodes: true, eligibleForLeads: true, status: true },
  })
  console.log('\nresult:', JSON.stringify(after))
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
