const { PrismaClient } = require('@prisma/client')
const Database = require('better-sqlite3')

// SQLite database (old)
const sqlite = new Database('./prisma/dev.db', { readonly: true })

// PostgreSQL database (new via Prisma)
const prisma = new PrismaClient()

async function migrate() {
  console.log('Starting migration from SQLite to PostgreSQL...\n')

  try {
    // 1. Migrate States
    console.log('Migrating states...')
    const states = sqlite.prepare('SELECT * FROM states').all()
    for (const state of states) {
      await prisma.state.upsert({
        where: { id: state.id },
        update: {},
        create: {
          id: state.id,
          name: state.name,
          abbr: state.abbr
        }
      })
    }
    console.log(`✓ Migrated ${states.length} states`)

    // 2. Migrate Cities
    console.log('Migrating cities...')
    const cities = sqlite.prepare('SELECT * FROM cities').all()
    for (const city of cities) {
      await prisma.city.upsert({
        where: { id: city.id },
        update: {},
        create: {
          id: city.id,
          name: city.name,
          stateId: city.state_id
        }
      })
    }
    console.log(`✓ Migrated ${cities.length} cities`)

    // 3. Migrate Providers
    console.log('Migrating providers...')
    const providers = sqlite.prepare('SELECT * FROM providers').all()
    for (const provider of providers) {
      await prisma.provider.upsert({
        where: { id: provider.id },
        update: {},
        create: {
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
          phone: provider.phone,
          phonePublic: provider.phonePublic,
          email: provider.email,
          website: provider.website,
          bookingUrl: provider.bookingUrl,
          description: provider.description,
          rating: provider.rating,
          reviewsCount: provider.reviewsCount,
          featured: provider.featured || false,
          status: provider.status || 'UNVERIFIED',
          isFeatured: provider.isFeatured || false,
          featuredTier: provider.featuredTier,
          stripeCustomerId: provider.stripeCustomerId,
          leadCredit: provider.leadCredit || 0,
          claimEmail: provider.claimEmail,
          claimToken: provider.claimToken,
          claimVerifiedAt: provider.claimVerifiedAt ? new Date(provider.claimVerifiedAt) : null,
          twilioNumber: provider.twilioNumber,
          zipCodes: provider.zipCodes,
          listingTier: provider.listingTier || 'BASIC',
          isFeaturedCity: provider.isFeaturedCity || false,
          serviceZipCodes: provider.serviceZipCodes,
          affiliateLink: provider.affiliateLink,
          createdAt: new Date(provider.createdAt),
          updatedAt: new Date(provider.updatedAt)
        }
      })
    }
    console.log(`✓ Migrated ${providers.length} providers`)

    // 4. Migrate Provider Coverage
    console.log('Migrating provider coverage...')
    const coverage = sqlite.prepare('SELECT * FROM provider_coverage').all()
    for (const cov of coverage) {
      await prisma.providerCoverage.upsert({
        where: { id: cov.id },
        update: {},
        create: {
          id: cov.id,
          providerId: cov.providerId,
          stateId: cov.stateId,
          cityId: cov.cityId
        }
      })
    }
    console.log(`✓ Migrated ${coverage.length} coverage records`)

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    sqlite.close()
  }
}

migrate()
