import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

/**
 * Infer the most likely reason a lead with 3+ notified providers received zero
 * claims. Uses email-event aggregates across all of the lead's notifications.
 *
 * Returns a label + color for UI rendering. Order of checks matters — we want
 * the most actionable signal to win.
 */
function inferFailureMode(stats: {
  totalNotified: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  totalBounced: number
  totalSpam: number
  totalEvents: number
}): { label: string; color: 'red' | 'amber' | 'gray' | 'blue' } {
  if (stats.totalEvents === 0) {
    return { label: 'No event data (webhook off)', color: 'gray' }
  }
  if (stats.totalSpam > 0) return { label: 'Marked as spam', color: 'red' }
  if (stats.totalBounced >= Math.ceil(stats.totalNotified / 2)) return { label: 'Bad addresses (≥50% bounce)', color: 'red' }
  if (stats.totalBounced > 0) return { label: `${stats.totalBounced} bounce(s) — partial`, color: 'amber' }
  if (stats.totalDelivered < stats.totalNotified / 2) return { label: 'Deliverability issue', color: 'red' }
  if (stats.totalOpened === 0) return { label: 'Delivered, nobody opened', color: 'amber' }
  if (stats.totalClicked === 0) return { label: 'Opened, no click on CTA', color: 'amber' }
  return { label: 'Clicked but no claim — claim flow?', color: 'red' }
}

export default async function LeadDiagnosticIndexPage() {
  const session = await verifyAdminSession()
  if (!session) redirect('/admin')

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Pull leads from the last 30 days where at least 3 providers were notified
  // and the lead is not in a CLAIMED state. We filter to leads where notifications
  // actually fired (i.e. SENT or QUEUED at minimum, not zero rows).
  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: cutoff },
      status: { not: 'CLAIMED' },
    },
    include: {
      leadNotifications: {
        include: {
          provider: { select: { name: true } },
          emailEvents: { select: { event: true, timestamp: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const failureRows = leads
    .filter(l => l.leadNotifications.length >= 3)
    // Defensive: also include leads where claimedAt is set even if status changed
    .filter(l => !l.claimedAt)
    .map(l => {
      let totalDelivered = 0, totalOpened = 0, totalClicked = 0, totalBounced = 0, totalSpam = 0, totalEvents = 0
      // Per-provider unique counts (one provider with 5 opens still counts as 1 opened)
      const openedProviders = new Set<string>()
      const clickedProviders = new Set<string>()
      for (const n of l.leadNotifications) {
        const events = n.emailEvents
        totalEvents += events.length
        if (events.find(e => e.event === 'delivered')) totalDelivered++
        if (events.find(e => e.event === 'open')) { totalOpened++; openedProviders.add(n.providerId) }
        if (events.find(e => e.event === 'click')) { totalClicked++; clickedProviders.add(n.providerId) }
        if (events.find(e => e.event === 'bounce' || e.event === 'dropped')) totalBounced++
        if (events.find(e => e.event === 'spamreport')) totalSpam++
      }
      const stats = { totalNotified: l.leadNotifications.length, totalDelivered, totalOpened, totalClicked, totalBounced, totalSpam, totalEvents }
      const failureMode = inferFailureMode(stats)
      return { lead: l, stats, failureMode }
    })

  const totalLeadsLast30 = leads.length
  const totalFailures = failureRows.length
  const totalWebhookConfigured = failureRows.filter(r => r.stats.totalEvents > 0).length

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:underline">Admin</Link>
          {' › '}
          <span className="text-gray-700">Lead diagnostic</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-6 gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lead diagnostic — failures</h1>
            <p className="text-sm text-gray-500 mt-1">Last 30 days. Leads with 3+ providers notified and 0 claims.</p>
          </div>
          <div className="text-xs text-gray-500">
            {totalFailures} failure-pattern leads · {totalLeadsLast30} total in 30d window
            {totalWebhookConfigured === 0 && totalFailures > 0 && (
              <span className="block sm:inline sm:ml-2 text-amber-600">⚠ no email events stored — webhook not yet configured</span>
            )}
          </div>
        </div>

        {totalFailures === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-700 font-medium">No failure-pattern leads in the last 30 days.</p>
            <p className="text-sm text-gray-500 mt-1">Either every lead with 3+ notified got claimed, or no leads had 3+ providers notified.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2">Created</th>
                    <th className="text-left px-4 py-2">Location</th>
                    <th className="text-left px-4 py-2">Urgency</th>
                    <th className="text-right px-4 py-2">Notified</th>
                    <th className="text-right px-4 py-2">Delivered</th>
                    <th className="text-right px-4 py-2">Opened</th>
                    <th className="text-right px-4 py-2">Clicked</th>
                    <th className="text-right px-4 py-2">Bounce</th>
                    <th className="text-left px-4 py-2">Likely failure mode</th>
                    <th className="text-left px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {failureRows.map(({ lead, stats, failureMode }) => {
                    const colorCls: Record<string, string> = {
                      red: 'bg-red-100 text-red-800 border-red-200',
                      amber: 'bg-amber-100 text-amber-800 border-amber-200',
                      gray: 'bg-gray-100 text-gray-700 border-gray-200',
                      blue: 'bg-blue-100 text-blue-800 border-blue-200',
                    }
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDateTime(lead.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="font-medium">{lead.city}, {lead.state}</div>
                          <div className="text-xs text-gray-500">{lead.zip}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{lead.urgency}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{stats.totalNotified}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{stats.totalDelivered}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{stats.totalOpened}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{stats.totalClicked}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{stats.totalBounced || ''}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${colorCls[failureMode.color]}`}>
                            {failureMode.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/lead-diagnostic/${lead.id}`}
                            className="text-blue-600 hover:underline text-xs whitespace-nowrap"
                          >
                            Open →
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

        {/* Footer help */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-700 mb-2">Failure-mode reference</p>
          <p><strong>No event data (webhook off)</strong> — SendGrid Event Webhook isn't configured. Without it, opens/clicks/bounces aren't tracked. Configure at SG dashboard → Mail Settings → Event Webhook → POST to <code>/api/webhooks/sendgrid-events</code>.</p>
          <p><strong>Marked as spam</strong> — at least one recipient flagged the email as spam. Hurts deliverability across the network. Investigate sender reputation / content.</p>
          <p><strong>Bad addresses</strong> — half or more bounced. Email validation gap or stale provider list.</p>
          <p><strong>Deliverability issue</strong> — fewer than half delivered without bouncing (greylisted, deferred indefinitely, etc.).</p>
          <p><strong>Delivered, nobody opened</strong> — emails arriving but no provider opening within the window. Subject-line / sender-name / inbox-placement issue, or providers genuinely not checking.</p>
          <p><strong>Opened, no click on CTA</strong> — they read it but didn't act. Body copy / CTA / lead match-fit problem.</p>
          <p><strong>Clicked but no claim</strong> — they tried to claim but didn't complete. Likely a claim-flow bug: page broken, login prompt, or claim button failing.</p>
        </div>
      </div>
    </div>
  )
}
