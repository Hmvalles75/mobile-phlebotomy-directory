import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie')
    const isAuthenticated = verifyAdminSessionFromCookies(authHeader || cookieHeader)

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all leads with provider relationship and notifications
    const leads = await prisma.lead.findMany({
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            claimEmail: true
          }
        },
        leadNotifications: {
          include: {
            provider: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            sentAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      leads: leads.map(lead => ({
        id: lead.id,
        createdAt: lead.createdAt.toISOString(),
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        address1: lead.address1,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        urgency: lead.urgency,
        notes: lead.notes,
        status: lead.status,
        routedToId: lead.routedToId,
        routedAt: lead.routedAt?.toISOString(),
        priceCents: lead.priceCents,
        provider: lead.provider,
        notifications: lead.leadNotifications.map(notif => ({
          id: notif.id,
          providerId: notif.providerId,
          providerName: notif.provider.name,
          status: notif.status,
          sentAt: notif.sentAt?.toISOString(),
          errorMessage: notif.errorMessage
        }))
      }))
    })

  } catch (error: any) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}
