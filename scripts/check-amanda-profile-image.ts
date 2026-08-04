import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const p = await prisma.provider.findUnique({
    where: { id: 'cmpzuqibg000il504u9lrhn7s' },
    select: {
      name: true, slug: true, logo: true, profileImage: true, heroPoster: true,
      listingTier: true, isFeatured: true, featuredTier: true,
      primaryCity: true, primaryCitySlug: true, primaryStateSlug: true,
      updatedAt: true,
    },
  })
  if (!p) { console.log('NOT FOUND'); return }

  console.log(`${p.name} [${p.slug}]`)
  console.log(`  tier:         ${p.listingTier} / ${p.featuredTier} featured=${p.isFeatured}`)
  console.log(`  logo:         ${p.logo || '(none)'}`)
  console.log(`  profileImage: ${p.profileImage || '(none)'}`)
  console.log(`  heroPoster:   ${p.heroPoster || '(none)'}`)
  console.log(`  updatedAt:    ${p.updatedAt.toISOString()}`)

  // A DB path is only useful if the file actually shipped in the repo.
  for (const [label, val] of [['logo', p.logo], ['profileImage', p.profileImage]] as const) {
    if (!val) continue
    if (val.startsWith('http')) {
      console.log(`\n  ${label} is a remote URL — not checked on disk.`)
      continue
    }
    const disk = path.join(process.cwd(), 'public', val.replace(/^\//, ''))
    const exists = fs.existsSync(disk)
    console.log(`\n  ${label} → ${disk}`)
    console.log(`     exists on disk: ${exists ? 'YES' : 'NO — will 404 in production'}`)
    if (exists) console.log(`     size: ${(fs.statSync(disk).size / 1024).toFixed(0)} KB`)
  }

  console.log(`\n  live pages:`)
  console.log(`    /provider/${p.slug}`)
  console.log(`    /us/${p.primaryStateSlug}/${p.primaryCitySlug}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
