import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding FlashDrive Mobile Lab to database...')

  // Create slug
  const slug = 'flashdrive-mobile-lab-chicago-il'

  // Check if already exists
  const existing = await prisma.provider.findUnique({
    where: { slug }
  })

  if (existing) {
    console.log('❌ Provider already exists with slug:', slug)
    return
  }

  // Create provider
  const provider = await prisma.provider.create({
    data: {
      name: 'FlashDrive Mobile Lab',
      slug,
      phone: '(331) 725-2755',
      phonePublic: '(331) 725-2755',
      website: 'http://flashdrivemobilelab.com/',
      description: 'Mobile phlebotomy services in the western suburbs of Chicago',
      rating: 5.0,
      reviewsCount: 31,
      status: 'VERIFIED', // Since you're manually adding this
      zipCodes: '60540,60555,60563,60564,60565', // Western Chicago suburbs

      // Create address
      address: {
        create: {
          city: 'Chicago',
          state: 'Illinois',
          zip: '60540'
        }
      },

      // Create coverage
      coverage: {
        create: [
          {
            state: {
              connectOrCreate: {
                where: { abbr: 'IL' },
                create: { name: 'Illinois', abbr: 'IL' }
              }
            },
            city: {
              connectOrCreate: {
                where: {
                  name_stateId: {
                    name: 'Chicago',
                    stateId: '' // Will be set by Prisma
                  }
                },
                create: {
                  name: 'Chicago',
                  slug: 'chicago',
                  state: {
                    connectOrCreate: {
                      where: { abbr: 'IL' },
                      create: { name: 'Illinois', abbr: 'IL' }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    }
  })

  console.log('✅ Successfully added FlashDrive Mobile Lab')
  console.log('   Name:', provider.name)
  console.log('   Slug:', provider.slug)
  console.log('   Phone:', provider.phone)
  console.log('   Rating:', provider.rating, '⭐ (' + provider.reviewsCount + ' reviews)')
  console.log('   Status:', provider.status)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
