import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PublicOrderTimeline from '@/components/orders/PublicOrderTimeline'

export const dynamic = 'force-dynamic'

interface Props { params: { publicShareToken: string } }

export const metadata = {
  title: 'Order Status | MobilePhlebotomy.org',
  robots: { index: false, follow: false },
}

export default async function PublicOrderPage({ params }: Props) {
  // Select ONLY the client-visible fields. Never fetch clientRate, providerRate,
  // assignedProviderId, or patient contact/address/notes here — this object is
  // handed to the public timeline, and selecting only safe fields keeps the
  // sensitive data out of the render layer entirely (defense-in-depth; the
  // omission of provider/pricing from client views is a deliberate protection).
  const order = await prisma.institutionalOrder.findUnique({
    where: { publicShareToken: params.publicShareToken },
    select: {
      id: true,
      patientName: true,
      patientCity: true,
      patientState: true,
      status: true,
      kitShippedAt: true,
      kitReceivedAt: true,
      scheduledAt: true,
      scheduledFor: true,
      drawCompletedAt: true,
      fedexDroppedAt: true,
      fedexTrackingNum: true,
      createdAt: true,
      client: { select: { name: true } },
    },
  })
  if (!order) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-8">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">{order.client.name}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Status</h1>
          <PublicOrderTimeline order={order} />
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          MobilePhlebotomy.org · This page updates as your order progresses.
        </p>
      </div>
    </div>
  )
}
