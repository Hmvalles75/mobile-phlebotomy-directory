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
      website: body.website,
      description: body.description || '',
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      serviceArea: body.serviceArea,
      yearsExperience: body.yearsExperience,
      licensed: body.licensed,
      insurance: body.insurance,
      certifications: body.certifications,
      specialties: body.specialties,
      emergencyAvailable: body.emergencyAvailable,
      weekendAvailable: body.weekendAvailable,
      logo: body.logo,
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
