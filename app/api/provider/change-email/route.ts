import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import sg from '@sendgrid/mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Self-serve login-email change for a signed-in provider.
 *
 * Magic-link login matches on claimEmail OR email, so when a provider's email
 * changes they can't receive a login link and have no recovery except emailing
 * support (Janice/Vein Luxe, Shaykila this session). This lets a provider who
 * still has a valid session update the login identity themselves. It updates
 * email + claimEmail, and keeps notificationEmail in sync when it matched the
 * old login address so lead emails don't keep going to a dead inbox.
 */
export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const newEmail = String(body?.newEmail || '').toLowerCase().trim()

    if (!newEmail || !EMAIL_RE.test(newEmail)) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const provider = await prisma.provider.findUnique({
      where: { id: session.providerId },
      select: { id: true, name: true, email: true, claimEmail: true, notificationEmail: true },
    })
    if (!provider) {
      return NextResponse.json({ ok: false, error: 'Provider not found' }, { status: 404 })
    }

    const oldEmail = (provider.claimEmail || provider.email || '').toLowerCase().trim()
    if (newEmail === oldEmail) {
      return NextResponse.json({ ok: false, error: 'That is already your login email.' }, { status: 400 })
    }

    // Uniqueness: another provider must not already use this email, or the
    // magic-link lookup (claimEmail OR email) becomes ambiguous. These fields
    // are NOT unique in the schema, so check manually.
    const conflict = await prisma.provider.findFirst({
      where: {
        id: { not: provider.id },
        OR: [
          { claimEmail: { equals: newEmail, mode: 'insensitive' } },
          { email: { equals: newEmail, mode: 'insensitive' } },
          { notificationEmail: { equals: newEmail, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    })
    if (conflict) {
      return NextResponse.json(
        { ok: false, error: 'That email is already associated with another account. Please contact hector@mobilephlebotomy.org if this is a mistake.' },
        { status: 409 }
      )
    }

    // Keep notificationEmail in sync when it matched the old login email (or was
    // unset), so lead notifications follow the provider to the new address. If
    // they deliberately set a different notification email, leave it alone.
    const notifMatchedOld =
      !provider.notificationEmail ||
      provider.notificationEmail.toLowerCase().trim() === oldEmail
    const data: { email: string; claimEmail: string; notificationEmail?: string } = {
      email: newEmail,
      claimEmail: newEmail,
    }
    if (notifMatchedOld) data.notificationEmail = newEmail

    await prisma.provider.update({ where: { id: provider.id }, data })
    console.log(`[change-email] Provider ${provider.id} changed login email ${oldEmail || '(none)'} -> ${newEmail} (notif synced: ${notifMatchedOld})`)

    // Best-effort notifications — never fail the request over email trouble.
    if (process.env.SENDGRID_API_KEY) {
      sg.setApiKey(process.env.SENDGRID_API_KEY)
      const from = process.env.LEAD_EMAIL_FROM || 'noreply@mobilephlebotomy.org'
      const sends: Promise<unknown>[] = []
      sends.push(
        sg.send({
          to: newEmail,
          from,
          subject: 'Your MobilePhlebotomy login email was updated',
          text: `Hi ${provider.name},\n\nYour provider dashboard login email is now ${newEmail}. Sign in anytime at https://www.mobilephlebotomy.org/dashboard/login using this address.\n\nIf you didn't make this change, contact us at hector@mobilephlebotomy.org right away.\n\n— MobilePhlebotomy.org`,
        }).catch((e: any) => console.error('[change-email] new-address email failed:', e?.message || e))
      )
      if (oldEmail && EMAIL_RE.test(oldEmail)) {
        sends.push(
          sg.send({
            to: oldEmail,
            from,
            subject: 'Your MobilePhlebotomy login email was changed',
            text: `Hi ${provider.name},\n\nThe login email on your MobilePhlebotomy provider account was just changed to ${newEmail}. If this was you, no action is needed.\n\nIf you did NOT make this change, contact us immediately at hector@mobilephlebotomy.org.\n\n— MobilePhlebotomy.org`,
          }).catch((e: any) => console.error('[change-email] old-address email failed:', e?.message || e))
        )
      }
      await Promise.allSettled(sends)
    }

    return NextResponse.json({
      ok: true,
      email: newEmail,
      message: 'Login email updated. Use this address next time you sign in.',
    })
  } catch (error: any) {
    console.error('[change-email] Error:', error?.message || error)
    return NextResponse.json({ ok: false, error: 'Failed to update login email' }, { status: 500 })
  }
}
