import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch provider profile for editing
export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const provider = await prisma.provider.findUnique({
      where: { id: session.providerId },
      select: {
        name: true,
        phone: true,
        email: true,
        notificationEmail: true,
        website: true,
        description: true,
        zipCodes: true,
        serviceZipCodes: true,
        services: {
          select: {
            service: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    const allServices = await prisma.service.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      ok: true,
      profile: {
        businessName: provider.name,
        phone: provider.phone || '',
        email: provider.email || '',
        notificationEmail: provider.notificationEmail || '',
        website: provider.website || '',
        description: provider.description || '',
        zipCodes: provider.zipCodes || provider.serviceZipCodes || '',
      },
      services: provider.services.map(s => s.service),
      allServices
    })

  } catch (error: any) {
    console.error('[Profile GET] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// POST - Update provider profile
export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { businessName, phone, notificationEmail, website, description, zipCodes, serviceIds } = body

    // Validate required fields
    if (!businessName || businessName.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Business name is required' },
        { status: 400 }
      )
    }

    if (businessName.length > 200) {
      return NextResponse.json(
        { ok: false, error: 'Business name must be under 200 characters' },
        { status: 400 }
      )
    }

    // Validate email if provided
    if (notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Validate description length
    if (description && description.length > 2000) {
      return NextResponse.json(
        { ok: false, error: 'Description must be under 2000 characters' },
        { status: 400 }
      )
    }

    // Update provider profile
    await prisma.provider.update({
      where: { id: session.providerId },
      data: {
        name: businessName.trim(),
        phone: phone?.trim() || null,
        notificationEmail: notificationEmail?.trim() || null,
        website: website?.trim() || null,
        description: description?.trim() || null,
        zipCodes: zipCodes?.trim() || null,
      }
    })

    // Update services if provided
    if (Array.isArray(serviceIds)) {
      await prisma.providerService.deleteMany({
        where: { providerId: session.providerId }
      })

      if (serviceIds.length > 0) {
        await prisma.providerService.createMany({
          data: serviceIds.map((serviceId: string) => ({
            providerId: session.providerId,
            serviceId
          }))
        })
      }
    }

    console.log(`[Profile] Provider ${session.providerId} updated their profile`)

    return NextResponse.json({
      ok: true,
      message: 'Profile updated successfully'
    })

  } catch (error: any) {
    console.error('[Profile POST] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
