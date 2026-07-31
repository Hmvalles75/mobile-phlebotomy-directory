import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifyAdminSession } from '@/lib/admin-auth'
import { getProviderRoster } from '@/lib/provider-roster'
import { ProviderRosterTable } from './ProviderRosterTable'

export const dynamic = 'force-dynamic'

export default async function ProviderRosterPage() {
  const session = await verifyAdminSession()
  if (!session) redirect('/admin')

  const { rows, summary, windowDays } = await getProviderRoster()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-[1400px] mx-auto">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:underline">Admin</Link>
          {' › '}
          <Link href="/admin/coverage" className="hover:underline">Coverage map</Link>
          {' › '}
          <span className="text-gray-700">Provider roster</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-6 gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Provider roster</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-3xl">
              Every provider with their contact info, coverage and lead activity over the last{' '}
              {windowDays} days. Computed live on each page load — no refresh step, no script to run.
              <strong> Routable</strong> means they&apos;d actually be emailed a lead somewhere, using the
              same predicate as the router.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs shrink-0">
            <Link
              href="/admin/coverage"
              className="px-2 py-1 rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              By metro
            </Link>
            <span className="px-2 py-1 rounded border bg-blue-600 text-white border-blue-600">
              By provider
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <Stat label="Providers" value={summary.total} />
          <Stat label="Routable" value={summary.routable} tone="green" />
          <Stat label="Paying" value={summary.paying} tone="green" />
          <Stat label={`Dormant (${windowDays}d)`} value={summary.dormant} tone="amber" />
          <Stat label="Blocked (no email)" value={summary.blockedNoEmail} tone="red" />
        </div>

        <ProviderRosterTable rows={rows} windowDays={windowDays} />

        <p className="text-xs text-gray-400 mt-4 max-w-3xl">
          Amber rows are dormant — notified but zero claims in the window, the signal to pause or
          re-engage. Green rows are paying. Hover the Metros count to see which of the top 50 metros
          a provider&apos;s radius reaches. Export CSV writes out whatever the current filters show.
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'amber' | 'red' }) {
  const toneClass =
    tone === 'green' ? 'text-green-700' :
    tone === 'amber' ? 'text-amber-700' :
    tone === 'red' ? 'text-red-700' : 'text-gray-900'
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}
