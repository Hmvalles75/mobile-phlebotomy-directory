const { PrismaClient } = require('@prisma/client')
const statesData = require('../data/states.json')
const citiesData = require('../data/cities.json')
const providersData = require('../data/providers.json')

const prisma = new PrismaClient()

async function importData() {
  console.log('Starting data import to PostgreSQL...\n')

  try {
    // 1. Import States
    console.log('Importing states...')
    for (const state of statesData) {
      await prisma.state.upsert({
        where: { abbr: state.abbr },
        update: { name: state.name },
        create: {
          name: state.name,
          abbr: state.abbr
        }
      })
    }
    console.log(`✓ Imported ${statesData.length} states`)

    // 2. Import Cities
    console.log('Importing cities...')
    for (const city of citiesData) {
      const state = await prisma.state.findUnique({ where: { abbr: city.stateAbbr } })
      if (state) {
        await prisma.city.upsert({
          where: {
            name_stateId: {
              name: city.name,
              stateId: state.id
            }
          },
          update: {},
          create: {
            name: city.name,
            slug: city.slug || city.name.toLowerCase().replace(/\s+/g, '-'),
            stateId: state.id
          }
        })
      }
    }
    console.log(`✓ Imported ${citiesData.length} cities`)

    // 3. Import Providers
    console.log('Importing providers...')
    let count = 0
    for (const provider of providersData) {
      await prisma.provider.upsert({
        where: { slug: provider.slug },
        update: {},
        create: {
          name: provider.name,
          slug: provider.slug,
          phone: provider.phone || null,
          phonePublic: provider.phonePublic || null,
          email: provider.email || null,
          website: provider.website || null,
          bookingUrl: provider.bookingUrl || null,
          description: provider.description || null,
          rating: provider.rating || null,
          reviewsCount: provider.reviewsCount || null,
          featured: provider.featured || false,
          status: provider.status || 'UNVERIFIED',
          isFeatured: provider.isFeatured || false,
          featuredTier: provider.featuredTier || null,
          leadCredit: provider.leadCredit || 0,
          zipCodes: provider.zipCodes || null,
          listingTier: provider.listingTier || 'BASIC',
          isFeaturedCity: provider.isFeaturedCity || false
        }
      })
      count++
      if (count % 50 === 0) {
        console.log(`  Imported ${count}/${providersData.length} providers...`)
      }
    }
    console.log(`✓ Imported ${count} providers`)

    // 4. Import Provider Coverage
    console.log('Importing provider coverage...')
    let coverageCount = 0
    for (const provider of providersData) {
      if (provider.coverage && Array.isArray(provider.coverage)) {
        const dbProvider = await prisma.provider.findUnique({ where: { slug: provider.slug } })
        if (dbProvider) {
          for (const cov of provider.coverage) {
            const state = await prisma.state.findUnique({ where: { abbr: cov.state } })
            if (state) {
              let cityId = null
              if (cov.city) {
                const city = await prisma.city.findFirst({
                  where: { name: cov.city, stateId: state.id }
                })
                cityId = city?.id || null
              }

              await prisma.providerCoverage.upsert({
                where: {
                  providerId_stateId_cityId: {
                    providerId: dbProvider.id,
                    stateId: state.id,
                    cityId: cityId
                  }
                },
                update: {},
                create: {
                  providerId: dbProvider.id,
                  stateId: state.id,
                  cityId: cityId
                }
              })
              coverageCount++
            }
          }
        }
      }
    }
    console.log(`✓ Imported ${coverageCount} coverage records`)

    console.log('\n✅ Data import completed successfully!')
    console.log(`\nSummary:`)
    console.log(`  - ${statesData.length} states`)
    console.log(`  - ${citiesData.length} cities`)
    console.log(`  - ${count} providers`)
    console.log(`  - ${coverageCount} coverage records`)

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importData()
