import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { StatusPill, patientPublicLabel } from '@/components/orders/PublicOrderTimeline'

export const dynamic = 'force-dynamic'

interface Props { params: { clientShareToken: string } }

export const metadata = {
  title: 'All Orders | MobilePhlebotomy.org',
  robots: { index: false, follow: false },
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function ClientPublicAllOrdersPage({ params }: Props) {
  // Select ONLY client-visible fields. Deliberately excludes the client's own
  // contactEmail/ccEmails/notes and every order's clientRate/providerRate/
  // assignedProviderId/patient contact/address/notes — those must never leave
  // the DB layer for a token-authed public view (defense-in-depth).
  const client = await prisma.institutionalClient.findUnique({
    where: { publicShareToken: params.clientShareToken },
    select: {
      name: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          patientName: true,
          patientCity: true,
          patientState: true,
          status: true,
          scheduledFor: true,
          createdAt: true,
          publicShareToken: true,
        },
      },
    },
  })
  if (!client) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-8">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">{client.name}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Status — All Patients</h1>
          <p className="text-sm text-gray-600 mt-2">
            {client.orders.length === 0 ? 'No orders yet.' : `${client.orders.length} order${client.orders.length === 1 ? '' : 's'}, most recent first.`}
          </p>
        </div>

        {client.orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {client.orders.map((o) => (
                <li key={o.id} className="px-5 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                  <Link href={`/orders/${o.publicShareToken}`} className="block">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900">
                          {patientPublicLabel(o.patientName, o.patientCity, o.patientState)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {o.scheduledFor ? `Appointment: ${fmtDate(o.scheduledFor)}` : `Created ${fmtDate(o.createdAt)}`}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatusPill status={o.status} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          MobilePhlebotomy.org · Click any order to see full timeline.
        </p>
      </div>
    </div>
  )
}
