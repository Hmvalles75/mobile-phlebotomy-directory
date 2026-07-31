import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifyAdminSession } from '@/lib/admin-auth'
import { getCoverageMap, type MetroCoverage } from '@/lib/coverage-map'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams?: { sort?: string }
}

const TIER_STYLE: Record<MetroCoverage['tier'], { row: string; badge: string; label: string }> = {
  covered: { row: 'bg-green-50', badge: 'bg-green-100 text-green-800', label: 'Covered' },
  thin:    { row: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800', label: 'Thin' },
  gap:     { row: 'bg-red-50',   badge: 'bg-red-100 text-red-800',     label: 'Gap' },
}

export default async function CoveragePage({ searchParams }: Props) {
  const session = await verifyAdminSession()
  if (!session) redirect('/admin')

  const sort = searchParams?.sort === 'gaps' ? 'gaps' : 'rank'
  const { metros, totalActiveProviders } = await getCoverageMap()

  const covered = metros.filter(m => m.tier === 'covered').length
  const thin = metros.filter(m => m.tier === 'thin').length
  const gaps = metros.filter(m => m.tier === 'gap').length

  const sorted = [...metros].sort((a, b) => {
    if (sort === 'gaps') {
      // Gaps first, then thin, then covered; tie-break by metro rank (importance)
      if (a.notifiable !== b.notifiable) return a.notifiable - b.notifiable
      return a.metro.rank - b.metro.rank
    }
    return a.metro.rank - b.metro.rank
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:underline">Admin</Link>
          {' › '}
          <span className="text-gray-700">Coverage map</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-6 gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Coverage map — top 50 metros</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-3xl">
              Live view of where you have provider coverage, computed from the same matching
              rules the lead router uses. <strong>Notifiable</strong> = providers who would actually be
              emailed a lead in that metro (the real coverage number). Updates automatically as
              providers are added or activated.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs shrink-0">
            <Link
              href="/admin/coverage/providers"
              className="px-2 py-1 rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              By provider →
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/admin/coverage?sort=rank"
              className={`px-2 py-1 rounded border ${sort === 'rank' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              By metro rank
            </Link>
            <Link
              href="/admin/coverage?sort=gaps"
              className={`px-2 py-1 rounded border ${sort === 'gaps' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Gaps first
            </Link>
          </div>
        </div>

        {/* Headline numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Active providers" value={totalActiveProviders} />
          <Stat label="Metros covered (3+)" value={covered} tone="green" />
          <Stat label="Thin (1–2)" value={thin} tone="amber" />
          <Stat label="Gaps (0)" value={gaps} tone="red" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Metro</th>
                  <th className="text-left px-4 py-2">State</th>
                  <th className="text-right px-4 py-2" title="Providers who would be emailed a lead here">Notifiable</th>
                  <th className="text-right px-4 py-2" title="Of notifiable, paying customers (priority routing)">Paying</th>
                  <th className="text-right px-4 py-2" title="Providers who would get an SMS claim offer here">SMS-routable</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Who covers it</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(m => {
                  const style = TIER_STYLE[m.tier]
                  return (
                    <tr key={m.metro.slug} className={style.row}>
                      <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{m.metro.rank}</td>
                      <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{m.metro.city}</td>
                      <td className="px-4 py-2 text-gray-600">{m.metro.stateAbbr}</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">{m.notifiable}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{m.paying || <span className="text-gray-300">0</span>}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{m.smsRoutable || <span className="text-gray-300">0</span>}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{style.label}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-600 text-xs">
                        {m.topProviders.length === 0 ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          m.topProviders.map((p, i) => (
                            <span key={p.name}>
                              {i > 0 && ', '}
                              <span className={p.paying ? 'font-medium text-gray-900' : ''}>
                                {p.name}{p.paying && ' ★'}
                              </span>
                            </span>
                          ))
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 max-w-3xl">
          ★ = paying customer (priority routing). Coverage is measured against each metro&apos;s
          representative ZIPs using providers&apos; service radius (default 25 mi) — the same radius
          logic the router applies, so a statewide &quot;TX&quot; tag alone does not count a far-away
          provider as local coverage.
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
