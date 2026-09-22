import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailAdmin } from '@/lib/adminEmail'

export const dynamic = 'force-dynamic'

/**
 * One-tap answer to the patient check-in (lib/softOutcomeNudge.ts).
 *
 * GET /api/checkin/[token]?a=in_touch|no_contact
 *
 * The token is a nanoid(32) minted at send time and stored on the lead; the
 * first answer wins. A "no" emails the admin with the lead and provider so it
 * can be moved by hand. Nothing here changes lead status: the decision to
 * hand a lead back stays with the provider or the admin until the patient
 * survey shows how often "text sent" really becomes a draw.
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

  emailAdmin(
    `Patient says NO CONTACT: ${lead.fullName} (${lead.city}, ${lead.state})`,
    `${lead.fullName} answered the day-2 check-in with "nobody has contacted me".\n\n` +
    `Lead ${lead.id}\nPatient: ${lead.fullName}, ${lead.phone}, ${lead.email || '-'}\nLocation: ${lead.city}, ${lead.state} ${lead.zip}\n` +
    `Claimed: ${lead.claimedAt?.toISOString() || '-'} by ${lead.provider?.name?.trim() || '-'} (${lead.provider?.phonePublic || lead.provider?.phone || '-'}, ${lead.provider?.email || '-'})\n` +
    `Provider's logged outcome: ${lead.outcome || '-'}; status ${lead.status}\n\n` +
    `Hand it back and re-offer: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mobilephlebotomy.org'}/admin/lead-diagnostic/${lead.id}\n`
  ).catch(err => console.error('[checkin] admin alert failed:', err?.message || err))

  return page('Got it, I\'m on it', 'Sorry you\'ve been waiting. I\'ll get your request to another phlebotomist and email you their name and number today.', '#b45309')
}
