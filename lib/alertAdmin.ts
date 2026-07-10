import twilio from 'twilio'

// Out-of-band admin alerting.
//
// This deliberately uses Twilio SMS, NEVER SendGrid. The 2026-06 outage was an
// unpaid-invoice SendGrid suspension: it silently dropped ~15 lead emails AND
// killed every alert path at the same instant, because all alerting ran through
// SendGrid (adminEmail, stat-escalation, provider-audit). An alert channel that
// shares a dependency with the thing it monitors is useless. Keep this SendGrid-
// free forever.
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

/**
 * Send an urgent operational alert to the admin via SMS (out-of-band from
 * SendGrid). Fire-and-forget: never throws — a failed alert must not break the
 * caller. Returns true only if a message was actually dispatched.
 *
 * Requires:
 *   - ADMIN_ALERT_PHONE  — admin's mobile in E.164 (e.g. +13105551234)
 *   - TWILIO_MESSAGING_SERVICE_SID (preferred) or TWILIO_PHONE_NUMBER
 */
export async function alertAdminSMS(message: string): Promise<boolean> {
  const to = process.env.ADMIN_ALERT_PHONE

  if (!twilioClient) {
    console.error('[alertAdmin] Twilio not configured — cannot send out-of-band alert:', message)
    return false
  }
  if (!to) {
    console.error('[alertAdmin] ADMIN_ALERT_PHONE not set — cannot send out-of-band alert:', message)
    return false
  }

  try {
    const params: Record<string, string> = { to, body: message.slice(0, 1500) }
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      params.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      params.from = process.env.TWILIO_PHONE_NUMBER
    } else {
      console.error('[alertAdmin] No Twilio sender (messaging service SID / phone number) configured')
      return false
    }

    const res = await twilioClient.messages.create(params as any)
    console.log(`[alertAdmin] Alert SMS dispatched to admin [sid=${res.sid}]: ${message.slice(0, 80)}`)
    return true
  } catch (err: any) {
    console.error('[alertAdmin] Failed to send alert SMS:', err?.message || err)
    return false
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Place an automated voice CALL to the admin that speaks `message` (twice).
 *
 * This is the primary out-of-band alert channel. Unlike SMS, voice is NOT
 * subject to A2P 10DLC registration, so it delivers even while the Twilio
 * number's messaging is carrier-blocked (error 30034) — which is exactly the
 * state SMS is in right now. Depends on neither SendGrid nor A2P SMS.
 *
 * Fire-and-forget: never throws. Returns true only if a call was placed.
 *
 * Requires:
 *   - ADMIN_ALERT_PHONE   — admin's mobile, E.164 (e.g. +13105551234)
 *   - TWILIO_PHONE_NUMBER — a voice-capable Twilio number to call FROM
 */
export async function alertAdminCall(message: string): Promise<boolean> {
  const to = process.env.ADMIN_ALERT_PHONE
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!twilioClient) {
    console.error('[alertAdmin] Twilio not configured — cannot place out-of-band alert call:', message)
    return false
  }
  if (!to) {
    console.error('[alertAdmin] ADMIN_ALERT_PHONE not set — cannot place alert call:', message)
    return false
  }
  if (!from) {
    console.error('[alertAdmin] TWILIO_PHONE_NUMBER not set — cannot place alert call:', message)
    return false
  }

  try {
    const spoken = escapeXml(message)
    const twiml =
      `<Response><Say voice="alice">${spoken}</Say>` +
      `<Pause length="1"/><Say voice="alice">Repeating. ${spoken}</Say></Response>`
    const call = await twilioClient.calls.create({ to, from, twiml })
    console.log(`[alertAdmin] Alert CALL placed to admin [sid=${call.sid}]: ${message.slice(0, 80)}`)
    return true
  } catch (err: any) {
    console.error('[alertAdmin] Failed to place alert call:', err?.message || err)
    return false
  }
}
