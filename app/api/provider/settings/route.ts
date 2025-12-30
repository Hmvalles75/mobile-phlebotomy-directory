import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch provider settings
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
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
        operatingDays: true,
        operatingHoursStart: true,
        operatingHoursEnd: true,
        serviceRadiusMiles: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      settings: {
        operatingDays: provider.operatingDays || '',
        operatingHoursStart: provider.operatingHoursStart || '08:00',
        operatingHoursEnd: provider.operatingHoursEnd || '17:00',
        serviceRadiusMiles: provider.serviceRadiusMiles || 25
      }
    })

  } catch (error: any) {
    console.error('[Settings GET] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST - Update provider settings
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { operatingDays, operatingHoursStart, operatingHoursEnd, serviceRadiusMiles } = body

    // Validate inputs
    if (!operatingDays || !operatingHoursStart || !operatingHoursEnd) {
      return NextResponse.json(
        { ok: false, error: 'Operating days and hours are required' },
        { status: 400 }
      )
    }

    if (!serviceRadiusMiles || serviceRadiusMiles < 1 || serviceRadiusMiles > 200) {
      return NextResponse.json(
        { ok: false, error: 'Service radius must be between 1 and 200 miles' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(operatingHoursStart) || !timeRegex.test(operatingHoursEnd)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid time format. Use HH:MM (e.g., 08:00)' },
        { status: 400 }
      )
    }

    // Validate operating days format (comma-separated)
    const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    const days = operatingDays.split(',').map((d: string) => d.trim())
    const invalidDays = days.filter((d: string) => !validDays.includes(d))

    if (invalidDays.length > 0) {
      return NextResponse.json(
        { ok: false, error: `Invalid days: ${invalidDays.join(', ')}` },
        { status: 400 }
      )
    }

    // Update provider settings
    const updatedProvider = await prisma.provider.update({
      where: { id: session.providerId },
      data: {
        operatingDays,
        operatingHoursStart,
        operatingHoursEnd,
        serviceRadiusMiles: parseInt(serviceRadiusMiles)
      },
      select: {
        operatingDays: true,
        operatingHoursStart: true,
        operatingHoursEnd: true,
        serviceRadiusMiles: true
      }
    })

    console.log(`✅ Provider ${session.providerId} updated availability settings`)
    console.log(`   Days: ${operatingDays}`)
    console.log(`   Hours: ${operatingHoursStart} - ${operatingHoursEnd}`)
    console.log(`   Radius: ${serviceRadiusMiles} miles`)

    return NextResponse.json({
      ok: true,
      message: 'Settings updated successfully',
      settings: updatedProvider
    })

  } catch (error: any) {
    console.error('[Settings POST] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
