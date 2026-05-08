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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Coverage Requests</h2>
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No coverage requests yet.
              </div>
            )}
            {requests.map(r => (
              <div
                key={r.id}
                onClick={() => setSelected(r)}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
                  selected?.id === r.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{r.organizationName}</h3>
                    <p className="text-sm text-gray-600 truncate">{r.location}</p>
                    <p className="text-sm text-gray-600">Timeline: {r.timeline}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(r.status)}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
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
