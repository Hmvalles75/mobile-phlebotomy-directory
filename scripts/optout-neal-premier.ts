// One-off 2026-09-21: Tanya Neal (Neal Premier Drug Testing, Charlotte NC) asked
// to be taken out after receiving 18 emails in 9 days about one Matthews, NC
// patient (4 lead notifications plus 14 duplicate "was just claimed" emails).
// notifyEnabled=false is the guard every email path checks (lib/canNotify.ts);
// eligibleForLeads=false also takes her out of matching. The listing stays.
//   npx tsx scripts/optout-neal-premier.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'

const ID = 'cmo5uop0j0005gt043furkier'
async function main() {
  await runAsActor('admin', 'script/optout-neal-premier', async () => {
    const p = await prisma.provider.update({
      where: { id: ID },
      data: { notifyEnabled: false, eligibleForLeads: false },
      select: { name: true, notifyEnabled: true, eligibleForLeads: true },
    })
    console.log(JSON.stringify(p))
  })
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
