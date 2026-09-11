// Apply (or re-apply) the provider change-log trigger. Idempotent.
//   npx tsx scripts/apply-provider-change-log.ts
// The provider_change_log TABLE comes from prisma/schema.prisma (db push first);
// this only installs the function + trigger, which Prisma cannot express.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
async function main() {
  const sql = readFileSync(join(__dirname, 'sql', 'provider-change-log.sql'), 'utf-8')
  // Split on the statement boundaries we control (function body contains ';').
  const stmts = sql.split(/\n(?=CREATE OR REPLACE FUNCTION|DROP TRIGGER|CREATE TRIGGER)/).map(s => s.trim()).filter(s => s && !s.startsWith('--'))
  for (const st of stmts) {
    const body = st.replace(/^--.*$/gm, '').trim()
    if (!body) continue
    await prisma.$executeRawUnsafe(body)
    console.log('ok:', body.split('\n')[0].slice(0, 70))
  }
  const check = await prisma.$queryRawUnsafe<{ tgname: string }[]>(`select tgname from pg_trigger where tgname = 'provider_change_log_trg'`)
  console.log('trigger installed:', check.length === 1)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
