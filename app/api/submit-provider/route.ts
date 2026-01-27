import { NextRequest, NextResponse } from 'next/server'
import { addPendingSubmission } from '@/lib/pending-submissions'
import { checkForDuplicate } from '@/lib/duplicate-detection'

/**
 * Send email notification to admin about new submission
 */
async function sendAdminNotification(submission: any) {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured - skipping email notification')
    return false
  }

  try {
    const emailBody = `
New Provider Listing Application

BUSINESS INFORMATION:
- Business Name: ${submission.businessName}
- Contact Name: ${submission.contactName}
- Email: ${submission.email}
- Phone: ${submission.phone}
- Website: ${submission.website || 'Not provided'}

SERVICES:
${submission.services?.join(', ') || 'Not specified'}

DESCRIPTION:
${submission.description}

LOCATION:
- Address: ${submission.address || 'Not provided'}
- City: ${submission.city}
- State: ${submission.state}
- ZIP Code: ${submission.zipCode || 'Not provided'}
- Service Area: ${submission.serviceArea || 'Not specified'}

CREDENTIALS:
- Years of Experience: ${submission.yearsExperience || 'Not provided'}
- Licensed: ${submission.licensed ? 'Yes' : 'No'}
- Insured: ${submission.insurance ? 'Yes' : 'No'}
${submission.certifications ? `- Certifications: ${submission.certifications}` : ''}
${submission.specialties ? `- Specialties: ${submission.specialties}` : ''}

---
Submitted: ${new Date(submission.submittedAt).toLocaleString()}
IP Address: ${submission.ipAddress}

Review at: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/admin
    `.trim()

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MobilePhlebotomy.org <noreply@mobilephlebotomy.org>',
        to: ['hector@mobilephlebotomy.org'],
        subject: `New Provider Application: ${submission.businessName}`,
        text: emailBody,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send email notification:', error)
      return false
    }

    console.log('✅ Email notification sent to admin')
    return true
  } catch (error) {
    console.error('Error sending email notification:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    // Check for duplicate provider before accepting submission
    // Now checks both Provider table AND PendingSubmission table
    const duplicateCheck = await checkForDuplicate(
      formData.businessName,
      formData.website,
      undefined, // excludeId
      formData.email,
      formData.phone
    )

    if (duplicateCheck.isDuplicate) {
      const status = duplicateCheck.existingProvider?.status

      // Different messages based on where the duplicate was found
      let message = ''
      if (status?.includes('PENDING_SUBMISSION')) {
        message = `You've already submitted an application for "${duplicateCheck.existingProvider?.name}" which is currently pending review. Please wait for us to process your existing application. We'll contact you within 24-48 hours.`
      } else {
        message = `A provider with similar name or website already exists in our directory: "${duplicateCheck.existingProvider?.name}". If this is your business and you'd like to claim it, please use our claim listing feature.`
      }

      return NextResponse.json({
        success: false,
        error: 'duplicate',
        message,
        existingProvider: {
          id: duplicateCheck.existingProvider?.id,
          name: duplicateCheck.existingProvider?.name,
          slug: duplicateCheck.existingProvider?.slug,
          status: status
        }
      }, { status: 409 })
    }

    // Get IP address and user agent for security tracking
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Save as pending submission for admin review
    const submission = await addPendingSubmission({
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

    // Send email notification to admin (non-blocking)
    sendAdminNotification(submission).catch(err => {
      console.error('Email notification failed:', err)
    })

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
