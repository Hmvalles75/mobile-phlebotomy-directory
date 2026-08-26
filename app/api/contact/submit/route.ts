import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sg from '@sendgrid/mail'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/seo'

/**
 * Public /contact form intake.
 *
 * Before this route existed, the form's submit handler was a `console.log`.
 * Every message sent through it from 2025-08-17 onward was discarded, while the
 * page sat in the footer of every page and in the sitemap.
 *
 * Two rules here, both learned from failures in this codebase:
 *
 *  1. PERSIST BEFORE NOTIFYING. Every inbound loss found so far has been an
 *     email that quietly didn't send. A message that exists only inside a send
 *     attempt is a message you lose when the send fails.
 *  2. RECORD THE NOTIFICATION RESULT. `notifiedAt` and `notifyError` make
 *     "nobody was told" a query rather than a guess. The institutional intake
 *     route fires its alerts with `.catch(console.error)` and returns success
 *     regardless, which is why a silent failure there went unnoticed for months.
 *
 * SendGrid, not Resend: RESEND_API_KEY has never been configured in this
 * project, so every code path still calling Resend is a no-op.
 */

const schema = z.object({
  userType: z.enum(['patient', 'provider', 'business', 'media', 'other']),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(300),
  message: z.string().trim().min(1).max(10000),
  // Honeypot — humans never see it.
  website_url: z.string().optional(),
})

const RATE_LIMIT_PER_HOUR = 5
const ADMIN_TO = process.env.ADMIN_EMAIL || 'hector@mobilephlebotomy.org'

const USER_TYPE_LABEL: Record<string, string> = {
  patient: 'Patient looking for services',
  provider: 'Healthcare provider',
  business: 'Business / corporate client',
  media: 'Media / press inquiry',
  other: 'Other',
}

/** Returns null on success, or the error string to store in notifyError. */
async function notifyAdmin(row: {
  id: string; userType: string; name: string; email: string
  subject: string; message: string; createdAt: Date
}): Promise<string | null> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return 'SENDGRID_API_KEY not configured'

  try {
    sg.setApiKey(key)
    await sg.send({
      to: ADMIN_TO,
      // Hard-coded verified sender — the only confirmed-verified SendGrid sender.
      from: { email: 'hector@mobilephlebotomy.org', name: 'MobilePhlebotomy.org' },
      replyTo: { email: row.email, name: row.name },
      subject: `[Contact] ${row.subject}`,
      text: [
        `New message from the /contact form.`,
        ``,
        `From:    ${row.name} <${row.email}>`,
        `They are: ${USER_TYPE_LABEL[row.userType] || row.userType}`,
        `Subject: ${row.subject}`,
        `Sent:    ${row.createdAt.toISOString()}`,
        ``,
        `---`,
        row.message,
        `---`,
        ``,
        `Reply directly to this email to answer them.`,
        `Record id: ${row.id}`,
        `${SITE_URL}/admin`,
      ].join('\n'),
    })
    return null
  } catch (error: any) {
    const detail =
      error?.response?.body?.errors?.[0]?.message || error?.message || String(error)
    console.error('[contact] admin notification failed:', detail)
    return String(detail).slice(0, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'VALIDATION', message: 'Please check the form and try again.' },
        { status: 400 }
      )
    }
    const data = parsed.data

    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
    const userAgent = req.headers.get('user-agent') || null

    // Honeypot: recorded as SPAM rather than silently dropped, so "no record"
    // never has to mean two different things again. The submitter sees success.
    if (data.website_url && data.website_url.trim().length > 0) {
      await prisma.contactMessage.create({
        data: {
          userType: data.userType, name: data.name, email: data.email,
          subject: data.subject, message: data.message,
          status: 'SPAM', ipAddress, userAgent,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (ipAddress) {
      const recent = await prisma.contactMessage.count({
        where: { ipAddress, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      })
      if (recent >= RATE_LIMIT_PER_HOUR) {
        return NextResponse.json(
          {
            ok: false,
            error: 'RATE_LIMITED',
            message: `You've sent several messages recently. Please email ${ADMIN_TO} directly.`,
          },
          { status: 429 }
        )
      }
    }

    // Persist first. If everything after this fails, the message still exists.
    const row = await prisma.contactMessage.create({
      data: {
        userType: data.userType, name: data.name, email: data.email,
        subject: data.subject, message: data.message, ipAddress, userAgent,
      },
    })

    // Awaited, not fire-and-forget: the outcome is recorded on the row.
    const notifyError = await notifyAdmin(row)
    await prisma.contactMessage.update({
      where: { id: row.id },
      data: notifyError ? { notifyError } : { notifiedAt: new Date() },
    })

    // The message is saved either way, so the submitter is told it arrived.
    return NextResponse.json({ ok: true, id: row.id })
  } catch (error: any) {
    console.error('[contact] submission error:', error?.message || error)
    return NextResponse.json(
      {
        ok: false,
        error: 'SERVER_ERROR',
        message: `Something went wrong on our end. Please email ${ADMIN_TO} directly.`,
      },
      { status: 500 }
    )
  }
}
