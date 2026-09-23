import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handBackLead } from '@/lib/handBackLead'
import { emailAdmin } from '@/lib/adminEmail'

/**
 * One-tap outcome from the pre-SLA reminder email (lib/claimReminder.ts).
 *
 * GET ?lead=&provider=&do=working|booked|unreachable. Same shape as the pass link: a
 * person in an email client, no login. The URL carries no secret, so it can
 * only do what the claiming provider could already do from their dashboard,
 * and only on a lead they currently hold (routedToId must match). Logging
 * WORKING_IT, APPOINTMENT_BOOKED or UNABLE_TO_REACH is what stops the
 * stale-claim release. 'unreachable' exists because a provider who dialled a
 * fake number and got a bounced email had no way to say so from the reminder
 * and let the lead release (Magnus Precision, 2026-09-11); it keeps the claim,
 * records the attempt, and alerts the admin so a junk lead can be closed.
 */
export const dynamic = 'force-dynamic'

async function alertAdminUnreachable(lead: { id: string; fullName: string; city: string; state: string }, providerId: string) {
  const p = await prisma.provider.findUnique({ where: { id: providerId }, select: { name: true } })
  const full = await prisma.lead.findUnique({ where: { id: lead.id }, select: { phone: true, email: true, createdAt: true, callAttempts: true } })
  await emailAdmin(
    `Provider couldn't reach ${lead.fullName} (${lead.city}, ${lead.state})`,
    `${p?.name || providerId} tapped "Couldn't reach the patient" on the pre-release reminder.\n\n` +
    `Lead ${lead.id}\nName: ${lead.fullName}\nPhone: ${full?.phone || '-'}\nEmail: ${full?.email || '-'}\nSubmitted: ${full?.createdAt?.toISOString() || '-'}\nAttempts logged: ${full?.callAttempts ?? '-'}\n\n` +
    `The claim is kept and will not auto-release. If the contact details are fake, close the lead; if they look real, nothing to do.\n` +
    `https://www.mobilephlebotomy.org/admin`
  )
}

function page(title: string, body: string, accent: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | MobilePhlebotomy.org</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;padding:48px 20px;">
  <div style="border-left:4px solid ${accent};padding:18px 22px;background:#f9fafb;border-radius:0 8px 8px 0;">
    <h1 style="margin:0 0 8px 0;font-size:20px;">${title}</h1>
    <p style="margin:0;color:#4b5563;">${body}</p>
  </div>
  <p style="margin-top:24px;"><a href="https://www.mobilephlebotomy.org/dashboard" style="color:#667eea;font-weight:600;text-decoration:none;">Go to your dashboard &rarr;</a></p>
</body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get('lead')
  const providerId = req.nextUrl.searchParams.get('provider')
  const action = req.nextUrl.searchParams.get('do')
  if (!leadId || !providerId || (action !== 'working' && action !== 'booked' && action !== 'handback' && action !== 'unreachable')) {
    return page('Something is missing from that link', 'Open your dashboard and you can update the request from there.', '#dc2626')
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, city: true, state: true, fullName: true, status: true, routedToId: true, outcome: true },
  })
  if (!lead) return page('We couldn\'t find that request', 'The link may be out of date. Your dashboard shows everything you currently hold.', '#dc2626')
  if (lead.routedToId !== providerId) {
    return page('This request isn\'t on your account', lead.status === 'CLAIMED' ? 'Another provider currently holds it.' : 'It was released or closed. Your dashboard shows what is currently available.', '#6b7280')
  }
  if (lead.status !== 'CLAIMED') {
    return page('Already closed', `This request is ${lead.status.toLowerCase().replace(/_/g, ' ')}. Nothing to update.`, '#6b7280')
  }

  if (action === 'handback') {
    // From the soft-outcome nudge (lib/softOutcomeNudge.ts): the provider has
    // stopped working this one. Release and re-offer at once, same path as the
    // "Can't serve this area" button. No mark against the provider.
    const ok = await handBackLead({ leadId, providerId, reason: 'provider_handback', note: 'Handed back by the provider from the day-2 nudge' })
    if (!ok) return page('Already moved on', 'This request is no longer on your account. Nothing to do.', '#6b7280')
    console.log(`[quick-outcome] ${providerId} handed back ${leadId} via email link`)
    return page('Handed back, thank you', `${lead.fullName} in ${lead.city}, ${lead.state} has been released and offered to other providers. You no longer have access to their details.`, '#b45309')
  }

  if (action === 'booked') {
    await prisma.lead.update({ where: { id: leadId }, data: { outcome: 'APPOINTMENT_BOOKED', outcomeUpdatedAt: new Date(), firstContactAt: new Date() } })
    console.log(`[quick-outcome] ${providerId} marked ${leadId} APPOINTMENT_BOOKED via email link`)
    return page('Marked as booked', `${lead.fullName} in ${lead.city}, ${lead.state} stays with you. When the draw is done, mark it completed from your dashboard.`, '#16a34a')
  }

  if (action === 'unreachable') {
    if (lead.outcome && lead.outcome !== 'WORKING_IT' && lead.outcome !== 'UNABLE_TO_REACH') {
      return page('Already logged', `This request already has an outcome recorded (${lead.outcome.toLowerCase().replace(/_/g, ' ')}), so it will not be released. Nothing else needed.`, '#16a34a')
    }
    await prisma.lead.update({ where: { id: leadId }, data: { outcome: 'UNABLE_TO_REACH', callAttempts: { increment: 1 } } })
    console.log(`[quick-outcome] ${providerId} marked ${leadId} UNABLE_TO_REACH via email link`)
    alertAdminUnreachable(lead, providerId).catch(err => console.error('[quick-outcome] admin alert failed:', err?.message || err))
    return page('Logged: couldn\'t reach the patient', `${lead.fullName} in ${lead.city}, ${lead.state} stays with you and will not be released. Hector has been told so the contact details can be checked. If they turn out to be fake, the request will be closed; if the patient calls back, log the outcome from your dashboard.`, '#b45309')
  }

  // working: never overwrite a real outcome that is already there
  if (lead.outcome && lead.outcome !== 'WORKING_IT') {
    return page('Already logged', `This request already has an outcome recorded (${lead.outcome.toLowerCase().replace(/_/g, ' ')}), so it will not be released. Nothing else needed.`, '#16a34a')
  }
  await prisma.lead.update({ where: { id: leadId }, data: { outcome: 'WORKING_IT' } })
  console.log(`[quick-outcome] ${providerId} marked ${leadId} WORKING_IT via email link`)
  return page('Got it, it stays yours', `${lead.fullName} in ${lead.city}, ${lead.state} is locked to you. Log the real outcome from your dashboard when you have one.`, '#2563eb')
}
