import { NextRequest, NextResponse } from 'next/server'

/**
 * Event Tracking API
 *
 * POST /api/events
 *
 * Generic event tracking endpoint for client-side events.
 * Currently logs to console; can be extended to store in DB or send to analytics.
 *
 * Supported events:
 * - provider_phone_revealed: User clicked to reveal a provider's phone number
 * - (future): other trackable user actions
 */

interface EventPayload {
  event_name: string
  providerId?: string
  providerName?: string
  market?: string
  path?: string
  [key: string]: unknown
}

export async function POST(req: NextRequest) {
  try {
    const body: EventPayload = await req.json()

    const { event_name, providerId, providerName, market, path, ...extra } = body

    if (!event_name) {
      return NextResponse.json(
        { ok: false, error: 'event_name is required' },
        { status: 400 }
      )
    }

    // Extract metadata
    const timestamp = new Date().toISOString()
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') ||
               'unknown'

    // Log the event (structured for easy parsing)
    console.log(JSON.stringify({
      type: 'EVENT',
      event_name,
      providerId,
      providerName,
      market,
      path,
      timestamp,
      userAgent,
      ip,
      ...extra
    }))

    // Future: Store in database if Event model exists
    // await prisma.event.create({ data: { ... } })

    // Future: Forward to external analytics (GA4, Mixpanel, etc.)
    // await sendToAnalytics({ ... })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Event tracking error:', error)

    // Always return 200 to not break client flows
    return NextResponse.json({ ok: true })
  }
}

// Also accept GET for simple beacon-style tracking
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const event_name = searchParams.get('event_name')

  if (!event_name) {
    return NextResponse.json({ ok: false, error: 'event_name required' }, { status: 400 })
  }

  const timestamp = new Date().toISOString()
  const userAgent = req.headers.get('user-agent') || 'unknown'

  console.log(JSON.stringify({
    type: 'EVENT',
    event_name,
    providerId: searchParams.get('providerId'),
    market: searchParams.get('market'),
    path: searchParams.get('path'),
    timestamp,
    userAgent
  }))

  return NextResponse.json({ ok: true })
}
