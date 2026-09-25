import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOutreachToken } from '@/lib/outreachToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One-click opt-out from provider outreach (scripts/outreach-send.ts).
 * GET /api/outreach/unsubscribe?p=<providerId>&t=<token>
 * Sets Provider.outreachOptOutAt; the sender skips opted-out providers on
 * every run. Lead notifications are a separate channel and are not touched.
 */
function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;max-width:560px;margin:60px auto;padding:0 20px;color:#1f2937;line-height:1.6"><h1 style="font-size:22px">${title}</h1><p>${body}</p><p style="color:#6b7280;font-size:14px">MobilePhlebotomy.org</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get('p') || ''
  const t = req.nextUrl.searchParams.get('t') || ''
  if (!/^c[a-z0-9]{20,30}$/.test(p) || !verifyOutreachToken(p, t)) {
    return page('That link is not valid', 'The unsubscribe link is incomplete or has been altered. Reply to the email instead and I will take you off the list by hand.', 400)
  }
  const r = await prisma.provider.updateMany({ where: { id: p, outreachOptOutAt: null }, data: { outreachOptOutAt: new Date() } })
  console.log(`[outreach/unsubscribe] provider ${p} opted out (${r.count ? 'set' : 'already set'})`)
  return page("You're unsubscribed", "You won't get any more emails about the paid listing from me. Lead notifications for requests in your area are unaffected; you can turn those off in your dashboard.")
}
