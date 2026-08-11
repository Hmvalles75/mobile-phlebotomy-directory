import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { UpgradeCheckout } from './UpgradeCheckout'

/**
 * Linkable upgrade entry point.
 *
 * The upgrade path was previously a modal inside the dashboard, reachable only
 * by a provider already logged in. Email CTAs need a URL, so this page exists
 * to carry them into the same Stripe Checkout flow.
 *
 * ?provider={id} identifies who is upgrading. Provider ids already appear in
 * claim links (/claim/{leadId}?provider={id}), so this is consistent with
 * existing practice — and the id alone grants nothing: it only preselects who
 * the subscription is for. Payment still happens in Stripe.
 */
export const metadata: Metadata = {
  title: 'Upgrade Your Listing | MobilePhlebotomy.org',
  robots: { index: false, follow: false },
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams?: { provider?: string }
}) {
  const providerId = searchParams?.provider
  const provider = providerId
    ? await prisma.provider.findUnique({
        where: { id: providerId },
        select: {
          id: true, name: true, primaryCity: true, primaryState: true,
          priorityRouting: true, featuredTier: true, removedAt: true,
        },
      })
    : null

  if (!provider || provider.removedAt) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Upgrade your listing</h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t identify your listing from this link. Sign in to your dashboard and
            upgrade from there.
          </p>
          <Link href="/dashboard/login" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700">
            Go to your dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Already paying — never show an upgrade offer to an existing subscriber.
  if (provider.priorityRouting) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            You&apos;re already subscribed
          </h1>
          <p className="text-gray-600 mb-6">
            {provider.name} is on our paid tier, so there&apos;s nothing to upgrade. If something
            on your listing doesn&apos;t look right, reply to any of our emails and we&apos;ll fix it.
          </p>
          <Link href="/dashboard" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700">
            Go to your dashboard
          </Link>
        </div>
      </div>
    )
  }

  const where = provider.primaryCity
    ? `${provider.primaryCity}, ${provider.primaryState || ''}`.trim().replace(/,$/, '')
    : 'your area'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade {provider.name}</h1>
        <p className="text-gray-600 mb-8">
          Stand out to patients searching in {where}.
        </p>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">What Founding Partner gives you</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Top placement in your city&apos;s directory</li>
            <li>• A larger, more visible profile card</li>
            <li>• Your &quot;Founding Partner&quot; badge</li>
            <li>• First priority when our waterfall lead routing launches</li>
            <li>• Cancel anytime — no long-term contract</li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            Leads stay free to claim. We don&apos;t charge per lead or take a commission.
          </p>
        </div>

        <UpgradeCheckout providerId={provider.id} />

        <p className="text-sm text-gray-500 mt-6 text-center">
          Questions? Reply to any email from us and Hector will answer.
        </p>
      </div>
    </div>
  )
}
