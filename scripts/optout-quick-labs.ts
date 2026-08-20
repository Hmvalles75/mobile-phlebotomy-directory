import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Mary Berry (Quick Labs LLC) asked to be removed from the list on 2026-08-19,
 * replying to a "lead was claimed" courtesy email.
 *
 * Stops the emails, which is the unambiguous part of the request:
 * notifyEnabled=false is what canNotify() reads, so no lead notification or
 * courtesy email can reach her again.
 *
 * Deliberately does NOT set removedAt. "Remove me from your list" in reply to
 * an email is a request to stop the email; delisting her business from the
 * directory is a different and larger action she did not clearly ask for, and
 * it is not mine to assume. Asked directly by email instead.
 */
async function main() {
  const p = await prisma.provider.findUnique({
    where: { slug: 'quick-labs-llc' },
    select: { id: true, name: true, notifyEnabled: true, eligibleForLeads: true, removedAt: true },
  })
  if (!p) { console.log('not found'); return }
  console.log(`${p.name}`)
  console.log(`  before: notifyEnabled=${p.notifyEnabled} eligibleForLeads=${p.eligibleForLeads} removedAt=${p.removedAt ?? 'active'}`)

  const after = await prisma.provider.update({
    where: { id: p.id },
    data: { notifyEnabled: false, eligibleForLeads: false },
    select: { notifyEnabled: true, eligibleForLeads: true, removedAt: true },
  })
  console.log(`  after : notifyEnabled=${after.notifyEnabled} eligibleForLeads=${after.eligibleForLeads} removedAt=${after.removedAt ?? 'active (listing intact)'}`)
  console.log(`  -> no further lead or courtesy emails can reach her; directory listing untouched pending her answer`)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
