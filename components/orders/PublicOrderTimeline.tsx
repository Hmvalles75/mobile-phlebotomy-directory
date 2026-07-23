import type { InstitutionalOrder, OrderStatus } from '@prisma/client'

interface Props {
  order: Pick<
    InstitutionalOrder,
    | 'id' | 'patientName' | 'patientCity' | 'patientState' | 'status'
    | 'kitShippedAt' | 'kitReceivedAt' | 'scheduledAt' | 'scheduledFor'
    | 'drawCompletedAt' | 'fedexDroppedAt' | 'fedexTrackingNum' | 'createdAt'
  >
  // Compact mode is used in the all-orders view; full mode on the single-order view.
  compact?: boolean
}

// Status → display label + color. Public-friendly wording (no internal jargon).
const STATUS_LABEL: Record<OrderStatus, { label: string; tone: 'gray' | 'blue' | 'amber' | 'green' | 'red' }> = {
  PENDING_REVIEW: { label: 'Received — pending review', tone: 'amber' },
  PENDING_KIT_SHIPMENT: { label: 'Awaiting kit shipment', tone: 'gray' },
  KIT_SHIPPED: { label: 'Kit shipped', tone: 'blue' },
  PENDING_KIT_RECEIPT: { label: 'Awaiting kit at patient', tone: 'amber' },
  KIT_RECEIVED: { label: 'Kit received', tone: 'blue' },
  PROVIDER_ASSIGNED: { label: 'Provider assigned', tone: 'blue' },
  SCHEDULED: { label: 'Appointment scheduled', tone: 'blue' },
  DRAW_COMPLETED: { label: 'Draw completed', tone: 'blue' },
  FEDEX_DROPPED: { label: 'Sample shipped to lab', tone: 'blue' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
}

const TONE_CLASSES: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  amber: 'bg-amber-50 text-amber-900 border-amber-200',
  green: 'bg-green-50 text-green-800 border-green-200',
  red: 'bg-red-50 text-red-800 border-red-200',
}

function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}
function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_LABEL[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${TONE_CLASSES[meta.tone]}`}>
      {meta.label}
    </span>
  )
}

// Patient first name + city/state only — privacy-safe display string.
export function patientPublicLabel(patientName: string, city: string, state: string) {
  const first = patientName.trim().split(/\s+/)[0] || patientName
  return `${first} (${city}, ${state})`
}

export default function PublicOrderTimeline({ order, compact = false }: Props) {
  const steps: Array<{ key: string; label: string; at: Date | null | undefined }> = [
    { key: 'created', label: 'Order created', at: order.createdAt },
    { key: 'kitShipped', label: 'Kit shipped to patient', at: order.kitShippedAt },
    { key: 'kitReceived', label: 'Kit received by patient', at: order.kitReceivedAt },
    { key: 'scheduled', label: 'Appointment scheduled', at: order.scheduledAt },
    { key: 'drawCompleted', label: 'Blood draw completed', at: order.drawCompletedAt },
    { key: 'fedexDropped', label: 'Sample shipped to lab', at: order.fedexDroppedAt },
  ]

  if (compact) {
    return (
      <div className="text-sm text-gray-600">
        <StatusPill status={order.status} />
        {order.scheduledFor && (
          <span className="ml-2">scheduled {fmtDate(order.scheduledFor)}</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500 mb-1">Patient</div>
          <div className="text-lg font-semibold text-gray-900">{patientPublicLabel(order.patientName, order.patientCity, order.patientState)}</div>
        </div>
        <StatusPill status={order.status} />
      </div>

      {order.scheduledFor && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-blue-700 font-semibold mb-1">Appointment</div>
          <div className="text-blue-900 font-medium">{fmtDate(order.scheduledFor)}</div>
        </div>
      )}

      {order.fedexTrackingNum && order.fedexDroppedAt && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-green-700 font-semibold mb-1">FedEx Tracking</div>
          <a
            href={`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(order.fedexTrackingNum)}`}
            target="_blank" rel="noopener noreferrer"
            className="text-green-900 font-mono text-sm font-medium underline hover:text-green-700"
          >
            {order.fedexTrackingNum}
          </a>
        </div>
      )}

      <div>
        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3">Timeline</h3>
        <ol className="relative border-l-2 border-gray-200 ml-2 space-y-4">
          {steps.map((s) => {
            const done = !!s.at
            return (
              <li key={s.key} className="ml-6">
                <span
                  className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full border-2 ${done ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}
                  aria-hidden
                />
                <div className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</div>
                <div className="text-xs text-gray-500">{fmtDateTime(s.at)}</div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
