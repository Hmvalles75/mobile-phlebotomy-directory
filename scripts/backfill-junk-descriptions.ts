import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { detectJunkDescription } from '../lib/detectJunkDescription'
const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

async function main() {
  const all = await prisma.provider.findMany({
    where: { description: { not: null } },
    select: { id: true, name: true, description: true, descriptionFlagged: true, primaryState: true },
  })

  const flagged: Array<{ id: string; name: string; reasons: string[]; preview: string }> = []
  const unflagging: string[] = []  // already flagged but now clean (e.g. admin rewrote)

  for (const p of all) {
    const result = detectJunkDescription(p.description)
    if (result.isJunk && !p.descriptionFlagged) {
      flagged.push({
        id: p.id,
        name: p.name.trim(),
        reasons: result.reasons,
        preview: (p.description || '').slice(0, 120).replace(/\s+/g, ' '),
      })
    } else if (!result.isJunk && p.descriptionFlagged) {
      unflagging.push(p.id)
    }
  }

  console.log(`# JUNK-DESCRIPTION BACKFILL`)
  console.log(`# Scanned: ${all.length} providers with descriptions`)
  console.log(`# To flag (new): ${flagged.length}`)
  console.log(`# To unflag (clean now): ${unflagging.length}`)
  console.log(`# Mode: ${APPLY ? 'LIVE' : 'DRY-RUN'}\n`)

  if (flagged.length > 0) {
    console.log(`## NEW FLAGS (sample of first 30):`)
    for (const f of flagged.slice(0, 30)) {
      console.log(`\n  ▶ ${f.name} (${f.id})`)
      for (const r of f.reasons) console.log(`     · ${r}`)
      console.log(`     preview: "${f.preview}${f.preview.length === 120 ? '...' : ''}"`)
    }
    if (flagged.length > 30) console.log(`\n  ...and ${flagged.length - 30} more`)
  }

  if (!APPLY) {
    console.log(`\n(Dry-run. Pass --apply to write descriptionFlagged updates.)`)
    await prisma.$disconnect()
    return
  }

  console.log(`\n# Applying...`)
  for (const f of flagged) {
    await prisma.provider.update({
      where: { id: f.id },
      data: { descriptionFlagged: true },
    })
  }
  for (const id of unflagging) {
    await prisma.provider.update({
      where: { id },
      data: { descriptionFlagged: false },
    })
  }
  console.log(`Flagged ${flagged.length} provider(s) as descriptionFlagged=true`)
  console.log(`Unflagged ${unflagging.length} provider(s) (now clean)`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
