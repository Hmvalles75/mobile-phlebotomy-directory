import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { emailAdmin } from '@/lib/adminEmail'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  zipCode: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, zipCode } = parsed.data

    // Check if email already exists
    const existing = await prisma.waitlist.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json({
        ok: true,
        message: 'You\'re already on the list!'
      })
    }

    // Create waitlist entry
    await prisma.waitlist.create({
      data: {
        email,
        zipCode: zipCode || null,
        source: 'COMING_SOON_PAGE'
      }
    })

    // Notify admin with ZIP code for lead qualification
    await emailAdmin(
      'New Waitlist Signup',
      `New user signed up for launch notification:\n\nEmail: ${email}\nZIP Code: ${zipCode || 'Not provided'}\nSource: Coming Soon Page\nTime: ${new Date().toISOString()}`
    )

    return NextResponse.json({
      ok: true,
      message: 'Successfully added to waitlist'
    })

  } catch (error: any) {
    console.error('[Waitlist API] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to save email' },
      { status: 500 }
    )
  }
}
