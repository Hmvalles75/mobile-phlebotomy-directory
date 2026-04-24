import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const PROVIDER_ID = 'cmkx2iirb0002la04m04jn2z2'

// The 4 testimonials Mireille sent on 2026-04-22. Moving them out of the
// description field (where they're currently rendering in the About Us
// block) into a structured testimonials field so they render in the
// dedicated Patient Reviews section of the premium page template.
const TESTIMONIALS = [
  {
    quote: "Carewithluvs provided outstanding service. The team was professional, punctual, and made the entire process smooth and stress-free. I highly recommend them for DNA testing and mobile blood draw services.",
    author: "Adams family",
    location: "",
    rating: 5,
  },
  {
    quote: "I brought my toddler for a blood draw and was so impressed with how gentle and patient they were. Carewithluvs truly cares about their clients. I will definitely be returning.",
    author: "The Simpsons family",
    location: "",
    rating: 5,
  },
  {
    quote: "From booking to service completion, everything was seamless. Their customer service is top-tier, and they truly go above and beyond for their clients.",
    author: "Lawson family",
    location: "",
    rating: 5,
  },
  {
    quote: "Carewithluvs made me feel comfortable from start to finish. Their compassion and professionalism truly stand out. I highly recommend their services to anyone needing reliable care.",
    author: "Lisa Besley",
    location: "",
    rating: 5,
  },
]

const CLEAN_DESCRIPTION = `Carewithluvs LLC is a Maryland-based mobile healthcare service offering phlebotomy services, breath alcohol testing, nail and hair drug testing, DOT and NON-DOT specimen collection, immigration DNA testing, and early gender reveal DNA testing. We provide flexible scheduling, including evenings and weekends, to meet client needs quickly and efficiently.

Our pricing is competitive and often lower than traditional facilities, allowing our partners and clients to receive high-quality, compliant services without high overhead costs. We are committed to professionalism, confidentiality, and reliable service delivery.

We invite you to connect with us to support your organization and discuss a potential partnership.`

async function main() {
  const before = await prisma.provider.findUnique({ where: { id: PROVIDER_ID } })
  if (!before) { console.log('NOT FOUND'); return }

  console.log('=== BEFORE ===')
  console.log('description has "Client Reviews":', before.description?.includes('Client Reviews'))
  console.log('testimonials field:', before.testimonials || '(empty)')

  await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: {
      description: CLEAN_DESCRIPTION,
      testimonials: JSON.stringify(TESTIMONIALS),
    },
  })

  console.log('\n=== AFTER ===')
  console.log(`Stored ${TESTIMONIALS.length} testimonials as JSON.`)
  console.log('Description cleaned (review block removed).')
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
