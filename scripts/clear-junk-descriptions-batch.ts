import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Suspect descriptions surfaced by the 2026-05-22 audit. Clearing all to NULL
// per Hector. Active (VERIFIED+eligible) listed first since they're patient-facing.
const TARGETS: Array<{ id: string; name: string; current: string; active: boolean }> = [
  // Active
  { id: 'cmo1wptf20009l5041jxb81bc', name: "P.A.W'S Phlebotomy Service llc",          current: '3475518289',       active: true  },
  { id: 'cmnuowvkk0002lb048l1hwpdr', name: 'PHLEBOTOMY SERVICES OF KENTUCKY LLC',     current: 'Mobile Phlebotomy', active: true  },
  // Inactive
  { id: 'cmit2z6u400hkg0m0xqakxusw', name: 'PFM Mobile Phlebotomy and Wellness LLC', current: 'al_c',              active: false },
  { id: 'cmixrcwel013mg01ced1eigwb', name: 'Just A Pinch Mobile Phlebotomy',          current: 'w_500',             active: false }, // already cleared
  { id: 'cmixrjm7m01hxg01ch6f96uuh', name: 'My Health Check Lab',                     current: 'Lab Testing',       active: false },
  { id: 'cmixrp9v601twg01c5nwgb4v6', name: 'Advanced Mobile Phlebotomy Service, LLC', current: 'Lake Norman',       active: false },
  { id: 'cmixradkw00yag01c2dhod68y', name: 'Vital Hearts, LLC',                       current: 'h_640',             active: false },
]

async function main() {
  let cleared = 0
  let alreadyNull = 0
  for (const t of TARGETS) {
    const before = await prisma.provider.findUnique({
      where: { id: t.id },
      select: { description: true, descriptionFlagged: true },
    })
    if (!before) {
      console.log(`⚠ ${t.name} (${t.id}) — not found, skipping`)
      continue
    }
    if (before.description === null) {
      console.log(`· ${t.name} — already NULL, skipping`)
      alreadyNull++
      continue
    }
    await prisma.provider.update({
      where: { id: t.id },
      data: { description: null, descriptionFlagged: false },
    })
    console.log(`✓ ${t.active ? 'ACTIVE' : 'inactive'}  ${t.name}  →  was "${before.description}", now NULL`)
    cleared++
  }
  console.log(`\nCleared: ${cleared}   |   Already-NULL: ${alreadyNull}   |   Total in target list: ${TARGETS.length}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
