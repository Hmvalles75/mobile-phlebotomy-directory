import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { getPendingSubmissions, addPendingSubmission } from '@/lib/pending-submissions'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const isAuthenticated = verifyAdminSessionFromCookies(authHeader || cookieHeader)

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const submissions = await getPendingSubmissions()

    return NextResponse.json({
      success: true,
      submissions
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const isAuthenticated = verifyAdminSessionFromCookies(authHeader || cookieHeader)

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.businessName || !body.contactName || !body.email || !body.phone || !body.city || !body.state) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the submission
    const submission = await addPendingSubmission({
      businessName: body.businessName,
      contactName: body.contactName,
      email: body.email,
      phone: body.phone,
      website: body.website || undefined,
      description: body.description || 'Mobile phlebotomy services',
      address: body.address || undefined,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode || undefined,
      serviceArea: body.serviceArea || undefined,
      yearsExperience: body.yearsExperience || undefined,
      licensed: body.licensed === true,
      insurance: body.insurance === true,
      certifications: body.certifications || undefined,
      specialties: body.specialties || undefined,
      emergencyAvailable: body.emergencyAvailable === true,
      weekendAvailable: body.weekendAvailable === true,
      logo: body.logo || undefined,
      ipAddress: 'admin-created',
      userAgent: 'admin-dashboard'
    })

    return NextResponse.json({
      success: true,
      message: 'Provider submission created successfully',
      submission
    })

  } catch (error) {
    console.error('Error creating submission:', error)
    // Send detailed error message in development
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
