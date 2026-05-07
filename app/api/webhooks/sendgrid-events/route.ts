import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SendGrid Event Webhook receiver.
 *
 * Configure in SG dashboard:
 *   Mail Settings → Event Webhook
 *   POST URL: https://mobilephlebotomy.org/api/webhooks/sendgrid-events
 *   Events: enable Delivered, Open, Click, Bounce, Dropped, Deferred,
 *           Spam Report, Unsubscribe, Group Unsubscribe (optional), Processed
 *   Signature Verification: ENABLE — copy the public key into env
 *           SENDGRID_WEBHOOK_PUBLIC_KEY
 *
 * SG sends an array of event objects (one HTTP POST per batch). We persist
 * each event keyed on `sg_event_id` (unique per event), correlating back to
 * our LeadNotification rows via customArgs we attached at send time:
 *   - leadNotificationId
 *   - leadId
 *   - providerId
 */

interface SendGridEvent {
  email: string
  timestamp: number               // unix seconds
  event: string                   // delivered, open, click, bounce, dropped, deferred, spamreport, unsubscribe, processed
  sg_event_id: string             // unique per event
  sg_message_id?: string          // unique per outbound message (multiple events share this)
  url?: string                    // click events
  reason?: string                 // bounce / dropped / spamreport
  ip?: string
  useragent?: string
  // customArgs we attach at send time
  leadNotificationId?: string
  leadId?: string
  providerId?: string
  kind?: string
  // Anything else SG sends — we keep the full payload in `raw` for debugging
  [k: string]: any
}

/**
 * Verify the SG webhook signature using ECDSA over the (timestamp + body) string.
 * Returns true if signature is valid OR if no public key is configured (dev mode).
 * In production, SENDGRID_WEBHOOK_PUBLIC_KEY MUST be set.
 *
 * Reference: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
 */
function verifySignature(rawBody: string, signature: string | null, timestamp: string | null): boolean {
  const publicKeyB64 = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY
  if (!publicKeyB64) {
    // Dev mode — accept everything but log loudly so misconfig is visible.
    console.warn('[sendgrid-events] SENDGRID_WEBHOOK_PUBLIC_KEY not set — accepting unverified payload')
    return true
  }
  if (!signature || !timestamp) {
    console.error('[sendgrid-events] Missing signature or timestamp header')
    return false
  }
  try {
    // SG uses an ECDSA P-256 key delivered as a PEM-wrapped base64 SPKI
    const pem = `-----BEGIN PUBLIC KEY-----\n${publicKeyB64}\n-----END PUBLIC KEY-----`
    const verify = crypto.createVerify('SHA256')
    verify.update(timestamp + rawBody)
    verify.end()
    return verify.verify(pem, signature, 'base64')
  } catch (err) {
    console.error('[sendgrid-events] Signature verification threw:', err)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-twilio-email-event-webhook-signature')
    const timestamp = req.headers.get('x-twilio-email-event-webhook-timestamp')

    if (!verifySignature(rawBody, signature, timestamp)) {
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
    }

    const events: SendGridEvent[] = JSON.parse(rawBody)
    if (!Array.isArray(events)) {
      return NextResponse.json({ ok: false, error: 'Expected array of events' }, { status: 400 })
    }

    let stored = 0
    let skipped = 0
    for (const e of events) {
      if (!e.sg_event_id) {
        skipped++
        continue
      }
      try {
        await prisma.emailEvent.upsert({
          where: { sgEventId: e.sg_event_id },
          create: {
            sgEventId: e.sg_event_id,
            sgMessageId: e.sg_message_id || null,
            event: e.event,
            email: e.email,
            timestamp: new Date(e.timestamp * 1000),
            url: e.url || null,
            reason: e.reason || null,
            ip: e.ip || null,
            userAgent: e.useragent || null,
            leadNotificationId: e.leadNotificationId || null,
            leadId: e.leadId || null,
            providerId: e.providerId || null,
            raw: JSON.stringify(e),
          },
          update: {}, // idempotent — never overwrite an event that already arrived
        })
        stored++
      } catch (err: any) {
        console.error(`[sendgrid-events] Failed to upsert event ${e.sg_event_id}:`, err.message || err)
      }
    }

    if (stored > 0) {
      console.log(`[sendgrid-events] Stored ${stored} event(s), skipped ${skipped}`)
    }

    return NextResponse.json({ ok: true, stored, skipped })
  } catch (err: any) {
    console.error('[sendgrid-events] Handler error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal error' }, { status: 500 })
  }
}

// SG sometimes sends a HEAD/GET to verify the URL is alive
export async function GET() {
  return NextResponse.json({ ok: true, message: 'SendGrid event webhook receiver' })
}
