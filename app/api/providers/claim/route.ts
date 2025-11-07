import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import sg from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sg.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { providerId, email } = body

    if (!providerId || !email) {
      return NextResponse.json(
        { ok: false, error: 'Provider ID and email are required' },
        { status: 400 }
      )
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    const token = nanoid(32)

    await prisma.provider.update({
      where: { id: providerId },
      data: {
        status: 'PENDING',
        claimEmail: email,
        claimToken: token
      }
    })

    // Send verification email
    if (process.env.SENDGRID_API_KEY) {
      const verifyUrl = `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/provider/verify?token=${token}`

      await sg.send({
        to: email,
        from: process.env.LEAD_EMAIL_FROM || 'noreply@mobilephlebotomy.org',
        subject: 'Verify your provider listing - Mobile Phlebotomy',
        text: `Thank you for claiming your listing on Mobile Phlebotomy!\n\nClick the link below to verify your email and activate your provider account:\n\n${verifyUrl}\n\nOnce verified, you'll be able to:\n- Receive patient leads in your service area\n- Update your business information\n- Purchase lead credits and start receiving referrals\n\nIf you didn't request this, please ignore this email.`,
        html: `
          <h2>Verify Your Provider Listing</h2>
          <p>Thank you for claiming your listing on Mobile Phlebotomy!</p>
          <p>Click the button below to verify your email and activate your provider account:</p>
          <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0070f3;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a></p>
          <p>Once verified, you'll be able to:</p>
          <ul>
            <li>Receive patient leads in your service area</li>
            <li>Update your business information</li>
            <li>Purchase lead credits and start receiving referrals</li>
          </ul>
          <p><small>If you didn't request this, please ignore this email.</small></p>
        `
      })
    }

    return NextResponse.json({ ok: true, message: 'Verification email sent' })
  } catch (error: any) {
    console.error('Claim error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to process claim' },
      { status: 500 }
    )
  }
}
