import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams?: { days?: string }
}

const DOCTOR_ORDER_LABEL: Record<string, string> = {
  yes:       'Yes',
  no:        'No',
  need_help: 'Need help',
}
const PAYMENT_LABEL: Record<string, string> = {
  out_of_pocket: 'OK with OOP',
  insurance:     'Only if insurance',
  not_sure:      'Not sure',
}
const DOCTOR_ORDER_KEYS = ['yes', 'no', 'need_help', '(not set)'] as const
const PAYMENT_KEYS = ['out_of_pocket', 'insurance', 'not_sure', '(not set)'] as const

const CONVERTED_OUTCOMES = new Set(['APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED'])

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function pct(num: number, denom: number): string {
  if (!denom) return '—'
  return `${Math.round(100 * num / denom)}%`
}

export default async function LeadQualityPage({ searchParams }: Props) {
  const session = await verifyAdminSession()
  if (!session) redirect('/admin')

  const days = Math.max(1, Math.min(90, parseInt(searchParams?.days || '7', 10) || 7))
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: cutoff } },
    select: {
      id: true, createdAt: true,
      city: true, state: true, zip: true,
      urgency: true, status: true, claimedAt: true,
      outcome: true,
      hasDoctorOrder: true, paymentMethod: true,
      source: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const total = leads.length
  const claimed = leads.filter(l => l.claimedAt || l.status === 'CLAIMED' || l.status === 'DELIVERED').length
  const converted = leads.filter(l => l.outcome && CONVERTED_OUTCOMES.has(l.outcome)).length

  // Intent-answer distribution
  const byDoctor: Record<string, number> = { yes: 0, no: 0, need_help: 0, '(not set)': 0 }
  const byPayment: Record<string, number> = { out_of_pocket: 0, insurance: 0, not_sure: 0, '(not set)': 0 }
  for (const l of leads) {
    const d = l.hasDoctorOrder || '(not set)'
    const p = l.paymentMethod || '(not set)'
    byDoctor[d] = (byDoctor[d] || 0) + 1
    byPayment[p] = (byPayment[p] || 0) + 1
  }

  // 2-D conversion matrix: rows = doctorOrder, cols = paymentMethod
  // Cell = { total, claimed, converted }
  type Cell = { total: number; claimed: number; converted: number }
  const cells: Record<string, Record<string, Cell>> = {}
  for (const d of DOCTOR_ORDER_KEYS) {
    cells[d] = {}
    for (const p of PAYMENT_KEYS) {
      cells[d][p] = { total: 0, claimed: 0, converted: 0 }
    }
  }
  for (const l of leads) {
    const d = l.hasDoctorOrder || '(not set)'
    const p = l.paymentMethod || '(not set)'
    const c = cells[d]?.[p]
    if (!c) continue
    c.total++
    if (l.claimedAt || l.status === 'CLAIMED' || l.status === 'DELIVERED') c.claimed++
    if (l.outcome && CONVERTED_OUTCOMES.has(l.outcome)) c.converted++
  }

  const gated = leads.filter(l => l.hasDoctorOrder && l.paymentMethod).length
  const ungated = total - gated

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:underline">Admin</Link>
          {' › '}
          <span className="text-gray-700">Lead quality</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-6 gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lead quality — intent-gate breakdown</h1>
            <p className="text-sm text-gray-500 mt-1">
              Slicing leads by the two patient-intent answers (doctor's order, payment willingness)
              to see whether the gates are improving conversion.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {[7, 14, 30].map(d => (
              <Link
                key={d}
                href={`/admin/lead-quality?days=${d}`}
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

        {/* Headline numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <Stat label="Leads" value={total} />
          <Stat label="Claimed" value={claimed} sub={pct(claimed, total)} />
          <Stat label="Converted to appt" value={converted} sub={pct(converted, total)} />
          <Stat label="Gated (post-deploy)" value={gated} sub={pct(gated, total)} />
          <Stat label="Pre-gate (legacy)" value={ungated} sub={pct(ungated, total)} />
        </div>

        {/* Conversion matrix */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Conversion by intent combo</h2>
            <p className="text-xs text-gray-500 mt-1">
              Rows = doctor's order. Columns = payment willingness. Each cell shows <strong>total</strong>
              {' · '}<strong>claim%</strong>{' · '}<strong>appt%</strong>.
              Higher appt% = better-quality combo to invest in.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2"></th>
                  {PAYMENT_KEYS.map(p => (
                    <th key={p} className="text-left px-4 py-2">{PAYMENT_LABEL[p] || p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DOCTOR_ORDER_KEYS.map(d => (
                  <tr key={d}>
                    <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50 whitespace-nowrap">
                      {DOCTOR_ORDER_LABEL[d] || d}
                    </td>
                    {PAYMENT_KEYS.map(p => {
                      const c = cells[d]?.[p]
                      if (!c || c.total === 0) {
                        return <td key={p} className="px-4 py-3 text-gray-300">—</td>
                      }
                      const conv = c.converted
                      const conversionRate = c.total ? Math.round(100 * conv / c.total) : 0
                      const tone = conversionRate >= 25 ? 'bg-green-50' :
                                   conversionRate >= 10 ? 'bg-blue-50' :
                                   c.total >= 3 ? 'bg-amber-50' :
                                   ''
                      return (
                        <td key={p} className={`px-4 py-3 ${tone}`}>
                          <div className="font-medium text-gray-900">{c.total} lead{c.total !== 1 && 's'}</div>
                          <div className="text-xs text-gray-600">
                            claim {pct(c.claimed, c.total)} · appt {pct(c.converted, c.total)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor-order rollup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BreakdownCard title="By doctor's order" rows={
            DOCTOR_ORDER_KEYS.map(d => {
              const matching = leads.filter(l => (l.hasDoctorOrder || '(not set)') === d)
              const c = matching.filter(l => l.claimedAt || l.status === 'CLAIMED' || l.status === 'DELIVERED').length
              const conv = matching.filter(l => l.outcome && CONVERTED_OUTCOMES.has(l.outcome)).length
              return { label: DOCTOR_ORDER_LABEL[d] || d, total: matching.length, claimed: c, converted: conv }
            })
          }/>
          <BreakdownCard title="By payment willingness" rows={
            PAYMENT_KEYS.map(p => {
              const matching = leads.filter(l => (l.paymentMethod || '(not set)') === p)
              const c = matching.filter(l => l.claimedAt || l.status === 'CLAIMED' || l.status === 'DELIVERED').length
              const conv = matching.filter(l => l.outcome && CONVERTED_OUTCOMES.has(l.outcome)).length
              return { label: PAYMENT_LABEL[p] || p, total: matching.length, claimed: c, converted: conv }
            })
          }/>
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent leads ({leads.length})</h2>
            <p className="text-xs text-gray-500 mt-1">
              All leads in the window, sorted newest first. PHI redacted.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2">Created</th>
                  <th className="text-left px-4 py-2">Location</th>
                  <th className="text-left px-4 py-2">Urgency</th>
                  <th className="text-left px-4 py-2">Dr. order</th>
                  <th className="text-left px-4 py-2">Payment</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Outcome</th>
                  <th className="text-left px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map(l => {
                  const isConv = l.outcome && CONVERTED_OUTCOMES.has(l.outcome)
                  return (
                    <tr key={l.id} className={isConv ? 'bg-green-50' : ''}>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{fmt(l.createdAt)}</td>
                      <td className="px-4 py-2 text-gray-900">{l.city}, {l.state} {l.zip}</td>
                      <td className="px-4 py-2 text-gray-700">{l.urgency}</td>
                      <td className="px-4 py-2 text-gray-700">{l.hasDoctorOrder ? DOCTOR_ORDER_LABEL[l.hasDoctorOrder] || l.hasDoctorOrder : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2 text-gray-700">{l.paymentMethod ? PAYMENT_LABEL[l.paymentMethod] || l.paymentMethod : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2 text-gray-700">{l.status}</td>
                      <td className="px-4 py-2 text-gray-700">{l.outcome || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2">
                        <Link href={`/admin/lead-diagnostic/${l.id}`} className="text-blue-600 hover:underline text-xs whitespace-nowrap">
                          Diagnostic →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {leads.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No leads in this window.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}{sub && <span className="text-sm text-gray-500 font-normal ml-2">{sub}</span>}</div>
    </div>
  )
}

function BreakdownCard({ title, rows }: { title: string; rows: Array<{ label: string; total: number; claimed: number; converted: number }> }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-2">Answer</th>
            <th className="text-right px-4 py-2">Leads</th>
            <th className="text-right px-4 py-2">Claim %</th>
            <th className="text-right px-4 py-2">Appt %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(r => (
            <tr key={r.label}>
              <td className="px-4 py-2 text-gray-900">{r.label}</td>
              <td className="px-4 py-2 text-right font-medium text-gray-900">{r.total}</td>
              <td className="px-4 py-2 text-right text-gray-700">{pct(r.claimed, r.total)}</td>
              <td className="px-4 py-2 text-right text-gray-700">{pct(r.converted, r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
