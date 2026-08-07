'use client'

import { useMemo, useState } from 'react'
import type { RosterRow } from '@/lib/provider-roster'

type SortKey =
  | 'name' | 'state' | 'city' | 'tier' | 'radius'
  | 'metros' | 'notifications' | 'claims' | 'completions' | 'claimRate' | 'lastClaim'

type Preset = 'all' | 'routable' | 'paying' | 'dormant' | 'gaps'

const PRESETS: { key: Preset; label: string; hint: string }[] = [
  { key: 'all',      label: 'All',            hint: 'Every provider not soft-removed' },
  { key: 'routable', label: 'Routable',       hint: 'Would actually be emailed a lead somewhere' },
  { key: 'paying',   label: 'Paying',         hint: 'Priority routing (paid subscribers)' },
  { key: 'dormant',  label: 'Dormant',        hint: 'Sent leads, claimed none in the window' },
  { key: 'gaps',     label: 'Missing contact', hint: 'Activated but no email (silently unroutable), or no phone on file' },
]

function tierLabel(r: RosterRow): string {
  if (r.featuredTier) return r.featuredTier.replace(/_/g, ' ')
  if (r.isFeatured) return 'FEATURED'
  return r.listingTier || 'BASIC'
}

function tierRank(r: RosterRow): number {
  if (r.paying) return 3
  if (r.isFeatured || r.featuredTier) return 2
  if (r.listingTier === 'PREMIUM') return 1
  return 0
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function fmtPct(v: number | null): string {
  if (v === null) return '—'
  return `${Math.round(v * 100)}%`
}

export function ProviderRosterTable({ rows, windowDays }: { rows: RosterRow[]; windowDays: number }) {
  const [q, setQ] = useState('')
  const [preset, setPreset] = useState<Preset>('routable')
  const [state, setState] = useState('')
  const [sort, setSort] = useState<SortKey>('claims')
  const [asc, setAsc] = useState(false)

  const states = useMemo(
    () => Array.from(new Set(rows.map(r => r.primaryState).filter(Boolean) as string[])).sort(),
    [rows]
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let out = rows

    if (preset === 'routable') out = out.filter(r => r.routable)
    else if (preset === 'paying') out = out.filter(r => r.paying)
    else if (preset === 'dormant') out = out.filter(r => r.routable && r.notifications > 0 && r.claims === 0)
    else if (preset === 'gaps') out = out.filter(r => r.blockedNoEmail || (r.routable && !r.phone))

    if (state) out = out.filter(r => r.primaryState === state)

    if (needle) {
      out = out.filter(r =>
        r.name.toLowerCase().includes(needle) ||
        r.allEmails.some(e => e.toLowerCase().includes(needle)) ||
        (r.phone || '').toLowerCase().includes(needle) ||
        (r.primaryCity || '').toLowerCase().includes(needle) ||
        (r.primaryState || '').toLowerCase().includes(needle) ||
        (r.primaryZip || '').includes(needle) ||
        r.metrosReached.some(m => m.toLowerCase().includes(needle))
      )
    }

    const dir = asc ? 1 : -1
    const val = (r: RosterRow): number | string => {
      switch (sort) {
        case 'name':          return r.name.toLowerCase()
        case 'state':         return r.primaryState || 'zz'
        case 'city':          return (r.primaryCity || 'zz').toLowerCase()
        case 'tier':          return tierRank(r)
        case 'radius':        return r.serviceRadiusMiles ?? -1
        case 'metros':        return r.metrosReached.length
        case 'notifications': return r.notifications
        case 'claims':        return r.claims
        case 'completions':   return r.completions
        case 'claimRate':     return r.claimRate ?? -1
        case 'lastClaim':     return r.lastClaimAt ? new Date(r.lastClaimAt).getTime() : 0
      }
    }
    return [...out].sort((a, b) => {
      const av = val(a), bv = val(b)
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir
      }
      return (av - bv) * dir
    })
  }, [rows, q, preset, state, sort, asc])

  function toggleSort(k: SortKey) {
    if (sort === k) setAsc(!asc)
    else { setSort(k); setAsc(k === 'name' || k === 'city' || k === 'state') }
  }

  function exportCsv() {
    const cols = [
      'Name', 'Email', 'All emails', 'Phone', 'Website', 'Tier', 'Paying', 'Routable',
      'Claimed', 'City', 'State', 'Primary ZIP', 'Radius (mi)', 'ZIP count',
      'Coverage states', 'Metros reached', 'Metro list',
      `Notifications (${windowDays}d)`, `Claims (${windowDays}d)`, `Completions (${windowDays}d)`,
      'Claim rate', 'Last claim', 'Stale releases', 'Public page',
    ]
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [cols.join(',')]
    for (const r of filtered) {
      lines.push([
        r.name, r.email, r.allEmails.join(' | '), r.phone, r.website,
        tierLabel(r), r.paying ? 'yes' : 'no', r.routable ? 'yes' : 'no',
        r.claimed ? 'yes' : 'no',
        r.primaryCity, r.primaryState, r.primaryZip, r.serviceRadiusMiles, r.zipCount,
        r.coverageStates.join(' '), r.metrosReached.length, r.metrosReached.join(' | '),
        r.notifications, r.claims, r.completions, fmtPct(r.claimRate),
        r.lastClaimAt ? r.lastClaimAt.slice(0, 10) : '',
        r.staleReleaseCount,
        `https://www.mobilephlebotomy.org/provider/${r.slug}`,
      ].map(esc).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `provider-roster-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const Th = ({ k, children, right, title }: { k: SortKey; children: React.ReactNode; right?: boolean; title?: string }) => (
    <th
      onClick={() => toggleSort(k)}
      title={title}
      className={`px-3 py-2 cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}
    >
      {children}
      <span className="text-gray-400 ml-1">{sort === k ? (asc ? '▲' : '▼') : ''}</span>
    </th>
  )

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search name, email, phone, city, ZIP, metro…"
          className="flex-1 min-w-[260px] px-3 py-2 border border-gray-300 rounded text-sm"
        />
        <select
          value={state}
          onChange={e => setState(e.target.value)}
          className="px-2 py-2 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">All states</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={exportCsv}
          className="px-3 py-2 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 whitespace-nowrap"
        >
          Export CSV ({filtered.length})
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            title={p.hint}
            className={`px-2.5 py-1 text-xs rounded border ${
              preset === p.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-xs text-gray-500 self-center ml-2">
          {filtered.length} of {rows.length} providers
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
              <tr>
                <Th k="name">Provider</Th>
                <th className="text-left px-3 py-2">Contact</th>
                <Th k="city">Based</Th>
                <Th k="radius" right title="Service radius in miles">Radius</Th>
                <Th k="metros" right title="Top-50 metros this provider's radius reaches">Metros</Th>
                <Th k="tier">Tier</Th>
                <Th k="notifications" right title={`Lead notifications sent, last ${windowDays} days`}>Notif</Th>
                <Th k="claims" right title={`Leads claimed, last ${windowDays} days`}>Claims</Th>
                <Th k="completions" right title={`Leads completed, last ${windowDays} days`}>Done</Th>
                <Th k="claimRate" right title="Claims ÷ notifications">Rate</Th>
                <Th k="lastClaim" right title="Days since their most recent claim, all time">Last</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => {
                const since = daysSince(r.lastClaimAt)
                const dormant = r.routable && r.notifications > 0 && r.claims === 0
                return (
                  <tr key={r.id} className={dormant ? 'bg-amber-50' : r.paying ? 'bg-green-50' : ''}>
                    <td className="px-3 py-2">
                      <a
                        href={`https://www.mobilephlebotomy.org/provider/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        {r.name}
                      </a>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {r.paying && <Tag tone="green">paying</Tag>}
                        {r.blockedNoEmail && <Tag tone="amber">no email — blocked</Tag>}
                        {!r.routable && !r.blockedNoEmail && <Tag tone="gray">not routable</Tag>}
                        {r.claimed && <Tag tone="blue">claimed</Tag>}
                        {r.staleReleaseCount > 0 && <Tag tone="amber">{r.staleReleaseCount} stale</Tag>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {r.email
                        ? <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>
                        : <span className="text-red-600 font-medium">no email</span>}
                      <div className="text-gray-500">{r.phone || <span className="text-red-500">no phone</span>}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {r.primaryCity || '—'}
                      <span className="text-gray-400">, {r.primaryState || '?'}</span>
                      {r.primaryZip && <div className="text-xs text-gray-400">{r.primaryZip} · {r.zipCount} zips</div>}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">{r.serviceRadiusMiles ?? <span className="text-gray-300">—</span>}</td>
                    <td
                      className="px-3 py-2 text-right text-gray-700"
                      title={r.metrosReached.join(', ') || 'Reaches none of the top 50 metros'}
                    >
                      {r.metrosReached.length || <span className="text-gray-300">0</span>}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-700">{tierLabel(r)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{r.notifications || <span className="text-gray-300">0</span>}</td>
                    <td className={`px-3 py-2 text-right font-medium ${r.claims > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{r.claims}</td>
                    <td className={`px-3 py-2 text-right ${r.completions > 0 ? 'text-green-700 font-medium' : 'text-gray-300'}`}>{r.completions}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{fmtPct(r.claimRate)}</td>
                    <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">
                      {since === null ? <span className="text-gray-300">never</span> : `${since}d`}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-400">No providers match those filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Tag({ children, tone }: { children: React.ReactNode; tone: 'green' | 'gray' | 'blue' | 'amber' }) {
  const cls = {
    green: 'bg-green-100 text-green-800',
    gray:  'bg-gray-100 text-gray-600',
    blue:  'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
  }[tone]
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${cls}`}>{children}</span>
}
