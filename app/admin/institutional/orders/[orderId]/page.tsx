import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'
import {
  updateOrder, setTimestampNow, setTimestampValue, clearTimestamp, setScheduledFor, setStatus,
} from '@/lib/institutional-actions'
import { StatusPill } from '@/components/orders/PublicOrderTimeline'
import CopyLinkButton from '@/components/admin/CopyLinkButton'

export const dynamic = 'force-dynamic'

interface Props { params: { orderId: string } }

const ALL_STATUSES = [
  'PENDING_KIT_SHIPMENT', 'KIT_SHIPPED', 'PENDING_KIT_RECEIPT', 'KIT_RECEIVED',
  'PROVIDER_ASSIGNED', 'SCHEDULED', 'DRAW_COMPLETED', 'FEDEX_DROPPED', 'COMPLETED', 'CANCELLED',
] as const

function fmtDateTimeLocal(d: Date | null | undefined): string {
  if (!d) return ''
  const dt = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}
function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

// ────────────────────────────────────────────────────────────────────
// Timestamp row — datetime-local input (for backdating) + "Set to now"
// + "Clear" buttons. The datetime input lets admin record historical
// events (kit shipped on a known past date, scheduled-at confirmed via
// email last week, etc.) without writing one-off DB scripts.
// ────────────────────────────────────────────────────────────────────
function TimestampRow({ label, field, value, orderId }: { label: string; field: string; value: Date | null; orderId: string }) {
  const setNowBound = setTimestampNow.bind(null, orderId)
  const setValueBound = setTimestampValue.bind(null, orderId)
  const clearBound = clearTimestamp.bind(null, orderId)
  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500">{fmtDateTime(value)}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <form action={setNowBound}>
            <input type="hidden" name="field" value={field} />
            <button type="submit" className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50">Set to now</button>
          </form>
          {value && (
            <form action={clearBound}>
              <input type="hidden" name="field" value={field} />
              <button type="submit" className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-600">Clear</button>
            </form>
          )}
        </div>
      </div>
      <form action={setValueBound} className="flex items-center gap-2">
        <input type="hidden" name="field" value={field} />
        <input
          name="value"
          type="datetime-local"
          defaultValue={fmtDateTimeLocal(value)}
          className="flex-1 sm:flex-initial sm:w-64 text-xs px-2 py-1 border border-gray-300 rounded-md"
          aria-label={`Set ${label} to a specific date/time`}
        />
        <button type="submit" className="text-xs px-3 py-1 rounded border border-primary-600 bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium">
          Save date
        </button>
      </form>
    </div>
  )
}

export default async function OrderDetailPage({ params }: Props) {
  const ok = await verifyAdminSession()
  if (!ok) redirect('/admin')

  const [order, providers] = await Promise.all([
    prisma.institutionalOrder.findUnique({
      where: { id: params.orderId },
      include: {
        client: true,
        assignedProvider: { select: { id: true, name: true, primaryCity: true, primaryState: true } },
      },
    }),
    prisma.provider.findMany({
      where: { status: 'VERIFIED', eligibleForLeads: true },
      select: { id: true, name: true, primaryCity: true, primaryState: true },
      orderBy: { name: 'asc' },
    }),
  ])
  if (!order) notFound()

  const updateBound = updateOrder.bind(null, order.id)
  const scheduledForBound = setScheduledFor.bind(null, order.id)
  const setStatusBound = setStatus.bind(null, order.id)
  const shareUrl = `/orders/${order.publicShareToken}`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
        <div>
          <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="text-primary-600 hover:underline">Admin home</Link>
            <span aria-hidden>/</span>
            <Link href="/admin/institutional/clients" className="text-primary-600 hover:underline">Institutional Clients</Link>
            <span aria-hidden>/</span>
            <Link href={`/admin/institutional/clients/${order.clientId}`} className="text-primary-600 hover:underline">{order.client.name}</Link>
            <span aria-hidden>/</span>
            <span className="text-gray-700">{order.patientName}</span>
          </nav>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{order.patientName}</h1>
              <p className="text-sm text-gray-600 mt-1">{order.patientCity}, {order.patientState} · created {fmtDateTime(order.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <StatusPill status={order.status} />
              <CopyLinkButton url={shareUrl} label="Copy public share link" />
            </div>
          </div>
        </div>

        {/* Status + scheduling section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Status & Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form action={setStatusBound} className="block">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Status</span>
                <select name="status" defaultValue={order.status} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </label>
              <button type="submit" className="mt-2 text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md font-medium">Update status</button>
            </form>

            <form action={scheduledForBound} className="block">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Scheduled For (appointment)</span>
                <input
                  name="scheduledFor"
                  type="datetime-local"
                  defaultValue={fmtDateTimeLocal(order.scheduledFor)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </label>
              <button type="submit" className="mt-2 text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md font-medium">Save appointment</button>
            </form>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Timeline</h3>
            <div className="bg-gray-50 rounded-md px-4 py-2">
              <TimestampRow label="Kit shipped to patient"   field="kitShippedAt"    value={order.kitShippedAt}    orderId={order.id} />
              <TimestampRow label="Kit received by patient"  field="kitReceivedAt"   value={order.kitReceivedAt}   orderId={order.id} />
              <TimestampRow label="Scheduling confirmed"     field="scheduledAt"     value={order.scheduledAt}     orderId={order.id} />
              <TimestampRow label="Blood draw completed"     field="drawCompletedAt" value={order.drawCompletedAt} orderId={order.id} />
              <TimestampRow label="FedEx dropped off"        field="fedexDroppedAt"  value={order.fedexDroppedAt}  orderId={order.id} />
            </div>
          </div>
        </section>

        {/* Provider + rates */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider & Rates</h2>
          <form action={updateBound} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block sm:col-span-3">
              <span className="block text-sm font-medium text-gray-700 mb-1">Assigned provider</span>
              <select name="assignedProviderId" defaultValue={order.assignedProviderId ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">— Unassigned —</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.primaryCity ?? '?'}, {p.primaryState ?? '?'})</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Client rate ($)</span>
              <input name="clientRate" type="number" step="0.01" defaultValue={order.clientRate.toString()} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Provider rate ($)</span>
              <input name="providerRate" type="number" step="0.01" defaultValue={order.providerRate?.toString() ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">FedEx tracking #</span>
              <input name="fedexTrackingNum" defaultValue={order.fedexTrackingNum ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <div className="sm:col-span-3">
              <button type="submit" className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md font-medium">Save</button>
            </div>
          </form>
        </section>

        {/* Patient details (editable) */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Details</h2>
          <form action={updateBound} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Patient name</span>
              <input name="patientName" defaultValue={order.patientName} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Contact name</span>
              <input name="patientContactName" defaultValue={order.patientContactName ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Phone</span>
              <input name="patientPhone" defaultValue={order.patientPhone} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Email</span>
              <input name="patientEmail" defaultValue={order.patientEmail ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1">Address</span>
              <input name="patientAddress" defaultValue={order.patientAddress} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">City</span>
              <input name="patientCity" defaultValue={order.patientCity} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">State</span>
              <input name="patientState" defaultValue={order.patientState} maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">ZIP</span>
              <input name="patientZip" defaultValue={order.patientZip} maxLength={10} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1">Patient notes</span>
              <textarea name="patientNotes" rows={2} defaultValue={order.patientNotes ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1">Protocol notes <span className="text-gray-400 font-normal">(internal)</span></span>
              <textarea name="protocolNotes" rows={3} defaultValue={order.protocolNotes ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md font-medium">Save patient details</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
