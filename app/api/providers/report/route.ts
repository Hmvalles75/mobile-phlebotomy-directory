import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { emailAdmin } from '@/lib/adminEmail'

const schema = z.object({
  providerId: z.string().optional(),
  urlSlug: z.string(),
  note: z.string().min(10),
  contactEmail: z.string().email().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate with Zod
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const payload = parsed.data

    // Create correction report
    const rec = await prisma.providerCorrections.create({
      data: {
        providerId: payload.providerId || null,
        urlSlug: payload.urlSlug,
        note: payload.note,
        contactEmail: payload.contactEmail || null,
        status: 'OPEN'
      }
    })

    // Notify admin
    await emailAdmin(
      'Listing Correction',
      `Slug: ${payload.urlSlug}\nNote: ${payload.note}\nEmail: ${payload.contactEmail || '—'}`
    )

    return NextResponse.json({
      ok: true,
      id: rec.id,
      message: 'Report submitted successfully. Thank you for helping us improve our directory.'
    })

  } catch (error: any) {
    console.error('Error submitting provider correction:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to submit report' },
      { status: 500 }
    )
  }
}
