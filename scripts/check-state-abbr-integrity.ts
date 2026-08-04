import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const states = await prisma.state.findMany({ select: { id: true, abbr: true, name: true } })
  console.log(`State rows: ${states.length}`)
  const bad = states.filter(s => s.abbr.length !== 2 || s.abbr !== s.abbr.toUpperCase())
  console.log(`\nRows whose abbr is NOT a clean 2-letter code: ${bad.length}`)
  for (const s of bad) {
    const n = await prisma.providerCoverage.count({ where: { stateId: s.id } })
    console.log(`  abbr="${s.abbr}"  name="${s.name}"  coverage rows=${n}`)
  }
  const dupes = new Map<string, number>()
  for (const s of states) dupes.set(s.name, (dupes.get(s.name) || 0) + 1)
  console.log(`\nDuplicate state names: ${[...dupes.entries()].filter(([, n]) => n > 1).map(([k, n]) => k + '×' + n).join(', ') || '(none)'}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
