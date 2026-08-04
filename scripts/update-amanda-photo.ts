import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const PROVIDER_ID = 'cmpzuqibg000il504u9lrhn7s'  // A & A Mobile Phlebotomy (Amanda Ponder)
const IMAGE_PATH = '/images/A.Ponder_profile.jpg'

const APPLY = process.argv.includes('--apply')

/**
 * profileImage rather than logo: this is a headshot, and logo is reserved for
 * actual marks. The provider page renders `logo || profileImage`, so with no
 * logo set this is what shows. Same field Mireille's photo uses.
 */
async function main() {
  // The DB path is worthless if the file was never committed — production
  // serves from the repo, so an uncommitted file 404s.
  const disk = path.join(process.cwd(), 'public', IMAGE_PATH.replace(/^\//, ''))
  if (!fs.existsSync(disk)) {
    console.error(`✗ ${disk} does not exist. Add the file before setting the DB field.`)
    process.exit(1)
  }
  console.log(`file: ${disk}  (${(fs.statSync(disk).size / 1024).toFixed(0)} KB) ✓`)

  const before = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: { name: true, slug: true, logo: true, profileImage: true },
  })
  if (!before) { console.error('✗ provider not found'); process.exit(1) }

  console.log('\n=== BEFORE ===')
  console.log(`  ${before.name}`)
  console.log(`  logo:         ${before.logo || '(none)'}`)
  console.log(`  profileImage: ${before.profileImage || '(none)'}`)

  if (!APPLY) { console.log(`\nWill set profileImage = ${IMAGE_PATH}\n(dry run — re-run with --apply)`); await prisma.$disconnect(); return }

  const after = await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: { profileImage: IMAGE_PATH },
    select: { name: true, slug: true, logo: true, profileImage: true },
  })

  console.log('\n=== AFTER ===')
  console.log(`  logo:         ${after.logo || '(none)'}`)
  console.log(`  profileImage: ${after.profileImage}`)
  console.log(`\n✓ Set. Commit public${IMAGE_PATH} or it will 404 in production.`)
  console.log(`  https://mobilephlebotomy.org/provider/${after.slug}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
