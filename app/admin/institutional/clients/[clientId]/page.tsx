import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'
import { createOrder } from '@/lib/institutional-actions'
import { StatusPill } from '@/components/orders/PublicOrderTimeline'
import CopyLinkButton from '@/components/admin/CopyLinkButton'

export const dynamic = 'force-dynamic'

interface Props { params: { clientId: string } }

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function ClientDetailPage({ params }: Props) {
  const ok = await verifyAdminSession()
  if (!ok) redirect('/admin')

  const client = await prisma.institutionalClient.findUnique({
    where: { id: params.clientId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: { assignedProvider: { select: { name: true } } },
      },
    },
  })
  if (!client) notFound()

  const shareUrl = `/orders/client/${client.publicShareToken}`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        <div>
          <Link href="/admin/institutional/clients" className="text-sm text-primary-600 hover:underline">← All clients</Link>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-sm text-gray-600 mt-1">{client.contactEmail}{client.ccEmails ? ` · cc: ${client.ccEmails}` : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton url={shareUrl} label="Copy client share link" />
            </div>
          </div>
          {client.notes && (
            <p className="text-sm text-gray-700 mt-3 whitespace-pre-line bg-amber-50 border border-amber-200 rounded-md px-3 py-2">{client.notes}</p>
          )}
        </div>

        {/* Add Order form */}
        <details className="bg-white rounded-lg shadow-sm border border-gray-200">
          <summary className="cursor-pointer select-none px-5 sm:px-6 py-4 font-semibold text-gray-900">
            + Add Order
          </summary>
          <form action={createOrder} className="px-5 sm:px-6 pb-6 space-y-4">
            <input type="hidden" name="clientId" value={client.id} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Patient name <span className="text-red-500">*</span></span>
                <input name="patientName" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Contact name <span className="text-gray-400 font-normal">(if different)</span></span>
                <input name="patientContactName" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></span>
                <input name="patientPhone" type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Email</span>
                <input name="patientEmail" type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></span>
                <input name="patientAddress" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></span>
                <input name="patientCity" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></span>
                <input name="patientState" required maxLength={2} placeholder="IL" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">ZIP <span className="text-red-500">*</span></span>
                <input name="patientZip" required maxLength={10} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Client rate ($) <span className="text-red-500">*</span></span>
                <input name="clientRate" type="number" step="0.01" required defaultValue="125.00" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm font-medium text-gray-700 mb-1">Patient notes</span>
                <textarea name="patientNotes" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm font-medium text-gray-700 mb-1">Protocol notes <span className="text-gray-400 font-normal">(internal — kit handling, schedule constraints, etc.)</span></span>
                <textarea name="protocolNotes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </label>
            </div>
            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Create Order
            </button>
          </form>
        </details>

        {/* Orders table */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Orders ({client.orders.length})</h2>
          </div>
          {client.orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Patient</th>
                    <th className="px-4 py-3 text-left font-medium">City/State</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Scheduled For</th>
                    <th className="px-4 py-3 text-left font-medium">Provider</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {client.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/institutional/orders/${o.id}`} className="font-medium text-primary-700 hover:underline">
                          {o.patientName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{o.patientCity}, {o.patientState}</td>
                      <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                      <td className="px-4 py-3 text-gray-700">{fmtDate(o.scheduledFor)}</td>
                      <td className="px-4 py-3 text-gray-700">{o.assignedProvider?.name ?? <span className="text-gray-400">unassigned</span>}</td>
                      <td className="px-4 py-3 text-gray-500">{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
