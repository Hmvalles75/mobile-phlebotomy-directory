import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

/**
 * Correct Selesia Ann Foundation's address and restore notifications.
 *
 *   npx tsx scripts/fix-selesia-email.ts           # dry run
 *   npx tsx scripts/fix-selesia-email.ts --apply
 *
 * Signed up 2026-06-29 with lashondra@tsafoundation.org. Their website is
 * tsafoundations.org -- with an s -- and the singular domain rejected mail as
 * "mailbox unavailable" on 2026-06-30, the day after signup. The 2026-08-20
 * bounce sweep correctly turned notifications off. Four lead notifications had
 * already been sent by then and none of them arrived.
 *
 * The plural spelling was confirmed by delivery, not by inference: an email to
 * lashondra@tsafoundations.org sat for eleven minutes without bouncing, and
 * their tenant is Microsoft 365, which rejects unknown recipients during the
 * SMTP conversation rather than asynchronously. A bad address there comes back
 * in seconds.
 *
 * Notifications go back on now rather than waiting for her reply. The address
 * is the only thing that was ever in doubt, she asked for leads when she
 * signed up, and every day off is more requests she does not see.
 */

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const NAME = 'Selesia Ann Foundation'
const CORRECTED = 'lashondra@tsafoundations.org'

async function main() {
  const p: any = await prisma.provider.findFirst({ where: { name: NAME } })
  if (!p) throw new Error(`${NAME} not found`)

  console.log(`provider  ${p.name}  (${p.primaryCity}, ${p.primaryState})`)
  console.log(`  email         ${p.email} -> ${CORRECTED}`)
  console.log(`  notification  ${p.notificationEmail ?? '(unset)'} -> ${CORRECTED}`)
  console.log(`  notifyEnabled ${p.notifyEnabled} -> true`)
  console.log(`  eligible      ${p.eligibleForLeads} (unchanged)`)

  if (!APPLY) {
    console.log('\n(dry run -- nothing written)')
    return
  }

  const updated = await prisma.provider.update({
    where: { id: p.id },
    data: { email: CORRECTED, notificationEmail: CORRECTED, notifyEnabled: true },
    select: { name: true, email: true, notificationEmail: true, notifyEnabled: true, eligibleForLeads: true },
  })
  console.log('\nresult:', JSON.stringify(updated))
}

main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
