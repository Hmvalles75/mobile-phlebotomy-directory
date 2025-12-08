import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession, verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { getSubmissionById, updateSubmissionStatus, deleteSubmission } from '@/lib/pending-submissions'
import { prisma } from '@/lib/prisma'

/**
 * Add provider to PostgreSQL database
 */
async function addProviderToDatabase(submission: any) {
  // First, ensure state exists
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

  // Create the provider
  const provider = await prisma.provider.create({
    data: {
      name: submission.businessName,
      phone: submission.phone || '',
      website: submission.website || null,
      email: submission.email || null,
      city: submission.city,
      state: submission.state,
      address: submission.address || null,
      zipCode: submission.zipCode || null,
      description: submission.description || null,
      yearsExperience: submission.yearsExperience || null,
      certifications: submission.certifications || null,
      specialties: submission.specialties || null,
      emergencyAvailable: submission.emergencyAvailable || false,
      weekendAvailable: submission.weekendAvailable || false,
      status: 'VERIFIED', // Admin approved submissions get verified badge
      listingTier: 'FREE'
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

  return provider
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
      const provider = await addProviderToDatabase(submission)

      // Update submission status
      await updateSubmissionStatus(id, 'approved')

      console.log(`✅ Provider ${provider.name} added to database with ID ${provider.id}`)

      return NextResponse.json({
        success: true,
        message: 'Provider approved and added to directory immediately!',
        provider: submission.businessName,
        providerId: provider.id
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

  } catch (error) {
    console.error('Error processing submission action:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
