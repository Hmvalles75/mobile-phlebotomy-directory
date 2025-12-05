const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Parse CSV manually (simple parser)
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length === 0) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = []
    let currentValue = ''
    let insideQuotes = false

    for (let char of lines[i]) {
      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())

    if (values.length === headers.length) {
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      rows.push(row)
    }
  }

  return rows
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function importProviders() {
  console.log('Importing providers from cleaned_providers.csv...\n')

  try {
    const providers = parseCSV('./cleaned_providers.csv')
    console.log(`Found ${providers.length} providers in CSV`)

    let imported = 0
    let skipped = 0
    let coverageAdded = 0

    for (const provider of providers) {
      try {
        const slug = slugify(provider.name)

        // Create or update provider
        const dbProvider = await prisma.provider.upsert({
          where: { slug },
          update: {
            name: provider.name,
            phone: provider.phone || null,
            website: provider.website || null,
            email: provider.email || null,
            description: provider.bio || null,
            rating: provider.totalScore ? parseFloat(provider.totalScore) : null,
            reviewsCount: provider.reviewsCount ? parseInt(provider.reviewsCount) : null,
            status: 'UNVERIFIED'
          },
          create: {
            name: provider.name,
            slug,
            phone: provider.phone || null,
            website: provider.website || null,
            email: provider.email || null,
            description: provider.bio || null,
            rating: provider.totalScore ? parseFloat(provider.totalScore) : null,
            reviewsCount: provider.reviewsCount ? parseInt(provider.reviewsCount) : null,
            status: 'UNVERIFIED',
            listingTier: 'BASIC'
          }
        })

        imported++

        // Add coverage based on state
        if (provider.state) {
          const state = await prisma.state.findFirst({
            where: {
              OR: [
                { name: { equals: provider.state, mode: 'insensitive' } },
                { abbr: { equals: provider.state, mode: 'insensitive' } }
              ]
            }
          })

          if (state) {
            // Add state-level coverage (check if exists first)
            const existingStateCoverage = await prisma.providerCoverage.findFirst({
              where: {
                providerId: dbProvider.id,
                stateId: state.id,
                cityId: null
              }
            })

            if (!existingStateCoverage) {
              await prisma.providerCoverage.create({
                data: {
                  providerId: dbProvider.id,
                  stateId: state.id,
                  cityId: null
                }
              })
              coverageAdded++
            }

            // Add city-level coverage if city exists
            if (provider.city) {
              const city = await prisma.city.findFirst({
                where: {
                  name: { equals: provider.city, mode: 'insensitive' },
                  stateId: state.id
                }
              })

              if (city) {
                await prisma.providerCoverage.upsert({
                  where: {
                    providerId_stateId_cityId: {
                      providerId: dbProvider.id,
                      stateId: state.id,
                      cityId: city.id
                    }
                  },
                  update: {},
                  create: {
                    providerId: dbProvider.id,
                    stateId: state.id,
                    cityId: city.id
                  }
                })
                coverageAdded++
              }
            }
          }
        }

        if (imported % 50 === 0) {
          console.log(`Imported ${imported}/${providers.length} providers...`)
        }

      } catch (error) {
        console.error(`Error importing ${provider.name}:`, error.message)
        skipped++
      }
    }

    console.log(`\n✅ Import completed!`)
    console.log(`  Imported: ${imported} providers`)
    console.log(`  Skipped: ${skipped} providers`)
    console.log(`  Coverage records added: ${coverageAdded}`)

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importProviders()
