import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    // Format the submission email
    const emailContent = `
New Provider Listing Application

BUSINESS INFORMATION:
- Business Name: ${formData.businessName}
- Contact Name: ${formData.contactName}
- Email: ${formData.email}
- Phone: ${formData.phone}
- Website: ${formData.website || 'Not provided'}

SERVICES:
${formData.services?.join(', ') || 'None selected'}

DESCRIPTION:
${formData.description}

LOCATION:
- Address: ${formData.address}
- City: ${formData.city}
- State: ${formData.state}
- ZIP Code: ${formData.zipCode}
- Service Area: ${formData.serviceArea || 'Not specified'}

CREDENTIALS:
- Years of Experience: ${formData.yearsExperience || 'Not specified'}
- Licensed: ${formData.licensed ? 'Yes' : 'No'}
- Insured: ${formData.insurance ? 'Yes' : 'No'}

---
Submitted: ${new Date().toLocaleString()}
IP Address: ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'}
    `.trim()

    // Log the submission (in production, you'd send this via email service)
    console.log('Provider submission received:', emailContent)

    // TODO: In production, integrate with an email service like:
    // - Resend (https://resend.com)
    // - SendGrid
    // - Nodemailer with SMTP
    // - AWS SES
    // For now, we'll return success and the data can be sent via mailto

    return NextResponse.json({
      success: true,
      message: 'Application received. Opening email client...',
      mailtoLink: `mailto:hector@mobilephlebotomy.org?subject=${encodeURIComponent(`New Provider Listing - ${formData.businessName}`)}&body=${encodeURIComponent(emailContent)}`
    })

  } catch (error) {
    console.error('Error processing provider submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}
