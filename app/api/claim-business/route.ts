import { NextRequest, NextResponse } from 'next/server'
import { addBusinessClaim } from '@/lib/business-claims'

/**
 * Send email notification to admin about new business claim
 */
async function sendClaimNotification(claim: any) {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured - skipping email notification')
    return false
  }

  try {
    const emailBody = `
New Business Claim Submission

BUSINESS INFORMATION:
- Provider: ${claim.providerName}
- Provider ID: ${claim.providerId}

CLAIMANT INFORMATION:
- Name: ${claim.claimantName}
- Email: ${claim.claimantEmail}
- Phone: ${claim.claimantPhone}

REQUESTED UPDATES:
${claim.requestedUpdates}

VERIFICATION STATUS:
- Owner Confirmed: ${claim.isOwnerConfirmed ? 'Yes' : 'No'}
- Submitted: ${new Date(claim.submittedAt).toLocaleString()}
- IP Address: ${claim.ipAddress}

---
NEXT STEPS:
1. Review the claim details
2. Send verification email to: ${claim.claimantEmail}
3. Subject: "Verify Your Business Claim - ${claim.providerName}"
4. Message: "Thanks for claiming ${claim.providerName}. Reply to this email to confirm you're authorized to manage this listing."
5. Once they reply, verify the claim in admin dashboard

Review claim at: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/admin
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
        subject: `Business Claim: ${claim.providerName}`,
        text: emailBody,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send claim notification:', error)
      return false
    }

    console.log('✅ Claim notification sent to admin')
    return true
  } catch (error) {
    console.error('Error sending claim notification:', error)
    return false
  }
}

/**
 * Send verification email to claimant
 */
async function sendVerificationEmail(claim: any) {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured - skipping verification email')
    return false
  }

  try {
    const verificationEmail = `
Hi ${claim.claimantName},

Thank you for claiming your business listing for ${claim.providerName} on MobilePhlebotomy.org!

To verify that you're authorized to manage this listing, please reply to this email with:
- Your confirmation that you own or represent ${claim.providerName}
- Any additional proof of ownership (business license, website domain ownership, etc.)

Once we receive your reply, we'll:
✓ Add a "Verified Listing" badge to your page
✓ Process any updates you've requested
✓ Give you the ability to manage your listing

If you did not submit this claim, please let us know immediately.

Best regards,
MobilePhlebotomy.org Team

---
Reference: ${claim.id}
Submitted: ${new Date(claim.submittedAt).toLocaleString()}
    `.trim()

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MobilePhlebotomy.org <noreply@mobilephlebotomy.org>',
        to: [claim.claimantEmail],
        replyTo: ['hector@mobilephlebotomy.org'],
        subject: `Verify Your Business Claim - ${claim.providerName}`,
        text: verificationEmail,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send verification email:', error)
      return false
    }

    console.log('✅ Verification email sent to claimant')
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    // Get IP address and user agent for security tracking
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Save business claim
    const claim = addBusinessClaim({
      providerId: formData.providerId,
      providerName: formData.providerName,
      claimantName: formData.claimantName,
      claimantEmail: formData.claimantEmail,
      claimantPhone: formData.claimantPhone,
      requestedUpdates: formData.requestedUpdates,
      isOwnerConfirmed: formData.isOwnerConfirmed,
      ipAddress,
      userAgent
    })

    console.log('Business claim submitted:', claim.id)

    // Send notification emails (non-blocking)
    sendClaimNotification(claim).catch(err => {
      console.error('Claim notification failed:', err)
    })

    sendVerificationEmail(claim).catch(err => {
      console.error('Verification email failed:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Claim submitted successfully. Please check your email for verification.',
      claimId: claim.id
    })

  } catch (error) {
    console.error('Error processing business claim:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process claim' },
      { status: 500 }
    )
  }
}
