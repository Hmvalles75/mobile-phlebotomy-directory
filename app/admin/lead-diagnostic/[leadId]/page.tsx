import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

interface Props { params: { leadId: string } }

function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
  })
}

function elapsed(from: Date | null | undefined, to: Date | null | undefined): string {
  if (!from || !to) return '—'
  const ms = new Date(to).getTime() - new Date(from).getTime()
  if (ms < 0) return '—'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ${sec % 60}s`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ${min % 60}m`
  return `${Math.floor(hr / 24)}d ${hr % 24}h`
}

function StatusPill({ children, color }: { children: React.ReactNode; color: 'green' | 'red' | 'amber' | 'gray' | 'blue' }) {
  const cls: Record<string, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
  }
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${cls[color]}`}>{children}</span>
}

export default async function LeadDiagnosticPage({ params }: Props) {
  const session = await verifyAdminSession()
  if (!session) redirect('/admin')

  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    include: {
      leadNotifications: {
        orderBy: { createdAt: 'asc' },
        include: {
          provider: { select: { id: true, name: true, email: true, notificationEmail: true, isFeatured: true, priorityRouting: true } },
          emailEvents: { orderBy: { timestamp: 'asc' } },
        },
      },
      provider: { select: { id: true, name: true } }, // routedTo
    },
  })

  if (!lead) notFound()

  // Build per-notification analytics
  const rows = lead.leadNotifications.map(n => {
    const events = n.emailEvents
    const firstDelivered = events.find(e => e.event === 'delivered')?.timestamp || null
    const firstOpen = events.find(e => e.event === 'open')?.timestamp || null
    const lastOpen = [...events].reverse().find(e => e.event === 'open')?.timestamp || null
    const firstClick = events.find(e => e.event === 'click')?.timestamp || null
    const bounce = events.find(e => e.event === 'bounce' || e.event === 'dropped')
    const spam = events.find(e => e.event === 'spamreport')
    const opens = events.filter(e => e.event === 'open').length
    const clicks = events.filter(e => e.event === 'click').length

    const isClaimer = lead.routedToId === n.providerId
    const claimedAt = isClaimer ? lead.claimedAt : null

    let outcome: { label: string; color: 'green' | 'red' | 'amber' | 'gray' | 'blue' } = { label: 'No engagement', color: 'gray' }
    if (isClaimer && claimedAt) outcome = { label: 'CLAIMED', color: 'green' }
    else if (bounce) outcome = { label: `Bounced (${bounce.event})`, color: 'red' }
    else if (spam) outcome = { label: 'Marked spam', color: 'red' }
    else if (firstClick) outcome = { label: 'Clicked, no claim', color: 'amber' }
    else if (firstOpen) outcome = { label: `Opened ${opens}×`, color: 'blue' }
    else if (firstDelivered) outcome = { label: 'Delivered, no open', color: 'gray' }
    else if (n.status === 'SENT') outcome = { label: 'Sent, no events', color: 'gray' }
    else if (n.status === 'FAILED') outcome = { label: `Failed: ${n.errorMessage || 'unknown'}`, color: 'red' }
    else if (n.status === 'QUEUED') outcome = { label: 'Queued', color: 'gray' }

    return {
      n,
      firstDelivered, firstOpen, lastOpen, firstClick, opens, clicks,
      bounce, spam, isClaimer, claimedAt, outcome,
    }
  })

  const totalNotified = rows.length
  const totalClaimed = rows.filter(r => r.isClaimer).length
  const totalOpened = rows.filter(r => r.firstOpen).length
  const totalClicked = rows.filter(r => r.firstClick).length
  const totalBounced = rows.filter(r => r.bounce).length

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:underline">Admin</Link>
          {' › '}
          <Link href="/admin/lead-diagnostic" className="hover:underline">Lead diagnostic</Link>
          {' › '}
          <span className="text-gray-700">{lead.fullName?.trim() || lead.id.slice(0, 8)}</span>
        </nav>

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Lead diagnostic</h1>
        <p className="text-sm text-gray-500 mb-6">Lead ID: <code className="text-xs">{lead.id}</code></p>

        {/* Lead summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Created</div>
              <div className="font-medium text-gray-900">{fmtDateTime(lead.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Location</div>
              <div className="font-medium text-gray-900">{lead.city}, {lead.state} {lead.zip}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Urgency</div>
              <div className="font-medium text-gray-900">{lead.urgency}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
              <div className="font-medium text-gray-900">{lead.status}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Source</div>
              <div className="font-medium text-gray-900">{lead.source || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">High value?</div>
              <div className="font-medium text-gray-900">{lead.isHighValue ? 'YES' : 'no'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Claimed by</div>
              <div className="font-medium text-gray-900">{lead.provider?.name?.trim() || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Time to claim</div>
              <div className="font-medium text-gray-900">{elapsed(lead.routedAt, lead.claimedAt)}</div>
            </div>
          </div>
        </div>

        {/* Funnel summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Notified</div>
            <div className="text-2xl font-semibold text-gray-900">{totalNotified}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Opened</div>
            <div className="text-2xl font-semibold text-gray-900">{totalOpened}<span className="text-sm text-gray-500 font-normal"> / {totalNotified}</span></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Clicked</div>
            <div className="text-2xl font-semibold text-gray-900">{totalClicked}<span className="text-sm text-gray-500 font-normal"> / {totalNotified}</span></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Claimed</div>
            <div className="text-2xl font-semibold text-gray-900">{totalClaimed}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Bounced</div>
            <div className="text-2xl font-semibold text-gray-900">{totalBounced}</div>
          </div>
        </div>

        {/* Provider breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Per-provider engagement</h2>
            <p className="text-xs text-gray-500 mt-1">All providers notified for this lead, with email-level events from SendGrid.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2">Provider</th>
                  <th className="text-left px-4 py-2">Sent</th>
                  <th className="text-left px-4 py-2">Delivered</th>
                  <th className="text-left px-4 py-2">First open</th>
                  <th className="text-left px-4 py-2">Clicks</th>
                  <th className="text-left px-4 py-2">Outcome</th>
                  <th className="text-left px-4 py-2">Time elapsed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(r => {
                  const sentToFirstOpen = elapsed(r.n.sentAt, r.firstOpen)
                  const sentToClick = elapsed(r.n.sentAt, r.firstClick)
                  const sentToClaim = r.isClaimer ? elapsed(r.n.sentAt, r.claimedAt) : null
                  return (
                    <tr key={r.n.id} className={r.isClaimer ? 'bg-green-50' : ''}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {r.n.provider.name?.trim() || '—'}
                          {r.n.provider.priorityRouting && <span className="ml-1 text-xs text-amber-600">★paid</span>}
                          {r.n.provider.isFeatured && <span className="ml-1 text-xs text-blue-600">featured</span>}
                        </div>
                        <div className="text-xs text-gray-500">{r.n.provider.notificationEmail || r.n.provider.email || '—'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.n.channel} · {r.n.status}{r.n.sgMessageId ? ` · ${r.n.sgMessageId.slice(0, 12)}…` : ''}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtDateTime(r.n.sentAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtDateTime(r.firstDelivered)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {r.firstOpen ? (
                          <>
                            <div>{fmtDateTime(r.firstOpen)}</div>
                            {r.opens > 1 && <div className="text-xs text-gray-500">total {r.opens}×</div>}
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {r.clicks > 0 ? <>{r.clicks}× <span className="text-xs text-gray-500">first {fmtDateTime(r.firstClick)}</span></> : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusPill color={r.outcome.color}>{r.outcome.label}</StatusPill></td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {sentToClaim && <div>→ claim: {sentToClaim}</div>}
                        {!sentToClaim && r.firstClick && <div>→ click: {sentToClick}</div>}
                        {!sentToClaim && !r.firstClick && r.firstOpen && <div>→ open: {sentToFirstOpen}</div>}
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No providers notified.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw event log */}
        {rows.some(r => r.n.emailEvents.length > 0) && (
          <details className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <summary className="px-5 py-3 cursor-pointer font-medium text-gray-700 select-none">
              Raw email event log ({rows.reduce((sum, r) => sum + r.n.emailEvents.length, 0)} events)
            </summary>
            <div className="overflow-x-auto border-t border-gray-200">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 text-gray-600 uppercase">
                  <tr>
                    <th className="text-left px-3 py-1.5">Time</th>
                    <th className="text-left px-3 py-1.5">Provider</th>
                    <th className="text-left px-3 py-1.5">Event</th>
                    <th className="text-left px-3 py-1.5">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.flatMap(r => r.n.emailEvents.map(e => ({ ev: e, providerName: r.n.provider.name?.trim() || '—' })))
                    .sort((a, b) => new Date(a.ev.timestamp).getTime() - new Date(b.ev.timestamp).getTime())
                    .map(({ ev, providerName }) => (
                      <tr key={ev.id}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-gray-700">{fmtDateTime(ev.timestamp)}</td>
                        <td className="px-3 py-1.5 text-gray-700">{providerName}</td>
                        <td className="px-3 py-1.5 font-mono text-gray-900">{ev.event}</td>
                        <td className="px-3 py-1.5 text-gray-600 break-all">{ev.url || ev.reason || ev.ip || ''}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* Empty-state hint */}
        {rows.length > 0 && rows.every(r => r.n.emailEvents.length === 0) && (
          <div className="mt-6 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            No email events captured for this lead's notifications. Either the SendGrid Event Webhook isn't configured yet (Mail Settings → Event Webhook in your SG dashboard, point at <code>/api/webhooks/sendgrid-events</code>) or this lead was sent before instrumentation was added.
          </div>
        )}
      </div>
    </div>
  )
}
