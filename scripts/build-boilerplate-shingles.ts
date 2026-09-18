// Learn platform boilerplate from the corpus itself.
//   npx tsx scripts/build-boilerplate-shingles.ts
// Writes data/description-boilerplate-shingles.json: every 4-word shingle that
// appears in the descriptions of at least MIN_PROVIDERS distinct providers.
// A phrase shared verbatim by unrelated businesses is site chrome ("use tab
// to navigate through the menu items", "skip to main content", "we use
// cookies to improve") or a seed template, never that provider's own words.
// This is derived from data, not hand-curated; re-run after large imports.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { join } from 'path'

const MIN_PROVIDERS = 4
const N = 4

export function shinglesOf(text: string): string[] {
  const tokens = text.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean)
  const out: string[] = []
  for (let i = 0; i + N <= tokens.length; i++) out.push(tokens.slice(i, i + N).join(' '))
  return out
}

async function main() {
  const prisma = new PrismaClient()
  const rows = await prisma.provider.findMany({ where: { removedAt: null, description: { not: null } }, select: { name: true, description: true } })
  const seen = new Map<string, number>()
  for (const r of rows) {
    // Drop the provider's own name so shingles never learn business names.
    const text = (r.description || '').replace(new RegExp(r.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
    for (const s of new Set(shinglesOf(text))) seen.set(s, (seen.get(s) || 0) + 1)
  }
  const frequent = [...seen.entries()].filter(([, n]) => n >= MIN_PROVIDERS).map(([s]) => s).sort()
  const out = join(__dirname, '..', 'data', 'description-boilerplate-shingles.json')
  writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), minProviders: MIN_PROVIDERS, n: N, providers: rows.length, shingles: frequent }, null, 0))
  console.log(`providers ${rows.length}; distinct shingles ${seen.size}; kept (>= ${MIN_PROVIDERS} providers) ${frequent.length} -> ${out}`)
  const top = [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
  for (const [s, n] of top) console.log(`  ${String(n).padStart(4)}  ${s}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
