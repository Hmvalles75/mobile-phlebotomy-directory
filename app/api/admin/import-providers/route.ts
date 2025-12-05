import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// Parse CSV manually (simple parser)
function parseCSV(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length === 0) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const rows: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = []
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
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      rows.push(row)
    }
  }

  return rows
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  try {
    // Security: Add a secret key check
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting provider import...')

    // Read CSV file from public directory or data directory
    const csvPath = path.join(process.cwd(), 'cleaned_providers.csv')

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({
        error: 'CSV file not found',
        path: csvPath
      }, { status: 404 })
    }

    const providers = parseCSV(csvPath)
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

      } catch (error: any) {
        console.error(`Error importing ${provider.name}:`, error.message)
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      coverageAdded,
      total: providers.length
    })

  } catch (error: any) {
    console.error('Import failed:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
