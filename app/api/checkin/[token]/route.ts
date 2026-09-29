import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailAdmin } from '@/lib/adminEmail'
import { patientReroute } from '@/lib/patientReroute'

export const dynamic = 'force-dynamic'

/**
 * One-tap answer to the patient check-in (lib/softOutcomeNudge.ts).
 *
 * GET /api/checkin/[token]?a=in_touch|no_contact
 *
 * The token is a nanoid(32) minted at send time and stored on the lead; the
 * first answer wins. A "no" releases the claim and re-offers the request at
 * once (lib/patientReroute.ts, 2026-09-29; before that it only emailed the
 * admin). If the reroute is not possible (booked, already moved, at the cap)
 * the admin is emailed as before.
 */
function page(title: string, body: string, accent: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | MobilePhlebotomy.org</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;padding:48px 20px;">
  <div style="border-left:4px solid ${accent};padding:18px 22px;background:#f9fafb;border-radius:0 8px 8px 0;">
    <h1 style="margin:0 0 8px 0;font-size:20px;">${title}</h1>
    <p style="margin:0;color:#4b5563;">${body}</p>
  </div>
  <p style="margin-top:24px;color:#6b7280;font-size:14px;">Hector Valles &middot; MobilePhlebotomy.org</p>
</body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const answer = req.nextUrl.searchParams.get('a')
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(params.token) || (answer !== 'in_touch' && answer !== 'no_contact')) {
    return page('That link isn\'t right', 'It may be incomplete. Reply to the email instead and I\'ll take it from there.', '#dc2626')
  }
  const lead = await prisma.lead.findFirst({
    where: { patientCheckinToken: params.token },
    select: { id: true, fullName: true, phone: true, email: true, city: true, state: true, zip: true, status: true, outcome: true, patientCheckinAnswer: true, claimedAt: true, provider: { select: { name: true, phonePublic: true, phone: true, email: true } } },
  })
  if (!lead) return page('That link isn\'t right', 'It may be out of date. Reply to the email instead and I\'ll take it from there.', '#dc2626')

  if (lead.patientCheckinAnswer) {
    return page('Already answered', lead.patientCheckinAnswer === 'no_contact' ? 'I have your earlier answer and I\'m on it.' : 'Thanks, nothing more needed.', '#6b7280')
  }
  await prisma.lead.update({ where: { id: lead.id }, data: { patientCheckinAnswer: answer, patientCheckinAnsweredAt: new Date() } })

  if (answer === 'in_touch') {
    return page('Thanks, that\'s all I needed', `Glad ${lead.provider?.name?.trim() || 'the phlebotomist'} reached you. If anything changes, reply to the email and I'll help.`, '#16a34a')
  }

  const rerouted = await patientReroute({ leadId: lead.id, source: 'checkin' }).catch(err => { console.error('[checkin] reroute failed:', err?.message || err); return { ok: false as const, code: 'race' as const } })
  if (rerouted.ok) {
    return page('Got it, your request has been sent to other phlebotomists', `Sorry you've been waiting. ${lead.provider?.name?.trim() || 'The provider'} has been told, and the first phlebotomist to accept will contact you. You'll get an email with their name and number.`, '#b45309')
  }
  emailAdmin(
    `Patient says NO CONTACT: ${lead.fullName} (${lead.city}, ${lead.state})`,
    `${lead.fullName} answered the day-2 check-in with "nobody has contacted me".\n\n` +
    `Lead ${lead.id}\nPatient: ${lead.fullName}, ${lead.phone}, ${lead.email || '-'}\nLocation: ${lead.city}, ${lead.state} ${lead.zip}\n` +
    `Claimed: ${lead.claimedAt?.toISOString() || '-'} by ${lead.provider?.name?.trim() || '-'} (${lead.provider?.phonePublic || lead.provider?.phone || '-'}, ${lead.provider?.email || '-'})\n` +
    `Provider's logged outcome: ${lead.outcome || '-'}; status ${lead.status}\nAutomatic reroute not possible: ${rerouted.code}\n\n` +
    `Hand it back and re-offer: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mobilephlebotomy.org'}/admin/lead-diagnostic/${lead.id}\n`
  ).catch(err => console.error('[checkin] admin alert failed:', err?.message || err))

  return page('Got it, I\'m on it', 'Sorry you\'ve been waiting. I\'ll get your request to another phlebotomist and email you their name and number today.', '#b45309')
}
