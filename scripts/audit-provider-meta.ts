// Audit the provider title/description builders against every live record.
//   npx tsx scripts/audit-provider-meta.ts            summary + samples
//   npx tsx scripts/audit-provider-meta.ts --csv      also writes a CSV of every page's old vs new strings
// Read-only. Validates lib/descriptionQuality.ts and lib/providerMeta.ts (2026-09-17).
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { assessDescription } from '../lib/descriptionQuality'
import { buildProviderTitle, buildProviderDescription } from '../lib/providerMeta'

const prisma = new PrismaClient()
const NAV_WORDS = /skip to (main )?content|skip to navigation|top of page|use tab to navigate|open the mobile|main menu|search icon|return to .* homepage|toggle navigation|sign in|log in|cookie|javascript|menu menu|home about|©|all rights reserved/i

async function main() {
  const rows = await prisma.provider.findMany({ where: { removedAt: null }, select: { slug: true, name: true, primaryCity: true, primaryState: true, description: true, languages: true, serviceRadiusMiles: true, status: true, isFixedSite: true, services: { select: { service: { select: { name: true } } } } }, orderBy: { name: 'asc' } })
  const out = rows.map(r => {
    const input = { slug: r.slug, name: r.name, city: r.primaryCity, state: r.primaryState, bio: r.description, services: r.services.map(s => s.service.name), languages: r.languages, serviceRadiusMiles: r.serviceRadiusMiles, status: r.status, isFixedSite: r.isFixedSite }
    const a = assessDescription(r.description, r.name)
    const d = buildProviderDescription(input)
    return { r, a, title: buildProviderTitle(input), desc: d.description, source: d.source, navWords: NAV_WORDS.test(r.description || '') }
  })
  const n = out.length
  const by = (k: string) => out.filter(o => o.a.kind === k).length
  console.log(`live rows: ${n} | prose ${by('prose')} | boilerplate ${by('boilerplate')} | thin ${by('thin')} | empty ${by('empty')} | prose/thin with a chrome prefix stripped ${out.filter(o => o.a.kind !== 'boilerplate' && o.a.strippedWords > 0).length}`)
  const wordHits = out.filter(o => o.navWords)
  const handled = (o: typeof out[0]) => o.a.kind === 'boilerplate' || o.a.strippedWords > 0
  console.log(`word-list nav hits: ${wordHits.length}; handled structurally (rejected or prefix stripped): ${wordHits.filter(handled).length}; untouched: ${wordHits.filter(o => !handled(o)).map(o => o.r.slug).join(', ') || 'none'}`)
  console.log(`structural rejections WITHOUT a word-list hit: ${out.filter(o => o.a.kind === 'boilerplate' && !o.navWords).length}`)
  console.log(`description source: prose ${out.filter(o => o.source === 'prose').length} | thin+built ${out.filter(o => o.source === 'thin+built').length} | built ${out.filter(o => o.source === 'built').length}`)
  const descs = new Map<string, number>(); for (const o of out) descs.set(o.desc, (descs.get(o.desc) || 0) + 1)
  console.log(`distinct descriptions: ${descs.size} of ${n}; duplicated strings: ${[...descs.values()].filter(v => v > 1).length}; longest ${Math.max(...out.map(o => o.desc.length))} chars; over 160: ${out.filter(o => o.desc.length > 160).length}; ending in ellipsis: ${out.filter(o => o.desc.endsWith('…')).length}`)
  console.log(`titles without a place: ${out.filter(o => !/ in /.test(o.title)).length}; titles saying "in USA" or bare state: ${out.filter(o => / in (USA|[A-Z]{2})$/.test(o.title)).length}`)
  console.log(`double "provides mobile phlebotomy" sentences remaining: ${out.filter(o => /(\b\w+ provides mobile phlebotomy\b)[\s\S]*\1/i.test(o.desc)).length}`)

  console.log('\n--- structural rejections WITHOUT a word-list hit (false-positive check) ---')
  for (const o of out.filter(o => o.a.kind === 'boilerplate' && !o.navWords).slice(0, 14)) console.log(`  ${o.r.slug} [${o.a.reasons.join('; ')}]\n     "${(o.r.description || '').replace(/\s+/g, ' ').slice(0, 150)}"`)
  console.log('\n--- prose/thin kept after stripping a chrome prefix (does the remainder read well?) ---')
  for (const o of out.filter(o => o.a.kind !== 'boilerplate' && o.a.strippedWords > 0).slice(0, 10)) console.log(`  ${o.r.slug} [${o.a.reasons.join('; ')}]\n     KEPT: "${o.a.cleaned.slice(0, 150)}"`)
  console.log('\n--- ten prose descriptions with the most Title Case (should all be real prose) ---')
  const capsOf = (t: string) => { const w = t.split(' ').slice(1); return w.filter(x => /^[A-Z][a-z]/.test(x)).length / Math.max(w.length, 1) }
  for (const o of out.filter(o => o.a.kind === 'prose').sort((x, y) => capsOf(y.a.cleaned) - capsOf(x.a.cleaned)).slice(0, 10)) console.log(`  ${o.r.slug} [caps ${Math.round(capsOf(o.a.cleaned) * 100)}%]\n     "${o.a.cleaned.slice(0, 150)}"`)
  console.log('\n--- the four low-CTR pages + two comparisons ---')
  for (const s of ['connect-mobile-phlebotomy', 'guthrie-sayre-laboratory-services', 'ohsu-outpatient-lab-south-waterfront', 'apex-laboratory', 'getblood-mobile-phlebotomy', 'mass-mobile-phlebotomy-services-llc']) {
    const o = out.find(x => x.r.slug === s); if (!o) continue
    console.log(`  ${s} (${o.source}; ${o.a.reasons.join('; ') || 'no flags'})\n     TITLE: ${o.title}\n     DESC (${o.desc.length}): ${o.desc}`)
  }
  console.log('\n--- eight built descriptions, spread across the list ---')
  const built = out.filter(o => o.source === 'built' && !o.r.isFixedSite); for (let i = 0; i < 8; i++) { const o = built[Math.floor((i + 1) * built.length / 9)]; console.log(`  ${o.r.slug}: ${o.desc}`) }
  console.log('\n--- six thin+built ---')
  const tb = out.filter(o => o.source === 'thin+built'); for (let i = 0; i < 6; i++) { const o = tb[Math.floor((i + 1) * tb.length / 7)]; console.log(`  ${o.r.slug}: ${o.desc}`) }

  if (process.argv.includes('--csv')) {
    const q = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
    const lines = ['slug,status,fixedSite,kind,source,reasons,newTitle,newDescription,oldDescription']
    for (const o of out) lines.push([o.r.slug, o.r.status, o.r.isFixedSite, o.a.kind, o.source, o.a.reasons.join('; '), o.title, o.desc, (o.r.description || '').replace(/\s+/g, ' ').slice(0, 300)].map(q).join(','))
    const path = 'C:/Users/hmval/AppData/Local/Temp/claude/c--Users-hmval-OneDrive-Desktop-MobilePhlebotomy/b8e72539-a952-4517-9afd-822c01d9ffb8/scratchpad/provider-meta-audit.csv'
    writeFileSync(path, lines.join('\n')); console.log('\nCSV ->', path)
  }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
