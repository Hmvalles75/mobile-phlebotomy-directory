import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone is required'),
  serviceZipCodes: z.string().min(1, 'At least one ZIP code is required')
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Check if provider already exists with this email
    const existing = await prisma.provider.findFirst({
      where: {
        OR: [
          { email: data.email },
          { claimEmail: data.email }
        ]
      }
    })

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'A provider with this email already exists. Please search for your existing account.' },
        { status: 400 }
      )
    }

    // Generate slug from business name
    const baseSlug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Ensure unique slug
    let slug = baseSlug
    let counter = 1
    while (await prisma.provider.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create provider
    const provider = await prisma.provider.create({
      data: {
        name: data.businessName,
        slug,
        email: data.email,
        claimEmail: data.email,
        phone: data.phone,
        phonePublic: data.phone,
        zipCodes: data.serviceZipCodes,
        status: 'UNVERIFIED',
        listingTier: 'BASIC',
        eligibleForLeads: false  // Will be set to true after payment setup
      }
    })

    console.log(`Provider created: ${provider.id} - ${provider.name}`)

    return NextResponse.json({
      ok: true,
      providerId: provider.id,
      slug: provider.slug,
      message: 'Provider created successfully'
    })

  } catch (error: any) {
    console.error('Provider creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create provider' },
      { status: 500 }
    )
  }
}
