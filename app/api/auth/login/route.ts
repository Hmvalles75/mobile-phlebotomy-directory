import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkToken } from '@/lib/auth'
import sg from '@sendgrid/mail'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create magic link token
    const result = await createMagicLinkToken(email)

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      )
    }

    // Get the provider to send email with token
    const { prisma } = await import('@/lib/prisma')
    const normalizedEmail = email.toLowerCase().trim()
    const provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { claimEmail: { equals: normalizedEmail, mode: 'insensitive' } },
          { email: { equals: normalizedEmail, mode: 'insensitive' } }
        ]
      }
    })

    if (!provider || !provider.claimToken) {
      return NextResponse.json(
        { ok: false, error: 'Failed to generate login link' },
        { status: 500 }
      )
    }

    // Set claimEmail if not already set (first time claiming)
    if (!provider.claimEmail) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: { claimEmail: normalizedEmail }
      })
    }

    // Send magic link email
    const magicLink = `${process.env.PUBLIC_SITE_URL || 'http://localhost:3002'}/api/auth/verify?token=${provider.claimToken}`

    if (process.env.SENDGRID_API_KEY) {
      // Set API key at send time for compatibility with scripts
      sg.setApiKey(process.env.SENDGRID_API_KEY)
      await sg.send({
        to: email,
        from: process.env.LEAD_EMAIL_FROM || 'noreply@mobilephlebotomy.org',
        subject: 'Your Dashboard Login Link - MobilePhlebotomy.org',
        text: `Hi ${provider.name},

Click the link below to access your provider dashboard:

${magicLink}

This link will expire in 15 minutes and can only be used once.

If you didn't request this login link, please ignore this email.

— MobilePhlebotomy.org`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Access Your Provider Dashboard</h2>
            <p>Hi ${provider.name},</p>
            <p>Click the button below to securely access your provider dashboard:</p>
            <p style="margin: 30px 0;">
              <a href="${magicLink}"
                 style="display: inline-block; padding: 14px 28px; background: #0070f3; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Access Dashboard
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${magicLink}" style="color: #0070f3;">${magicLink}</a>
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This link will expire in 15 minutes and can only be used once.<br>
              If you didn't request this login link, please ignore this email.
            </p>
          </div>
        `
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Magic link sent! Check your email to access your dashboard.'
    })

  } catch (error: any) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to send login link' },
      { status: 500 }
    )
  }
}
