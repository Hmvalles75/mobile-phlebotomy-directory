import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'
import { detectJunkDescription } from '@/lib/detectJunkDescription'

export const dynamic = 'force-dynamic'

export default async function FlaggedDescriptionsPage() {
  const session = await verifyAdminSession()
  if (!session) redirect('/admin')

  const flagged = await prisma.provider.findMany({
    where: { descriptionFlagged: true },
    select: {
      id: true, name: true, slug: true, description: true,
      primaryCity: true, primaryState: true, status: true, eligibleForLeads: true,
      website: true, email: true, source: true,
    },
    orderBy: [{ status: 'desc' }, { primaryState: 'asc' }, { name: 'asc' }],
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:underline">Admin</Link>
          {' › '}
          <span className="text-gray-700">Flagged descriptions</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-6 gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Flagged descriptions</h1>
            <p className="text-sm text-gray-500 mt-1">
              Providers whose descriptions look like scraped nav-menu junk or heavy ALL-CAPS marketing. These render as "Contact for details." on directory pages until cleaned up.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{flagged.length}</span> flagged
          </div>
        </div>

        {flagged.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-700 font-medium">No flagged descriptions. ✅</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2">Provider</th>
                    <th className="text-left px-4 py-2">Location</th>
                    <th className="text-left px-4 py-2">Why flagged</th>
                    <th className="text-left px-4 py-2">Description preview</th>
                    <th className="text-left px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {flagged.map(p => {
                    const reasons = detectJunkDescription(p.description).reasons
                    const preview = (p.description || '').replace(/\s+/g, ' ').slice(0, 140)
                    const active = p.status === 'VERIFIED' && p.eligibleForLeads
                    return (
                      <tr key={p.id} className={active ? 'bg-amber-50/40' : ''}>
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-gray-900">{p.name.trim()}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {p.status} {active && '· eligible'}
                            {p.source && <span className="ml-2 text-gray-400">{p.source}</span>}
                          </div>
                          {p.website && (
                            <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-0.5 block break-all">
                              {p.website}
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-gray-700 whitespace-nowrap">
                          {p.primaryCity || '—'}, {p.primaryState || '—'}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <ul className="text-xs text-gray-700 space-y-0.5">
                            {reasons.map((r, i) => <li key={i}>· {r}</li>)}
                          </ul>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-gray-600 max-w-md">
                          <span className="line-clamp-2">{preview}{preview.length === 140 ? '…' : ''}</span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Link
                            href={`/provider/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs whitespace-nowrap block"
                          >
                            View profile →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-700 mb-2">What gets flagged</p>
          <p>· Description has &gt;40% ALL-CAPS letter characters (heavy marketing / nav-menu scrape)</p>
          <p>· Same 3-word phrase repeated 3 or more times (e.g. "PCI PCI PCI" or "Vampire On the Go Vampire On the Go...")</p>
          <p>· Description contains scraped nav/footer indicators (HOME HOME, Toggle navigation, Privacy Policy, © 20…, etc.)</p>
          <p className="mt-2">After cleaning up a description in the admin provider editor, the next backfill run (or any save through the admin) clears the flag automatically.</p>
        </div>
      </div>
    </div>
  )
}
