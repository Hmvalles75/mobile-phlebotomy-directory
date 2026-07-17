'use client'

import { useState, useEffect } from 'react'

interface ContactAttempt {
  id: string
  channel: string
  direction: string
  subject?: string | null
  note?: string | null
  occurredAt: string
  createdAt: string
}

interface CoverageRequest {
  id: string
  createdAt: string
  lastContactedAt?: string | null
  organizationName: string
  contactName: string
  email: string
  phone: string
  location: string
  statesNeeded?: string | null
  timeline: string
  estimatedVolume: string
  drawType: string
  details?: string | null
  status: string
  contactAttempts?: ContactAttempt[]
  ipAddress?: string | null
  userAgent?: string | null
  utmSource?: string | null
  referrer?: string | null
  landingPage?: string | null
}

// Editable pipeline stages shown in the UI. Legacy values
// (QUOTED/BOOKED/COMPLETED/DECLINED) are hidden here but still rendered via
// STATUS_DISPLAY if an old row carries one.
const STATUS_OPTIONS = [
  { value: 'NEW',           label: 'New',           color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED',     label: 'Contacted',     color: 'bg-yellow-100 text-yellow-800' },
  { value: 'IN_DISCUSSION', label: 'In discussion', color: 'bg-purple-100 text-purple-800' },
  { value: 'WON',           label: 'Won',           color: 'bg-green-100 text-green-800' },
  { value: 'LOST',          label: 'Lost',          color: 'bg-gray-100 text-gray-800' },
  { value: 'DEAD',          label: 'Dead',          color: 'bg-red-100 text-red-800' },
]
const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  ...Object.fromEntries(STATUS_OPTIONS.map(o => [o.value, { label: o.label, color: o.color }])),
  QUOTED:    { label: 'Quoted (legacy)',    color: 'bg-purple-100 text-purple-800' },
  BOOKED:    { label: 'Booked (legacy)',    color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Completed (legacy)', color: 'bg-gray-100 text-gray-800' },
  DECLINED:  { label: 'Declined (legacy)',  color: 'bg-red-100 text-red-800' },
}

const NEW_STALE_DAYS = 2
const CONTACTED_STALE_DAYS = 7

// Staleness reference time = last logged contact if any, else submission time.
// This is the whole point of the contact log: once you log outreach (or send
// from the app), the clock resets to real activity instead of createdAt.
function getStaleness(r: CoverageRequest): { kind: 'critical' | 'stale' | 'fresh'; ageDays: number } {
  const ref = new Date(r.lastContactedAt || r.createdAt).getTime()
  const ageDays = Math.floor((Date.now() - ref) / (24 * 60 * 60 * 1000))
  const active = r.status === 'NEW' || r.status === 'CONTACTED'
  if (!active) return { kind: 'fresh', ageDays }
  if (ageDays > 30) return { kind: 'critical', ageDays }
  if (r.status === 'NEW' && ageDays >= NEW_STALE_DAYS) return { kind: 'stale', ageDays }
  if (r.status === 'CONTACTED' && ageDays >= CONTACTED_STALE_DAYS) return { kind: 'stale', ageDays }
  return { kind: 'fresh', ageDays }
}

export function CorporateInquiriesPanel() {
  const [requests, setRequests] = useState<CoverageRequest[]>([])
  const [selected, setSelected] = useState<CoverageRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  // Log-contact form + email compose
  const [logOpen, setLogOpen] = useState(false)
  const [logForm, setLogForm] = useState({ channel: 'EMAIL', direction: 'OUTBOUND', date: '', note: '' })
  const [logSubmitting, setLogSubmitting] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' })
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('admin_token')
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  }

  const loadRequests = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/corporate-inquiries', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        console.error('Failed to load coverage requests')
        return
      }
      const data = await res.json()
      if (data.success) {
        setRequests(data.inquiries)
        // Keep the open detail pane in sync with refreshed data (status,
        // lastContactedAt, contact history) after any mutation.
        setSelected(prev => (prev ? data.inquiries.find((x: CoverageRequest) => x.id === prev.id) || null : null))
      }
    } catch (error) {
      console.error('Failed to load coverage requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRequests() }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/corporate-inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as CoverageRequest['status'] } : r))
        if (selected?.id === id) setSelected({ ...selected, status: newStatus as CoverageRequest['status'] })
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this coverage request?')) return
    setActionLoading(id)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/corporate-inquiries/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        loadRequests()
        setSelected(null)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const logContact = async () => {
    if (!selected) return
    setLogSubmitting(true)
    try {
      const res = await fetch(`/api/admin/corporate-inquiries/${selected.id}/contact`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          channel: logForm.channel,
          direction: logForm.direction,
          note: logForm.note || null,
          occurredAt: logForm.date ? new Date(logForm.date).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setLogOpen(false)
        setLogForm({ channel: 'EMAIL', direction: 'OUTBOUND', date: '', note: '' })
        await loadRequests()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLogSubmitting(false)
    }
  }

  const sendEmail = async () => {
    if (!selected) return
    setEmailSending(true)
    setEmailError(null)
    try {
      const res = await fetch(`/api/admin/corporate-inquiries/${selected.id}/email`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ subject: emailForm.subject, body: emailForm.body }),
      })
      const data = await res.json()
      if (data.success) {
        // Only on confirmed send: close, reset, refresh (the row was written server-side).
        setEmailOpen(false)
        setEmailForm({ subject: '', body: '' })
        await loadRequests()
      } else {
        // Failed send — surface the error, keep the modal open, nothing was written.
        setEmailError(data.error || 'Failed to send email.')
      }
    } catch {
      setEmailError('Network error — email not sent. Please try again.')
    } finally {
      setEmailSending(false)
    }
  }

  const getStatusColor = (status: string) =>
    STATUS_DISPLAY[status]?.color || 'bg-gray-100 text-gray-800'
  const getStatusLabel = (status: string) =>
    STATUS_DISPLAY[status]?.label || status

  const grouped = {
    new: requests.filter(r => r.status === 'NEW'),
    contacted: requests.filter(r => r.status === 'CONTACTED'),
    inDiscussion: requests.filter(r => r.status === 'IN_DISCUSSION'),
    won: requests.filter(r => r.status === 'WON'),
    // Legacy DECLINED folded into Lost for the stat tiles.
    lost: requests.filter(r => r.status === 'LOST' || r.status === 'DECLINED'),
    dead: requests.filter(r => r.status === 'DEAD'),
  }

  // Surface stale/critical requests to the top. Within each band, preserve recency order.
  const sortedRequests = [...requests].sort((a, b) => {
    const sa = getStaleness(a)
    const sb = getStaleness(b)
    const rank = (kind: string) => (kind === 'critical' ? 0 : kind === 'stale' ? 1 : 2)
    const diff = rank(sa.kind) - rank(sb.kind)
    if (diff !== 0) return diff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const attentionCount = requests.filter(r => {
    const s = getStaleness(r)
    return s.kind === 'critical' || s.kind === 'stale' || r.status === 'NEW'
  }).length

  if (loading && requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading coverage requests...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="font-medium text-blue-800 text-sm">New: </span>
          <span className="text-blue-900 font-bold text-lg">{grouped.new.length}</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <span className="font-medium text-yellow-800 text-sm">Contacted: </span>
          <span className="text-yellow-900 font-bold text-lg">{grouped.contacted.length}</span>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
          <span className="font-medium text-purple-800 text-sm">In discussion: </span>
          <span className="text-purple-900 font-bold text-lg">{grouped.inDiscussion.length}</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <span className="font-medium text-green-800 text-sm">Won: </span>
          <span className="text-green-900 font-bold text-lg">{grouped.won.length}</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <span className="font-medium text-gray-800 text-sm">Lost: </span>
          <span className="text-gray-900 font-bold text-lg">{grouped.lost.length}</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span className="font-medium text-red-800 text-sm">Dead: </span>
          <span className="text-red-900 font-bold text-lg">{grouped.dead.length}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8 items-start">
        {/* List */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Coverage Requests</h2>
            {attentionCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 text-xs font-bold rounded-full bg-red-600 text-white">
                {attentionCount} need attention
              </span>
            )}
          </div>
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No coverage requests yet.
              </div>
            )}
            {sortedRequests.map(r => {
              const staleness = getStaleness(r)
              const isStale = staleness.kind === 'stale'
              const isCritical = staleness.kind === 'critical'
              const ringClass = selected?.id === r.id
                ? 'ring-2 ring-primary-500'
                : isCritical
                  ? 'ring-2 ring-red-400'
                  : isStale
                    ? 'ring-1 ring-amber-300'
                    : ''
              return (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${ringClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{r.organizationName}</h3>
                      <p className="text-sm text-gray-600 truncate">{r.location}</p>
                      <p className="text-sm text-gray-600">Timeline: {r.timeline}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {r.lastContactedAt
                          ? `Last contact: ${new Date(r.lastContactedAt).toLocaleDateString()}`
                          : `Submitted: ${new Date(r.createdAt).toLocaleDateString()}`}
                        <span className="ml-2 text-gray-400">· {staleness.ageDays}d ago</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(r.status)}`}>
                        {getStatusLabel(r.status)}
                      </span>
                      {isCritical && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white whitespace-nowrap">
                          🔥 CRITICAL
                        </span>
                      )}
                      {isStale && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 whitespace-nowrap">
                          ⚠ STALE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className={
          selected
            ? 'fixed inset-0 z-50 bg-black/50 flex items-end md:items-start justify-center md:static md:z-auto md:bg-transparent md:block'
            : 'hidden md:block'
        }>
          {selected ? (
            <div className="bg-white rounded-t-lg md:rounded-lg shadow-2xl md:shadow p-6 md:sticky md:top-4 w-full md:w-auto max-h-[90vh] md:max-h-[calc(100vh-2rem)] overflow-y-auto relative">
              <button
                onClick={() => setSelected(null)}
                className="md:hidden absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                aria-label="Close details"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Coverage Request</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                    disabled={actionLoading === selected.id}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {/* Keep a legacy status selectable if the row still carries one */}
                    {!STATUS_OPTIONS.some(o => o.value === selected.status) && (
                      <option value={selected.status}>{getStatusLabel(selected.status)}</option>
                    )}
                    {STATUS_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    {selected.lastContactedAt
                      ? `Last contacted ${new Date(selected.lastContactedAt).toLocaleString()}`
                      : 'No contact logged yet'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setEmailError(null); setEmailForm({ subject: `Coverage for ${selected.organizationName}`, body: '' }); setEmailOpen(true) }}
                    className="px-3 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                  >
                    ✉️ Email this lead
                  </button>
                  <button
                    onClick={() => setLogOpen(v => !v)}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    📝 Log contact
                  </button>
                </div>

                {/* Log contact form */}
                {logOpen && (
                  <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <select value={logForm.channel} onChange={e => setLogForm(f => ({ ...f, channel: e.target.value }))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                        <option value="EMAIL">Email</option>
                        <option value="PHONE">Phone</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <select value={logForm.direction} onChange={e => setLogForm(f => ({ ...f, direction: e.target.value }))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                        <option value="OUTBOUND">Outbound</option>
                        <option value="INBOUND">Inbound</option>
                      </select>
                    </div>
                    <input type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                    <p className="text-[11px] text-gray-400 -mt-1">Leave date blank for today. Back-date for past outreach.</p>
                    <textarea value={logForm.note} onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))} placeholder="Note (optional)" rows={2} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                    <div className="flex gap-2">
                      <button onClick={logContact} disabled={logSubmitting} className="px-3 py-1.5 text-sm rounded bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50">
                        {logSubmitting ? 'Saving…' : 'Save contact'}
                      </button>
                      <button onClick={() => setLogOpen(false)} className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Organization</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Organization</label>
                    <p className="text-gray-900">{selected.organizationName}</p>
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-500">Contact</label>
                    <p className="text-gray-900">{selected.contactName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <a href={`mailto:${selected.email}`} className="text-primary-600 hover:underline text-sm block break-all">{selected.email}</a>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <a href={`tel:${selected.phone}`} className="text-primary-600 hover:underline text-sm block">{selected.phone}</a>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Coverage Need</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{selected.location}</p>
                  </div>
                  {selected.statesNeeded && (
                    <div className="mt-3">
                      <label className="text-sm font-medium text-gray-500">States needed</label>
                      <p className="text-gray-900">{selected.statesNeeded}</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-500">Timeline</label>
                    <p className="text-gray-900">{selected.timeline}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estimated volume</label>
                      <p className="text-gray-900">{selected.estimatedVolume}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Draw type</label>
                      <p className="text-gray-900">{selected.drawType}</p>
                    </div>
                  </div>
                  {selected.details && (
                    <div className="mt-3">
                      <label className="text-sm font-medium text-gray-500">Details</label>
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">{selected.details}</p>
                    </div>
                  )}
                </div>

                {selected.contactAttempts && selected.contactAttempts.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Contact history ({selected.contactAttempts.length})</h3>
                    <ul className="space-y-2">
                      {selected.contactAttempts.map(c => (
                        <li key={c.id} className="text-sm border border-gray-200 rounded p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-700">
                              {c.direction === 'INBOUND' ? '↙︎ In' : '↗︎ Out'} · {c.channel}
                            </span>
                            <span className="text-xs text-gray-400">{new Date(c.occurredAt).toLocaleString()}</span>
                          </div>
                          {c.subject && <p className="text-gray-800 mt-1 font-medium">{c.subject}</p>}
                          {c.note && <p className="text-gray-600 mt-1 whitespace-pre-wrap line-clamp-4" title={c.note}>{c.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t pt-4 mt-4 text-xs text-gray-500 space-y-1">
                  <p>Submitted: {new Date(selected.createdAt).toLocaleString()}</p>
                  {selected.landingPage && <p>Landing page: {selected.landingPage}</p>}
                  {selected.utmSource && <p>Source: {selected.utmSource}</p>}
                  {selected.referrer && <p>Referrer: {selected.referrer}</p>}
                  {selected.ipAddress && <p>IP: {selected.ipAddress}</p>}
                </div>

                <button
                  onClick={() => handleDelete(selected.id)}
                  disabled={actionLoading === selected.id}
                  className="w-full mt-4 text-sm text-red-600 hover:text-red-800 py-2 disabled:opacity-50"
                >
                  Delete Permanently
                </button>

                {/* Email compose modal. On a failed send the error is shown here
                    and the modal stays open — nothing is written server-side. */}
                {emailOpen && (
                  <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => !emailSending && setEmailOpen(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-5" onClick={e => e.stopPropagation()}>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Email {selected.organizationName}</h3>
                      <p className="text-xs text-gray-500 mb-3">To {selected.email} · from hector@mobilephlebotomy.org</p>
                      {emailError && (
                        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{emailError}</div>
                      )}
                      <input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} placeholder="Subject" className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm" />
                      <textarea value={emailForm.body} onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} placeholder="Message" rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setEmailOpen(false)} disabled={emailSending} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50">Cancel</button>
                        <button onClick={sendEmail} disabled={emailSending || !emailForm.subject.trim() || !emailForm.body.trim()} className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                          {emailSending ? 'Sending…' : 'Send email'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:block bg-white rounded-lg shadow p-6 text-center text-gray-500 sticky top-4">
              Select a coverage request to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
