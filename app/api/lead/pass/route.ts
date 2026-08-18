import { NextRequest, NextResponse } from 'next/server'
import { passLead } from '@/lib/passLead'

/**
 * One-click "pass" from a paying provider's lead notification email.
 *
 * GET rather than POST because it is a link in an email — same shape as the
 * claim link, which providers already use without logging in. All the
 * authorisation lives in passLead(): the caller must have been notified about
 * this lead, be on a paid tier, and still be inside their window. The URL
 * carries no secret, so it must not be able to do anything a stranger
 * shouldn't — and passing a lead you were offered only ever gives something
 * up, never takes it.
 *
 * Always renders HTML: whoever clicks this is a person in an email client, not
 * a script, and a JSON blob is a confusing thing to land on.
 */
export const dynamic = 'force-dynamic'

function page(title: string, body: string, accent: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | MobilePhlebotomy.org</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;padding:48px 20px;">
  <div style="border-left:4px solid ${accent};padding:18px 22px;background:#f9fafb;border-radius:0 8px 8px 0;">
    <h1 style="margin:0 0 8px 0;font-size:20px;">${title}</h1>
    <p style="margin:0;color:#4b5563;">${body}</p>
  </div>
  <p style="margin-top:28px;font-size:14px;color:#6b7280;">
    Questions? Just reply to any email from us and Hector will answer.
  </p>
  <p style="margin-top:24px;">
    <a href="https://www.mobilephlebotomy.org/dashboard" style="color:#667eea;font-weight:600;text-decoration:none;">Go to your dashboard &rarr;</a>
  </p>
</body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get('lead')
  const providerId = req.nextUrl.searchParams.get('provider')

  if (!leadId || !providerId) {
    return page('Something is missing from that link', 'We couldn\'t tell which request you meant. Open your dashboard and you can pass it from there.', '#dc2626')
  }

  const result = await passLead(leadId, providerId)

  if (result.ok) {
    return page(
      'Passed — thanks for the quick answer',
      `We\'ve released the ${result.leadCity}, ${result.leadState} request to other providers straight away, so the patient isn\'t left waiting. Nothing else is needed from you, and this won\'t count against your account.`,
      '#16a34a'
    )
  }

  switch (result.reason) {
    case 'already_claimed':
      return page('Already taken', 'Another provider claimed this request, so there was nothing left to pass. No action needed.', '#6b7280')
    case 'already_passed':
      return page('Already passed', 'You\'ve already passed on this one — it went out to other providers at the time. No action needed.', '#6b7280')
    case 'window_closed':
      return page('Already open to everyone', 'Your head-start window on this request had closed, so it was already visible to every provider in the area. Nothing to pass.', '#6b7280')
    case 'not_paying':
      return page('Nothing to pass', 'Passing applies to the Founding Partner head start. On a free listing every request reaches you at the same time as everyone else, so there\'s no window to give up.', '#6b7280')
    case 'not_notified':
      return page('We can\'t match that link to you', 'This request doesn\'t appear to have been sent to your listing. If you think that\'s wrong, reply to the email and Hector will look.', '#dc2626')
    default:
      return page('We couldn\'t find that request', 'The link may be out of date. Your dashboard will show anything currently available.', '#dc2626')
  }
}
