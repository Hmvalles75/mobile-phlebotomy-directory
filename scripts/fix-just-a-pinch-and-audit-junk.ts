import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

// Suspicious patterns that indicate scraped-garbage descriptions, beyond
// what the existing detectJunkDescription() lib catches (which mostly
// targets HTML nav-menus, ALL-CAPS, and phrase repetition). These patterns
// catch the URL-fragment / image-parameter / placeholder cases.
const URL_FRAGMENT_PATTERNS: ReadonlyArray<RegExp> = [
  /^[wh]_\d+$/i,                     // "w_500", "h_300"
  /^q_\d+$/i,                        // "q_75"
  /^c_(scale|fit|crop|fill|limit|pad|thumb)/i,  // Cloudinary transform params
  /^scale[-_](up|down|to)/i,         // image scaling fragments
  /^\d+x\d+$/,                       // "500x300" image dimensions
  /\.(jpg|jpeg|png|webp|gif|svg)\?/i, // raw image URLs with query string
  /^https?:\/\//i,                   // description is JUST a URL
  /^(image|logo|photo|banner|icon)$/i, // single placeholder word
]

function looksLikeUrlFragment(text: string): { junky: boolean; reason?: string } {
  const t = text.trim()
  if (!t) return { junky: false }
  for (const re of URL_FRAGMENT_PATTERNS) {
    if (re.test(t)) return { junky: true, reason: `matches ${re.source}` }
  }
  return { junky: false }
}

async function main() {
  // ── Part 1: Just A Pinch specific fix ───────────────────────────────
  console.log(`# PART 1 — JUST A PINCH FIX\n`)

  const justAPinch = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { contains: 'Just A Pinch', mode: 'insensitive' } },
        { name: { contains: 'Just a Pinch', mode: 'insensitive' } },
        { slug: { contains: 'just-a-pinch', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true, name: true, slug: true, description: true,
      primaryCity: true, primaryState: true, status: true, eligibleForLeads: true,
    },
  })

  console.log(`Matches: ${justAPinch.length}`)
  for (const p of justAPinch) {
    console.log(`  ${p.name.trim()} (${p.id})`)
    console.log(`    location: ${p.primaryCity || '?'}, ${p.primaryState || '?'}`)
    console.log(`    status: ${p.status} | eligible: ${p.eligibleForLeads}`)
    console.log(`    current description: "${p.description}"`)
  }

  const target = justAPinch.find(p => /just\s*a\s*pinch/i.test(p.name))
  if (!target) {
    console.log('\n⚠ No Just A Pinch record found. Aborting Part 1.')
  } else if (target.description?.trim() && target.description.trim().length > 30) {
    console.log(`\n→ Description is long enough that it's NOT obviously junk. Skipping auto-clear; review manually.`)
  } else {
    if (APPLY) {
      await prisma.provider.update({
        where: { id: target.id },
        data: { description: null, descriptionFlagged: false },
      })
      console.log(`\n✓ CLEARED description on ${target.name.trim()} (${target.id})`)
      console.log(`  Cache: the Provider profile page at /provider/${target.slug} is ISR with revalidate=60 — page should refresh within a minute.`)
    } else {
      console.log(`\n[DRY] would clear description on ${target.name.trim()} (${target.id}). Pass --apply.`)
    }
  }

  // ── Part 2: Audit for other scraped-garbage descriptions ────────────
  console.log(`\n\n# PART 2 — AUDIT: OTHER PROVIDERS WITH SUSPECT DESCRIPTIONS\n`)

  const all = await prisma.provider.findMany({
    where: { description: { not: null } },
    select: {
      id: true, name: true, description: true,
      primaryCity: true, primaryState: true,
      status: true, eligibleForLeads: true,
    },
  })

  const tooShort: typeof all = []
  const urlFragment: Array<{ p: typeof all[number]; reason: string }> = []
  const singleWordOrNumber: typeof all = []

  for (const p of all) {
    const text = p.description?.trim() || ''
    // 1. Under 20 chars (likely placeholder / fragment)
    if (text.length > 0 && text.length < 20) {
      tooShort.push(p)
    }
    // 2. URL fragments / image params / placeholder words
    const frag = looksLikeUrlFragment(text)
    if (frag.junky) urlFragment.push({ p, reason: frag.reason! })
    // 3. Single word or just a number (not already caught by #2)
    if (text.length >= 20 && /^[\w-]+$/.test(text) && !frag.junky) {
      singleWordOrNumber.push(p)
    }
  }

  // Deduplicate — short ones often also match URL-fragment
  const allFlaggedIds = new Set<string>()
  const allFlagged: Array<{ p: any; bucket: string; reason: string }> = []
  for (const p of tooShort) {
    if (allFlaggedIds.has(p.id)) continue
    allFlaggedIds.add(p.id)
    allFlagged.push({ p, bucket: 'short (<20 chars)', reason: `len=${p.description?.length}` })
  }
  for (const { p, reason } of urlFragment) {
    if (allFlaggedIds.has(p.id)) continue
    allFlaggedIds.add(p.id)
    allFlagged.push({ p, bucket: 'URL fragment / image param', reason })
  }
  for (const p of singleWordOrNumber) {
    if (allFlaggedIds.has(p.id)) continue
    allFlaggedIds.add(p.id)
    allFlagged.push({ p, bucket: 'single word', reason: 'no whitespace, 20+ chars' })
  }

  console.log(`Total scanned (description not null): ${all.length}`)
  console.log(`Suspect descriptions: ${allFlagged.length}`)
  console.log(`  → Short (<20 chars):          ${tooShort.length}`)
  console.log(`  → URL fragment / image param: ${urlFragment.length}`)
  console.log(`  → Single word (20+ chars):    ${singleWordOrNumber.length}`)
  console.log(`  (Some overlap — total deduped above.)`)

  console.log(`\n## Active (VERIFIED + eligibleForLeads) providers with suspect descriptions`)
  const active = allFlagged.filter(({ p }) => p.status === 'VERIFIED' && p.eligibleForLeads)
  console.log(`  Count: ${active.length}\n`)
  for (const { p, bucket, reason } of active) {
    console.log(`  ⚠ ${p.name.trim()} (${p.id})`)
    console.log(`     ${p.primaryCity || '?'}, ${p.primaryState || '?'}`)
    console.log(`     bucket: ${bucket} (${reason})`)
    console.log(`     description: "${p.description}"`)
  }

  console.log(`\n## Sample 10 (all states, any status)`)
  for (const { p, bucket, reason } of allFlagged.slice(0, 10)) {
    const flag = p.status === 'VERIFIED' && p.eligibleForLeads ? '✅ ACTIVE' : '⚪ inactive'
    console.log(`  ${flag}  ${p.name.trim()} (${p.id})`)
    console.log(`     ${bucket} (${reason})  →  "${p.description}"`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
