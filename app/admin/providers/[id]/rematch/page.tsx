import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'
import { findOpenLeadsInProviderRadius, rematchAction } from '@/lib/rematch-actions'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
  searchParams?: { days?: string }
}

function fmtDateTime(d: Date): string {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function urgencyPill(urgency: string) {
  const cls = urgency === 'STAT'
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-blue-100 text-blue-800 border-blue-200'
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${cls}`}>{urgency}</span>
}

export default async function ProviderRematchPage({ params, searchParams }: Props) {
  const session = await verifyAdminSession()
  if (!session) redirect('/admin')

  const provider = await prisma.provider.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, slug: true,
      status: true, eligibleForLeads: true,
      email: true, claimEmail: true, notificationEmail: true,
      phone: true,
      primaryCity: true, primaryState: true,
      zipCodes: true, serviceRadiusMiles: true,
      createdAt: true, claimVerifiedAt: true,
    },
  })
  if (!provider) notFound()

  const days = Math.max(1, Math.min(30, parseInt(searchParams?.days || '14', 10) || 14))
  const matches = await findOpenLeadsInProviderRadius(params.id, days)
  const primaryZip = (provider.zipCodes || '').split(',')[0]?.trim() || '(none)'
  const recipientEmail = provider.notificationEmail || provider.claimEmail || provider.email
  const canSend = !!recipientEmail
  const ready = provider.status === 'VERIFIED' && provider.eligibleForLeads

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:underline">Admin</Link>
          {' › '}
          <span className="text-gray-700">Rematch open leads</span>
          {' › '}
          <span className="text-gray-700">{provider.name.trim()}</span>
        </nav>

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Rematch open leads</h1>
        <p className="text-sm text-gray-500 mb-6">
          Backfill recently-activated providers with leads that landed before they were available. Bypasses the 4-day notification age cap.
        </p>

        {/* Provider context */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Provider</div>
              <div className="font-medium text-gray-900">{provider.name.trim()}</div>
              <div className="text-xs text-gray-500 mt-0.5">{provider.id}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
              <div className="font-medium text-gray-900">
                {provider.status} {provider.eligibleForLeads ? '· eligible' : '· not eligible'}
              </div>
              {!ready && (
                <div className="text-xs text-amber-700 mt-0.5">
                  ⚠ Provider isn't VERIFIED + eligible. Rematch may still send, but consider activating first.
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Coverage</div>
              <div className="font-medium text-gray-900">{provider.primaryCity || '?'}, {provider.primaryState || '?'}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Primary ZIP {primaryZip} · {provider.serviceRadiusMiles || 25} mi radius
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Notification email</div>
              <div className="font-medium text-gray-900 break-all">{recipientEmail || '—'}</div>
              {!canSend && (
                <div className="text-xs text-red-700 mt-0.5">Cannot send — no email on file</div>
              )}
            </div>
          </div>
        </div>

        {/* Window picker */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{matches.length}</span> open lead{matches.length === 1 ? '' : 's'} in radius (last {days} days)
          </div>
          <div className="flex items-center gap-2 text-xs">
            {[7, 14, 30].map(d => (
              <Link
                key={d}
                href={`/admin/providers/${params.id}/rematch?days=${d}`}
                className={`px-2 py-1 rounded border ${
                  d === days
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {d}d
              </Link>
            ))}
          </div>
        </div>

        {/* Matches */}
        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-700 font-medium">No open leads in this provider's radius. ✅</p>
            <p className="text-sm text-gray-500 mt-1">
              Either nothing's pending in their area, or the window is too short. Try 30d if you want a wider sweep.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2">Submitted</th>
                    <th className="text-left px-4 py-2">Location</th>
                    <th className="text-left px-4 py-2">Urgency</th>
                    <th className="text-left px-4 py-2">Notes</th>
                    <th className="text-left px-4 py-2">Already notified</th>
                    <th className="text-left px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {matches.map(m => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{m.daysWaiting === 0 ? 'today' : `${m.daysWaiting}d ago`}</div>
                        <div className="text-xs text-gray-500">{fmtDateTime(m.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-gray-900 font-medium">{m.city}, {m.state}</div>
                        <div className="text-xs text-gray-500">{m.zip}</div>
                      </td>
                      <td className="px-4 py-3 align-top">{urgencyPill(m.urgency)}</td>
                      <td className="px-4 py-3 align-top text-xs text-gray-600 max-w-xs">
                        {m.notes
                          ? <span className="line-clamp-2">{m.notes}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {m.alreadyNotifiedThisProvider ? (
                          <span className="inline-block text-xs px-2 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-200">
                            already sent
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">{m.notificationCount} other{m.notificationCount === 1 ? '' : 's'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-2 items-end">
                          <form action={rematchAction}>
                            <input type="hidden" name="providerId" value={params.id} />
                            <input type="hidden" name="leadId" value={m.id} />
                            <input type="hidden" name="markRouted" value="false" />
                            <button
                              type="submit"
                              disabled={!canSend}
                              className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                              title="Send the rematch notification email — provider can claim via the email link."
                            >
                              Send notification
                            </button>
                          </form>
                          <form action={rematchAction}>
                            <input type="hidden" name="providerId" value={params.id} />
                            <input type="hidden" name="leadId" value={m.id} />
                            <input type="hidden" name="markRouted" value="true" />
                            <button
                              type="submit"
                              disabled={!canSend}
                              className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              title="Send AND mark routed to this provider — stops further re-routing to others."
                            >
                              Send + lock
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer help */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-700 mb-2">How this works</p>
          <p>· <strong>Send notification</strong> emails the provider with a soft preamble ("submitted X days ago, may have already found service — please confirm before scheduling"). Lead status stays OPEN; other providers can still claim.</p>
          <p>· <strong>Send + lock</strong> sends the email AND sets <code>routedToId</code> on the lead so the regular routing cron stops sending it to others. Use when you want this provider to have first dibs.</p>
          <p>· Each lead row records a LeadNotification audit entry visible in <Link href="/admin/lead-diagnostic" className="text-blue-600 hover:underline">/admin/lead-diagnostic</Link>.</p>
        </div>
      </div>
    </div>
  )
}
