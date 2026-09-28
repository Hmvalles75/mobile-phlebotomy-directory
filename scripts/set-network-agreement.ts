// Record signed network / NCA agreements on provider records.
//
//   npx tsx scripts/set-network-agreement.ts --slug=<slug> --date=2026-08-14
//   npx tsx scripts/set-network-agreement.ts --csv=docs/findings/network-agreements.csv   # columns: slug,date[,note]
//   add --dry to print without writing; --clear with --slug to unset
//
// Provider.networkAgreementSignedAt is what coverage checks (e.g.
// scripts/ameriwound-bench-*.ts) use to split "network" from "directory-only".
// Before 2026-09-28 the only proxies were onboardingStatus and claimVerifiedAt,
// which undercounted the bench on every B2B check. Writes go through
// runAsActor so the provider change log records "admin".
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import * as fs from 'fs'
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'

const arg = (k: string) => process.argv.find(a => a.startsWith(`--${k}=`))?.slice(k.length + 3)
const dry = process.argv.includes('--dry')
const clear = process.argv.includes('--clear')

async function apply(slug: string, date: Date | null): Promise<string> {
  const p = await prisma.provider.findUnique({ where: { slug }, select: { id: true, name: true, networkAgreementSignedAt: true, removedAt: true } })
  if (!p) return `  ${slug}: NOT FOUND`
  const line = `  ${p.name.trim()} (${slug}): ${p.networkAgreementSignedAt?.toISOString().slice(0, 10) || 'none'} -> ${date ? date.toISOString().slice(0, 10) : 'none'}${p.removedAt ? '  [record is soft-removed]' : ''}`
  if (dry) return line + '  (dry)'
  await runAsActor('admin', 'scripts/set-network-agreement', () => prisma.provider.update({ where: { id: p.id }, data: { networkAgreementSignedAt: date } }))
  return line + '  written'
}

function parseDate(s: string): Date {
  const d = new Date(`${s.trim()}T12:00:00Z`)
  if (isNaN(d.getTime())) throw new Error(`bad date "${s}" (use YYYY-MM-DD)`)
  return d
}

async function main() {
  const slug = arg('slug'), date = arg('date'), csv = arg('csv')
  if (slug) {
    if (!clear && !date) throw new Error('--date=YYYY-MM-DD required (or --clear)')
    console.log(await apply(slug, clear ? null : parseDate(date!)))
  } else if (csv) {
    const lines = fs.readFileSync(csv, 'utf-8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    const start = /^slug\s*,/i.test(lines[0]) ? 1 : 0
    for (const l of lines.slice(start)) {
      const [s, d] = l.split(',').map(x => x.replace(/^"|"$/g, '').trim())
      console.log(await apply(s, parseDate(d)))
    }
  } else {
    throw new Error('give --slug=... --date=... or --csv=...')
  }
  const n = await prisma.provider.count({ where: { networkAgreementSignedAt: { not: null }, removedAt: null } })
  console.log(`providers with a signed agreement on record: ${n}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e.message || e); process.exit(1) })
