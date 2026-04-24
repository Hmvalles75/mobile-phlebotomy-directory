import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const PROVIDER_ID = 'cmkx2iirb0002la04m04jn2z2'  // CAREWITHLUVS LLC
const POSTER_PATH = '/images/CareWithLuvsPoster.jpg'

async function main() {
  const updated = await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: { heroPoster: POSTER_PATH },
    select: { name: true, heroPoster: true, profileImage: true },
  })
  console.log(updated)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
