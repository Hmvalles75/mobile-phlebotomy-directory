import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const onboardingSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  serviceZipCodes: z.string().min(1, 'At least one ZIP code is required'),
  labsServiced: z.array(z.string()).min(1, 'Select at least one lab'),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms'
  })
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate input
    const validation = onboardingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Generate slug from business name
    const slug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check if provider already exists by email
    let provider = await prisma.provider.findFirst({
      where: { email: data.email }
    })

    if (provider) {
      // Update existing provider
      provider = await prisma.provider.update({
        where: { id: provider.id },
        data: {
          name: data.businessName,
          phone: data.phone,
          phonePublic: data.phone,
          zipCodes: data.serviceZipCodes
        }
      })
    } else {
      // Create new provider
      // Ensure unique slug
      let uniqueSlug = slug
      let counter = 1
      while (await prisma.provider.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      provider = await prisma.provider.create({
        data: {
          name: data.businessName,
          slug: uniqueSlug,
          email: data.email,
          claimEmail: data.email,
          phone: data.phone,
          phonePublic: data.phone,
          zipCodes: data.serviceZipCodes,
          status: 'UNVERIFIED',
          listingTier: 'BASIC'
        }
      })
    }

    // TODO: Send confirmation email to provider
    // TODO: Send notification to admin about new PPL enrollment

    return NextResponse.json({
      success: true,
      providerId: provider.id,
      message: 'Successfully enrolled in Pay-Per-Lead program',
      requiresPaymentSetup: true
    })

  } catch (error: any) {
    console.error('PPL Onboarding error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process application' },
      { status: 500 }
    )
  }
}
