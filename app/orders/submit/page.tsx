import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getClientSessionFromCookieStore } from '@/lib/client-auth'
import { safeNext } from '@/lib/client-portal'
import OrderSubmitForm from './OrderSubmitForm'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { ok?: string; ref?: string }
}

export default async function SubmitOrderPage({ searchParams }: Props) {
  const session = await getClientSessionFromCookieStore()
  if (!session) {
    // Missing/expired session — redirect cleanly to login, preserving the destination.
    redirect('/orders/login?next=/orders/submit')
  }

  // Client name for the header. Session is signed, but confirm the client still
  // exists (defensive — a deleted client shouldn't leave a usable session).
  const client = await prisma.institutionalClient.findUnique({
    where: { id: session.clientId },
    select: { name: true },
  })
  if (!client) {
    redirect('/orders/login?error=invalid')
  }

  const submitted = searchParams.ok === '1'
  const ref = searchParams.ref
  // Only ever link to a token-shaped tracking ref (no free-form redirect).
  const trackHref = ref && /^[a-z0-9]+$/i.test(ref) ? `/orders/${ref}` : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Submit an order</h1>
            <p className="text-sm text-gray-600 mt-1">
              {client.name} · signed in as {session.email}
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Order received</h2>
            <p className="text-sm text-gray-600">
              Thanks — your order is with our team for review. We’ll confirm scheduling shortly.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {trackHref && (
                <Link href={trackHref} className="text-sm text-primary-600 hover:underline font-medium">
                  Track this order
                </Link>
              )}
              <Link href="/orders/submit" className="text-sm text-gray-600 hover:underline">
                Submit another
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <OrderSubmitForm />
          </div>
        )}
      </div>
    </div>
  )
}
