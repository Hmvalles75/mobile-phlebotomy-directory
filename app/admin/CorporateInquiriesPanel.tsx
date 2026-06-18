'use client'

import { useState, useEffect } from 'react'

interface CoverageRequest {
  id: string
  createdAt: string
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
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'BOOKED' | 'COMPLETED' | 'DECLINED'
  ipAddress?: string | null
  userAgent?: string | null
  utmSource?: string | null
  referrer?: string | null
  landingPage?: string | null
}

const STATUS_OPTIONS = [
  { value: 'NEW',       label: 'New',       color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'QUOTED',    label: 'Quoted',    color: 'bg-purple-100 text-purple-800' },
  { value: 'BOOKED',    label: 'Booked',    color: 'bg-green-100 text-green-800' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  { value: 'DECLINED',  label: 'Declined',  color: 'bg-red-100 text-red-800' },
]

const NEW_STALE_DAYS = 2
const CONTACTED_STALE_DAYS = 7

/**
 * Returns the staleness flag for a request based on age and status.
 * NEW > 2d: not yet contacted, getting cold
 * CONTACTED > 7d: conversation went cold, no progress
 * Anything past 30d in NEW/CONTACTED: critical
 */
function getStaleness(createdAt: string, status: string): { kind: 'critical' | 'stale' | 'fresh'; ageDays: number } {
  const ageDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000))
  if (status !== 'NEW' && status !== 'CONTACTED') return { kind: 'fresh', ageDays }
  if (ageDays > 30) return { kind: 'critical', ageDays }
  if (status === 'NEW' && ageDays >= NEW_STALE_DAYS) return { kind: 'stale', ageDays }
  if (status === 'CONTACTED' && ageDays >= CONTACTED_STALE_DAYS) return { kind: 'stale', ageDays }
  return { kind: 'fresh', ageDays }
}

export function CorporateInquiriesPanel() {
  const [requests, setRequests] = useState<CoverageRequest[]>([])
  const [selected, setSelected] = useState<CoverageRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      if (data.success) setRequests(data.inquiries)
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

  const getStatusColor = (status: string) =>
    STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800'

  const grouped = {
    new: requests.filter(r => r.status === 'NEW'),
    contacted: requests.filter(r => r.status === 'CONTACTED'),
    quoted: requests.filter(r => r.status === 'QUOTED'),
    booked: requests.filter(r => r.status === 'BOOKED'),
    completed: requests.filter(r => r.status === 'COMPLETED'),
    declined: requests.filter(r => r.status === 'DECLINED'),
  }

  // Surface stale/critical requests to the top. Within each band, preserve recency order.
  const sortedRequests = [...requests].sort((a, b) => {
    const sa = getStaleness(a.createdAt, a.status)
    const sb = getStaleness(b.createdAt, b.status)
    const rank = (kind: string) => (kind === 'critical' ? 0 : kind === 'stale' ? 1 : 2)
    const diff = rank(sa.kind) - rank(sb.kind)
    if (diff !== 0) return diff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const attentionCount = requests.filter(r => {
    const s = getStaleness(r.createdAt, r.status)
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
          <span className="font-medium text-purple-800 text-sm">Quoted: </span>
          <span className="text-purple-900 font-bold text-lg">{grouped.quoted.length}</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <span className="font-medium text-green-800 text-sm">Booked: </span>
          <span className="text-green-900 font-bold text-lg">{grouped.booked.length}</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <span className="font-medium text-gray-800 text-sm">Completed: </span>
          <span className="text-gray-900 font-bold text-lg">{grouped.completed.length}</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span className="font-medium text-red-800 text-sm">Declined: </span>
          <span className="text-red-900 font-bold text-lg">{grouped.declined.length}</span>
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
              const staleness = getStaleness(r.createdAt, r.status)
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
                        {new Date(r.createdAt).toLocaleString()}
                        <span className="ml-2 text-gray-400">· {staleness.ageDays}d ago</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(r.status)}`}>
                        {r.status}
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
                    {STATUS_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                </div>

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
