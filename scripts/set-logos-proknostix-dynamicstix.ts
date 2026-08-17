import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { existsSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Logos supplied by two paying Founding Partners, 2026-08-17.
 *
 * Both were resized to 600px on the longest side before committing — the
 * originals were 1024x1536 (1.7MB) and 1254x1254 (344KB), which is far more
 * than a card slot needs and is served on every page view. 2048KB -> 189KB.
 *
 * `logo` rather than `profileImage`: the provider page renders
 * `logo || profileImage`, so logo is the field that wins, and these are
 * business marks rather than headshots.
 */
const LOGOS = [
  { slug: 'proknostix-mobile-services', path: '/images/proknostix-logo.jpeg' },
  { slug: 'dynamic-stix',               path: '/images/dynamic-stix-logo.png' },
]

async function main() {
  for (const l of LOGOS) {
    if (!existsSync('public' + l.path)) {
      console.log(`${l.slug}: FILE MISSING at public${l.path} — skipped, nothing changed`)
      continue
    }
    const before = await prisma.provider.findUnique({
      where: { slug: l.slug },
      select: { id: true, name: true, logo: true, profileImage: true, priorityRouting: true },
    })
    if (!before) { console.log(`${l.slug}: provider NOT FOUND — skipped`); continue }

    const after = await prisma.provider.update({
      where: { slug: l.slug },
      data: { logo: l.path },
      select: { name: true, logo: true, profileImage: true },
    })
    console.log(`${after.name}`)
    console.log(`  paying=${before.priorityRouting}`)
    console.log(`  logo: ${before.logo ?? '(none)'} -> ${after.logo}`)
    console.log(`  profileImage untouched: ${after.profileImage ?? '(none)'}`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
