import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { checkProviderEmail } from '../lib/emailValidation'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

/**
 * Corrects provider addresses whose typo can be PROVEN, not guessed.
 *
 * Sending to a guessed address is not a harmless retry — a lead email carries
 * the patient's name, phone number and home address. Guessing wrong delivers
 * that to a stranger. So the bar here is evidence, and each fix below has it:
 *
 *  - DPG: their own `email` field already holds admin@dpgmobiledrugtesting.com,
 *    which has valid MX. Only notificationEmail carries the .co, which has no
 *    MX at all. The right address is already on the record.
 *  - Healthy24care: both fields are misspelled, and differently — "healty" and
 *    "halthy". Neither domain resolves. healthy24care.com has valid Outlook MX.
 *  - Core Mobile: gmail.con is not a TLD. Only the TLD changes; the mailbox
 *    name is untouched, so this is not a guess about who owns it.
 *
 * Deliberately NOT fixed — the domain is fine and the LOCAL PART is suspect,
 * which nothing can verify short of sending:
 *  - Unqiuetouchmobilelabllc@yahoo.com  ("unqiue"?)
 *  - phlebitomynerd@gmail.com           ("phlebitomy"?)
 * Those need a phone call. 281-857-5069 and 734-787-1756.
 */
const FIXES: Array<{ match: string; field: 'email' | 'claimEmail' | 'notificationEmail'; from: string; to: string; why: string }> = [
  { match: 'DPG Mobile',            field: 'notificationEmail', from: 'admin@dpgmobiledrugtesting.co',        to: 'admin@dpgmobiledrugtesting.com',        why: '.co has no MX; .com has valid MX and is already in their email field' },
  { match: 'Healthy24care',         field: 'email',             from: 'mobilephlebotomy@healty24care.com',    to: 'mobilephlebotomy@healthy24care.com',    why: 'healty24care.com does not resolve; healthy24care.com has valid MX' },
  { match: 'Healthy24care',         field: 'notificationEmail', from: 'mobilephlebotomy@halthy24care.com',    to: 'mobilephlebotomy@healthy24care.com',    why: 'halthy24care.com does not resolve; healthy24care.com has valid MX' },
  { match: 'Core Mobile Laboratory', field: 'email',            from: 'coremobilelabservices@gmail.con',      to: 'coremobilelabservices@gmail.com',       why: '.con is not a TLD; mailbox name unchanged' },
  { match: 'Core Mobile Laboratory', field: 'notificationEmail', from: 'coremobilelabservices@gmail.con',     to: 'coremobilelabservices@gmail.com',       why: '.con is not a TLD; mailbox name unchanged' },
]

async function main() {
  for (const f of FIXES) {
    const p = await prisma.provider.findFirst({
      where: { name: { contains: f.match, mode: 'insensitive' } },
      select: { id: true, name: true, email: true, claimEmail: true, notificationEmail: true, notifyEnabled: true },
    })
    if (!p) { console.log(`${f.match}: not found`); continue }

    const current = (p as any)[f.field] as string | null
    if (!current || current.toLowerCase() !== f.from.toLowerCase()) {
      console.log(`  ${p.name.slice(0, 32).padEnd(32)} ${f.field} is "${current ?? '—'}" — not the expected typo, skipped`)
      continue
    }

    const check = checkProviderEmail(f.to)
    if (!check.ok) {
      console.log(`  ${p.name.slice(0, 32).padEnd(32)} REFUSING — "${f.to}" fails our own validator: ${check.reason}`)
      continue
    }

    console.log(`  ${p.name.slice(0, 32).padEnd(32)} ${f.field}`)
    console.log(`      ${current}  ->  ${f.to}`)
    console.log(`      ${f.why}`)
    if (APPLY) {
      await prisma.provider.update({ where: { id: p.id }, data: { [f.field]: f.to } as any })
      console.log(`      applied`)
    } else {
      console.log(`      (dry run — pass --apply)`)
    }
  }

  if (APPLY) {
    // Re-enable anyone the reconciliation switched off purely because of a
    // typo we have now corrected. If the new address also fails, the Event
    // Webhook's suppressHardBouncedProviders() will catch it automatically.
    for (const name of ['Core Mobile Laboratory']) {
      const p = await prisma.provider.findFirst({ where: { name: { contains: name, mode: 'insensitive' } }, select: { id: true, name: true, notifyEnabled: true } })
      if (p && !p.notifyEnabled) {
        await prisma.provider.update({ where: { id: p.id }, data: { notifyEnabled: true } })
        console.log(`\n  re-enabled notifications for ${p.name} — address corrected`)
      }
    }
  }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
