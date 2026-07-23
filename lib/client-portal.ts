// Shared, non-action helpers for the client order portal. Kept out of any
// 'use server' module so both server actions and route handlers can import
// these synchronous values.

// Cookie that carries the post-login destination through the magic-link email
// round-trip. Short-lived, httpOnly; only ever holds a validated /orders/ path.
export const LOGIN_NEXT_COOKIE = 'client_login_next'

// Default destination after a successful login.
export const DEFAULT_POST_LOGIN = '/orders/submit'

// Only allow same-origin paths under /orders/ — never an absolute URL, a
// protocol-relative //host, or anything outside the order portal. Returns the
// safe path or null.
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/orders/')) return null
  if (raw.startsWith('//')) return null
  return raw
}
