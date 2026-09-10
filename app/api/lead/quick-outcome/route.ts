import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * One-tap outcome from the pre-SLA reminder email (lib/claimReminder.ts).
 *
 * GET ?lead=&provider=&do=working|booked. Same shape as the pass link: a
 * person in an email client, no login. The URL carries no secret, so it can
 * only do what the claiming provider could already do from their dashboard,
 * and only on a lead they currently hold (routedToId must match). Logging
 * WORKING_IT or APPOINTMENT_BOOKED is what stops the stale-claim release.
 */
export const dynamic = 'force-dynamic'

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
  if (!leadId || !providerId || (action !== 'working' && action !== 'booked')) {
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

  if (action === 'booked') {
    await prisma.lead.update({ where: { id: leadId }, data: { outcome: 'APPOINTMENT_BOOKED', firstContactAt: new Date() } })
    console.log(`[quick-outcome] ${providerId} marked ${leadId} APPOINTMENT_BOOKED via email link`)
    return page('Marked as booked', `${lead.fullName} in ${lead.city}, ${lead.state} stays with you. When the draw is done, mark it completed from your dashboard.`, '#16a34a')
  }

  // working: never overwrite a real outcome that is already there
  if (lead.outcome && lead.outcome !== 'WORKING_IT') {
    return page('Already logged', `This request already has an outcome recorded (${lead.outcome.toLowerCase().replace(/_/g, ' ')}), so it will not be released. Nothing else needed.`, '#16a34a')
  }
  await prisma.lead.update({ where: { id: leadId }, data: { outcome: 'WORKING_IT' } })
  console.log(`[quick-outcome] ${providerId} marked ${leadId} WORKING_IT via email link`)
  return page('Got it, it stays yours', `${lead.fullName} in ${lead.city}, ${lead.state} is locked to you. Log the real outcome from your dashboard when you have one.`, '#2563eb')
}
