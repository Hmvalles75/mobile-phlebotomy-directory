'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClientMagicLink } from '@/lib/client-auth'
import { LOGIN_NEXT_COOKIE, safeNext } from '@/lib/client-portal'

export async function requestClientLogin(formData: FormData) {
  const email = String(formData.get('email') || '')
  const next = safeNext(String(formData.get('next') || ''))

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || null
  const userAgent = h.get('user-agent')

  // Stash the intended destination so /orders/verify can honor it after the
  // email round-trip (same browser). Falls back to the default otherwise.
  const jar = await cookies()
  if (next) {
    jar.set(LOGIN_NEXT_COOKIE, next, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    })
  }

  // Always resolves ok — never reveals whether the email maps to a real user.
  await createClientMagicLink(email, { ip, userAgent })

  redirect('/orders/login?sent=1')
}
