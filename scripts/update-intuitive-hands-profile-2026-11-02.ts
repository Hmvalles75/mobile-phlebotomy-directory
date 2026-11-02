/** 2026-11-02: Candace Parker's listing corrections (Hector's email of 11/02): credential (Medical Assistant,
 *  23 years), specialty-kit wording, pricing, extended-travel note. Replaces the description wholesale. */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmuvqv4w3001mkw0454yy5eem'
const DESCRIPTION = `Intuitive Hands Mobile Phlebotomy, LLC provides professional mobile blood collection and specimen services throughout Michigan and northwest Ohio. Founded by a Medical Assistant with 23 years of healthcare experience, we specialize in in-home blood draws, difficult-stick collections, research and genetic testing collections, corporate wellness and biometric screenings, specimen processing, and laboratory delivery. We accommodate a wide variety of specialty laboratory collection kits, subject to kit instructions, specimen-handling requirements and lab compatibility. We work with individual patients, physician offices, diagnostic laboratories, research organizations, and healthcare companies to provide convenient, reliable, patient-centered mobile services. Same-day and scheduled appointments are available based on location and availability.

Pricing: in-home blood draws from $150, including travel within 20 miles. Additional mileage or service charges apply where needed.

Serving Detroit and its suburbs, rural Michigan out to Ann Arbor, Port Huron, Flint, Jackson, Lansing, Saginaw and Bay City, and northwest Ohio including Toledo, Sandusky, Findlay and Cleveland. Extended travel beyond these areas is available by request, with additional mileage charges.`
async function main() {
  const b = await prisma.provider.findUnique({ where: { id: ID }, select: { description: true } })
  if (b?.description === DESCRIPTION) { console.log('already applied'); return }
  await runAsActor('admin', 'scripts/update-intuitive-hands-profile-2026-11-02.ts', () => prisma.provider.update({ where: { id: ID }, data: { description: DESCRIPTION } }))
  const a = await prisma.provider.findUnique({ where: { id: ID }, select: { description: true } })
  console.log('applied:', a?.description === DESCRIPTION)
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
