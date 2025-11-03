import { NextRequest, NextResponse } from 'next/server'
import { addPendingSubmission } from '@/lib/pending-submissions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    // Get IP address and user agent for security tracking
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Save as pending submission for admin review
    const submission = addPendingSubmission({
      businessName: formData.businessName,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
      services: formData.services,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      serviceArea: formData.serviceArea,
      yearsExperience: formData.yearsExperience,
      licensed: formData.licensed,
      insurance: formData.insurance,
      certifications: formData.certifications,
      specialties: formData.specialties,
      emergencyAvailable: formData.emergencyAvailable,
      weekendAvailable: formData.weekendAvailable,
      logo: formData.logo,
      ipAddress,
      userAgent
    })

    console.log('Provider submission saved for review:', submission.id)

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your application has been submitted and is pending review. We will contact you within 24-48 hours.',
      submissionId: submission.id
    })

  } catch (error) {
    console.error('Error processing provider submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}
