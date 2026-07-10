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
