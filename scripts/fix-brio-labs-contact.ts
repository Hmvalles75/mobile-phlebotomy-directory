import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROVIDER_ID = 'cmsivwzng0002ld04pcjjdo8u'  // Brio Labs LLC
const APPLY = process.argv.includes('--apply')

/**
 * Two fixes from Davilah Cruz's 2026-08-07 email.
 *
 * 1. notificationEmail was "briosticks@gmail" — missing the .com. She is
 *    eligibleForLeads, so she has been sitting in the routing pool with an
 *    undeliverable address: every lead notification would bounce. This is
 *    the thing she wrote in to complete.
 *
 * 2. Availability, quoted from her email: "I can do weekdays weekends and
 *    evening same day draw/urgent request if the day is available". Recorded
 *    as all seven days with an evening-inclusive window, matching the
 *    MON,TUE,... / HH:MM convention the other 108 configured providers use.
 *
 * Her primary ZIP (01850 = Lowell) does not match her stated city
 * (Tewksbury = 01876). Deliberately NOT changed here — she may genuinely
 * operate out of Lowell, and guessing would move the centre of her service
 * radius. Asked directly instead.
 */
async function main() {
  const before = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: {
      name: true, notificationEmail: true, email: true,
      operatingDays: true, operatingHoursStart: true, operatingHoursEnd: true,
      eligibleForLeads: true, notifyEnabled: true, zipCodes: true, primaryCity: true,
    },
  })
  if (!before) { console.error('✗ provider not found'); process.exit(1) }

  console.log('=== BEFORE ===')
  console.log(`  ${before.name}`)
  console.log(`  notificationEmail: ${before.notificationEmail}`)
  console.log(`  operatingDays:     ${before.operatingDays || '(unset)'}`)
  console.log(`  operatingHours:    ${before.operatingHoursStart || '?'}–${before.operatingHoursEnd || '?'}`)
  console.log(`  eligibleForLeads:  ${before.eligibleForLeads}  notifyEnabled=${before.notifyEnabled}`)
  console.log(`  zip/city (UNCHANGED, pending her answer): ${before.zipCodes} / ${before.primaryCity}`)

  const updates = {
    notificationEmail: 'briosticks@gmail.com',
    operatingDays: 'MON,TUE,WED,THU,FRI,SAT,SUN',
    operatingHoursStart: '07:00',
    operatingHoursEnd: '20:00',
  }
  console.log('\n=== WILL APPLY ===')
  console.log(JSON.stringify(updates, null, 2))

  if (!APPLY) { console.log('\n(dry run — re-run with --apply)'); await prisma.$disconnect(); return }

  const after = await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: updates,
    select: {
      name: true, notificationEmail: true,
      operatingDays: true, operatingHoursStart: true, operatingHoursEnd: true,
    },
  })

  console.log('\n=== AFTER ===')
  console.log(`  notificationEmail: ${after.notificationEmail}`)
  console.log(`  operatingDays:     ${after.operatingDays}`)
  console.log(`  operatingHours:    ${after.operatingHoursStart}–${after.operatingHoursEnd}`)
  console.log('\n✓ Lead notifications will now reach her.')

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
