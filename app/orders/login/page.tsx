import Link from 'next/link'
import { requestClientLogin } from './actions'
import { safeNext } from '@/lib/client-portal'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { next?: string; sent?: string; error?: string }
}

export default function OrderPortalLoginPage({ searchParams }: Props) {
  const next = safeNext(searchParams.next) ?? ''
  const sent = searchParams.sent === '1'
  const error = searchParams.error

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Order Portal</h1>
          <p className="text-sm text-gray-600 mt-1">MobilePhlebotomy.org — submit and track your organization&rsquo;s blood-draw orders.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-600">
                If that address is registered for the Order Portal, we&rsquo;ve sent a one-time login link. It expires in 15 minutes.
              </p>
              <p className="text-xs text-gray-500">
                Didn&rsquo;t get it? Check spam, or{' '}
                <Link href={`/orders/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-primary-600 hover:underline">
                  try a different email
                </Link>.
              </p>
            </div>
          ) : (
            <form action={requestClientLogin} className="space-y-4">
              {next ? <input type="hidden" name="next" value={next} /> : null}
              {error === 'invalid' && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                  That login link is invalid or has expired. Enter your email to get a new one.
                </div>
              )}
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Work email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@yourorganization.org"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </label>
              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-md text-sm font-semibold"
              >
                Email me a login link
              </button>
              <p className="text-xs text-gray-500 text-center">
                We&rsquo;ll email you a one-time link — no password to remember. Access is by invitation from your MobilePhlebotomy.org contact.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
