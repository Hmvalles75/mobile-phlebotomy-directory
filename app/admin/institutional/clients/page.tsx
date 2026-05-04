import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'
import { createClient } from '@/lib/institutional-actions'

export const dynamic = 'force-dynamic'

export default async function InstitutionalClientsPage() {
  const ok = await verifyAdminSession()
  if (!ok) redirect('/admin/login?next=/admin/institutional/clients')

  const clients = await prisma.institutionalClient.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { orders: true } } },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-primary-600 hover:underline">← Admin home</Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Institutional Clients</h1>
            <p className="text-sm text-gray-600 mt-1">B2B accounts that send blood draw kits across multiple states.</p>
          </div>
        </div>

        {/* Add Client form */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Client</h2>
          <form action={createClient} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></span>
              <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Contact email <span className="text-red-500">*</span></span>
              <input name="contactEmail" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1">CC emails <span className="text-gray-400 font-normal">(comma-separated, optional)</span></span>
              <input name="ccEmails" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1">Notes</span>
              <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Create Client
              </button>
            </div>
          </form>
        </section>

        {/* Clients list */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Clients ({clients.length})</h2>
          </div>
          {clients.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No clients yet. Add one above.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {clients.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/institutional/clients/${c.id}`}
                    className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500 truncate">{c.contactEmail}</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 ml-4 shrink-0">
                      <span>{c._count.orders} order{c._count.orders === 1 ? '' : 's'}</span>
                      <span aria-hidden>→</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
