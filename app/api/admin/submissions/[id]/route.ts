import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession, verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { getSubmissionById, updateSubmissionStatus, deleteSubmission } from '@/lib/pending-submissions'
import { prisma } from '@/lib/prisma'
import { emailProviderApprovedWithLeadChoice } from '@/lib/providerEmails'

/**
 * Find and remove duplicate providers (both scraped and verified duplicates)
 */
async function removeDuplicateProviders(submission: any) {
  const duplicates = []

  // STEP 1: Check if there's already a VERIFIED provider with same email/phone
  // If yes, reject the submission to prevent duplicate verified providers
  if (submission.email || submission.phone) {
    const existingVerified = await prisma.provider.findFirst({
      where: {
        AND: [
          { status: 'VERIFIED' },
          {
            OR: [
              submission.email ? { email: submission.email } : {},
              submission.phone ? { phone: submission.phone } : {}
            ].filter(condition => Object.keys(condition).length > 0)
          }
        ]
      }
    })

    if (existingVerified) {
      throw new Error(`A verified provider already exists with this ${submission.email && existingVerified.email === submission.email ? 'email' : 'phone number'}. Please contact the provider to update their existing listing instead of creating a new one. Existing provider: "${existingVerified.name}"`)
    }
  }

  // STEP 2: Remove UNVERIFIED (scraped) duplicates
  // Search for potential duplicates by:
  // 1. Exact business name match (case-insensitive)
  // 2. Phone number match
  // 3. Email match
  // 4. Website match
  const potentialDuplicates = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { equals: submission.businessName, mode: 'insensitive' as const } },
        submission.phone ? { phone: submission.phone } : {},
        submission.email ? { email: submission.email } : {},
        submission.website ? { website: submission.website } : {}
      ].filter(condition => Object.keys(condition).length > 0), // Remove empty conditions
      status: 'UNVERIFIED' // Only delete scraped providers, not verified ones
    }
  })

  // Delete duplicates
  for (const duplicate of potentialDuplicates) {
    console.log(`🗑️  Removing duplicate scraped provider: ${duplicate.name} (ID: ${duplicate.id})`)

    // Delete provider coverage first (foreign key constraint)
    await prisma.providerCoverage.deleteMany({
      where: { providerId: duplicate.id }
    })

    // Delete the provider
    await prisma.provider.delete({
      where: { id: duplicate.id }
    })

    duplicates.push(duplicate.name)
  }

  if (duplicates.length > 0) {
    console.log(`✅ Removed ${duplicates.length} duplicate(s): ${duplicates.join(', ')}`)
  }

  return duplicates
}

/**
 * Add provider to PostgreSQL database
 */
async function addProviderToDatabase(submission: any) {
  // First, remove any duplicate scraped providers
  const duplicatesRemoved = await removeDuplicateProviders(submission)

  // Then, ensure state exists
  let state = await prisma.state.findFirst({
    where: { abbr: submission.state }
  })

  if (!state) {
    state = await prisma.state.create({
      data: {
        abbr: submission.state,
        name: submission.state
      }
    })
  }

  // Then, ensure city exists
  let city = await prisma.city.findFirst({
    where: {
      name: { equals: submission.city, mode: 'insensitive' },
      stateId: state.id
    }
  })

  if (!city) {
    // Generate slug from city name
    const citySlug = submission.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    city = await prisma.city.create({
      data: {
        name: submission.city,
        stateId: state.id,
        slug: citySlug
      }
    })
  }

  // Generate slug from business name
  const baseSlug = submission.businessName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  // Ensure unique slug
  let slug = baseSlug
  let counter = 1
  while (await prisma.provider.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  // Create the provider
  const provider = await prisma.provider.create({
    data: {
      name: submission.businessName,
      slug,
      phone: submission.phone || null,
      phonePublic: submission.phone || null,
      website: submission.website || null,
      email: submission.email || null,
      description: submission.description || null,
      zipCodes: submission.zipCode || null, // Store submitted ZIP for legacy compatibility
      status: 'VERIFIED', // Admin approved submissions get verified badge
      listingTier: 'BASIC' // Default to BASIC tier for free listings
    }
  })

  // Add coverage for the city
  await prisma.providerCoverage.create({
    data: {
      providerId: provider.id,
      stateId: state.id,
      cityId: city.id
    }
  })

  // Also add state-level coverage
  const existingStateCoverage = await prisma.providerCoverage.findFirst({
    where: {
      providerId: provider.id,
      stateId: state.id,
      cityId: null
    }
  })

  if (!existingStateCoverage) {
    await prisma.providerCoverage.create({
      data: {
        providerId: provider.id,
        stateId: state.id,
        cityId: null
      }
    })
  }

  return { provider, duplicatesRemoved: duplicatesRemoved.length }
}

/**
 * Approve a submission (add to CSV)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication from header or cookies
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const isAuthenticated = authHeader
      ? verifyAdminSessionFromCookies(authHeader)
      : await verifyAdminSession()

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { action } = await request.json()

    const submission = await getSubmissionById(id)

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Add provider to PostgreSQL database
      const result = await addProviderToDatabase(submission)

      // Update submission status
      await updateSubmissionStatus(id, 'approved')

      console.log(`✅ Provider ${result.provider.name} added to database with ID ${result.provider.id}`)

      // Send personalized welcome email based on lead opt-in choice
      if (submission.email) {
        try {
          // Check if provider has a website (for website service upsell)
          const hasWebsite = !!(submission.website && submission.website.trim() !== '')

          await emailProviderApprovedWithLeadChoice(
            submission.email,
            submission.businessName,
            submission.contactName,
            submission.leadOptIn,
            submission.leadContactMethod,
            hasWebsite
          )
          const emailType = submission.leadOptIn === 'yes' ? 'lead-ready' :
                           submission.leadOptIn === 'no' ? 'listing-only' : 'standard'
          console.log(`📧 Welcome email (${emailType}) sent to ${submission.email}`)
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError)
          // Don't fail the entire approval if email fails
        }
      }

      const message = result.duplicatesRemoved > 0
        ? `Provider approved and added to directory! (Removed ${result.duplicatesRemoved} duplicate scraped listing${result.duplicatesRemoved > 1 ? 's' : ''})`
        : 'Provider approved and added to directory immediately!'

      return NextResponse.json({
        success: true,
        message,
        provider: submission.businessName,
        providerId: result.provider.id,
        duplicatesRemoved: result.duplicatesRemoved
      })

    } else if (action === 'reject') {
      // Update status to rejected
      await updateSubmissionStatus(id, 'rejected')

      return NextResponse.json({
        success: true,
        message: 'Submission rejected',
        provider: submission.businessName
      })

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('Error processing submission action:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Delete a submission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication from header or cookies
    const authHeader = request.headers.get('authorization')
    const isAuthenticated = authHeader
      ? verifyAdminSessionFromCookies(authHeader)
      : await verifyAdminSession()

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const success = await deleteSubmission(id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Submission deleted'
    })

  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
