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

    // Delivery truth per notification, from SendGrid's events. `sentAt` is
    // when we handed the email to SendGrid; free-tier sends are held there for
    // the paid head start (and quiet hours) and dropped if the lead is claimed
    // first. Without this the panel showed every provider as SENT at the same
    // second, which read as "no head start" (2026-09-14). Last 30 days only;
    // older rows show the hand-off time as before.
    const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    const notifIds = leads.filter(l => l.createdAt.getTime() > recentCutoff).flatMap(l => l.leadNotifications.map(n => n.id))
    const delivery = new Map<string, { deliveredAt?: string; droppedAt?: string; dropReason?: string }>()
    if (notifIds.length > 0) {
      const events = await prisma.emailEvent.findMany({
        where: { leadNotificationId: { in: notifIds }, event: { in: ['delivered', 'dropped', 'bounce'] } },
        select: { leadNotificationId: true, event: true, timestamp: true, reason: true },
        orderBy: { timestamp: 'asc' },
      })
      for (const e of events) {
        if (!e.leadNotificationId) continue
        const d = delivery.get(e.leadNotificationId) || {}
        if (e.event === 'delivered' && !d.deliveredAt) d.deliveredAt = e.timestamp.toISOString()
        if (e.event !== 'delivered' && !d.droppedAt) { d.droppedAt = e.timestamp.toISOString(); d.dropReason = e.reason || e.event }
        delivery.set(e.leadNotificationId, d)
      }
    }

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
        // Provider tracking fields
        claimedAt: lead.claimedAt?.toISOString(),
        firstContactAt: lead.firstContactAt?.toISOString(),
        callAttempts: lead.callAttempts,
        outcome: lead.outcome,
        outcomeNotes: lead.outcomeNotes,
        appointmentDate: lead.appointmentDate?.toISOString(),
        completedAt: lead.completedAt?.toISOString(),
        providerNotes: lead.providerNotes,
        provider: lead.provider,
        // High-value + screening capture fields
        drawCount: lead.drawCount,
        requestType: lead.requestType,
        isHighValue: lead.isHighValue,
        estimatedValueCents: lead.estimatedValueCents,
        organizationName: lead.organizationName,
        timeframe: lead.timeframe,
        hasDoctorOrder: lead.hasDoctorOrder,
        paymentMethod: lead.paymentMethod,
        notifications: lead.leadNotifications.map(notif => ({
          id: notif.id,
          providerId: notif.providerId,
          providerName: notif.provider.name,
          status: notif.status,
          sentAt: notif.sentAt?.toISOString(),
          errorMessage: notif.errorMessage,
          deliveredAt: delivery.get(notif.id)?.deliveredAt || null,
          droppedAt: delivery.get(notif.id)?.droppedAt || null,
          dropReason: delivery.get(notif.id)?.dropReason || null,
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
