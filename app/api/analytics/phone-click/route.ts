import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Log a provider click-to-call click event.
 *
 * Designed to be called with navigator.sendBeacon() from the client immediately
 * before a tel: navigation fires. The response is short-circuited so it returns
 * fast and doesn't block the user's phone call.
 *
 * POST body: { providerId: string, source: string, pagePath?: string }
 */
export async function POST(req: NextRequest) {
  try {
    let body: { providerId?: string; source?: string; pagePath?: string } = {}
    try {
      body = await req.json()
    } catch {
      // sendBeacon may encode the body as a Blob — try text parsing as fallback
      const raw = await req.text()
      if (raw) {
        try { body = JSON.parse(raw) } catch { /* ignore malformed */ }
      }
    }

    const { providerId, source, pagePath } = body

    if (!providerId || !source) {
      return NextResponse.json({ ok: false, error: 'providerId and source are required' }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') || null
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      null

    // Fire and forget — we don't await the DB write on the response path for speed,
    // but we do catch and log errors so silent failures are visible in logs.
    prisma.phoneClickEvent.create({
      data: {
        providerId,
        source: source.slice(0, 64),
        pagePath: pagePath?.slice(0, 500) || null,
        userAgent: userAgent?.slice(0, 500) || null,
        ipAddress,
      },
    }).catch((err) => {
      console.error('[phone-click] DB write failed:', err.message || err)
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[phone-click] route error:', err.message || err)
    return NextResponse.json({ ok: false, error: 'tracking failed' }, { status: 500 })
  }
}
