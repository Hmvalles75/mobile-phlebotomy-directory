import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * Change history for one provider: who changed which tracked field, when,
 * from what to what. Fed by the Postgres trigger in
 * scripts/sql/provider-change-log.sql. See lib/providerAudit.ts.
 */
function fmt(d: Date) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function actorLabel(actor: string) {
  if (actor === 'db') return { text: 'database tool / script', cls: 'bg-red-100 text-red-800' }
  if (actor === 'app') return { text: 'app (untagged)', cls: 'bg-gray-100 text-gray-700' }
  if (actor.startsWith('admin')) return { text: 'admin', cls: 'bg-purple-100 text-purple-800' }
  if (actor.startsWith('provider')) return { text: 'provider (self)', cls: 'bg-blue-100 text-blue-800' }
  if (actor.startsWith('system')) return { text: actor.replace('system:', 'cron: '), cls: 'bg-amber-100 text-amber-800' }
  if (actor.startsWith('webhook')) return { text: actor.replace('webhook:', 'webhook: '), cls: 'bg-green-100 text-green-800' }
  return { text: actor, cls: 'bg-gray-100 text-gray-700' }
}
const show = (v: string | null) => v === null ? <span className="text-gray-400">null</span> : v === '' ? <span className="text-gray-400">empty</span> : <span className="break-all">{v.length > 120 ? v.slice(0, 120) + '...' : v}</span>

export default async function ProviderHistoryPage({ params }: { params: { id: string } }) {
  const session = await verifyAdminSession()
  if (!session) redirect('/admin')
  const provider = await prisma.provider.findUnique({ where: { id: params.id }, select: { id: true, name: true, slug: true, eligibleForLeads: true, notifyEnabled: true, priorityRouting: true, createdAt: true } })
  if (!provider) notFound()
  const rows = await prisma.providerChangeLog.findMany({ where: { providerId: params.id }, orderBy: { changedAt: 'desc' }, take: 300 })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:underline">Admin</Link>{' › '}<span className="text-gray-700">{provider.name.trim()}</span>{' › '}History
        </nav>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">{provider.name.trim()}</h1>
        <p className="text-sm text-gray-500 mb-6">
          Listed {fmt(provider.createdAt)} &middot; leads {provider.eligibleForLeads ? 'on' : 'off'} &middot; notifications {provider.notifyEnabled ? 'on' : 'off'} &middot; {provider.priorityRouting ? 'paying' : 'free'} &middot;{' '}
          <Link href={`/provider/${provider.slug}`} className="text-blue-600 hover:underline">public page</Link>
        </p>

        {rows.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-gray-600">No tracked changes recorded yet. Logging began when the trigger was installed; earlier edits are not recoverable.</div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr><th className="text-left px-4 py-2">When</th><th className="text-left px-4 py-2">Who</th><th className="text-left px-4 py-2">Field</th><th className="text-left px-4 py-2">From</th><th className="text-left px-4 py-2">To</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(r => { const a = actorLabel(r.actor); return (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{fmt(r.changedAt)}</td>
                    <td className="px-4 py-2 whitespace-nowrap"><span className={`inline-block text-xs px-2 py-0.5 rounded ${a.cls}`}>{a.text}</span>{r.source && <div className="text-xs text-gray-400 mt-0.5">{r.source}</div>}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-800">{r.field}</td>
                    <td className="px-4 py-2 text-gray-600">{show(r.oldValue)}</td>
                    <td className="px-4 py-2 text-gray-900">{show(r.newValue)}</td>
                  </tr>
                ) })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-4">Rows labeled &ldquo;database tool / script&rdquo; were edits made outside the app. Everything else names the route or job.</p>
      </div>
    </div>
  )
}
