'use client'

import { useState, useEffect } from 'react'

interface LeadNotification {
  id: string
  providerId: string
  providerName: string
  status: 'QUEUED' | 'SENT' | 'FAILED'
  sentAt: string | null
  errorMessage: string | null
}

interface Lead {
  id: string
  createdAt: string
  fullName: string
  phone: string
  email: string | null
  address1: string | null
  city: string
  state: string
  zip: string
  urgency: 'STANDARD' | 'STAT'
  notes: string | null
  status: 'NEW' | 'OPEN' | 'CLAIMED' | 'DELIVERED' | 'REFUNDED' | 'UNSOLD'
  routedToId: string | null
  routedAt: string | null
  priceCents: number
  // Provider tracking fields
  claimedAt: string | null
  firstContactAt: string | null
  callAttempts: number
  outcome: 'CONTACTED' | 'APPOINTMENT_BOOKED' | 'APPOINTMENT_COMPLETED' | 'NO_ANSWER' | 'VOICEMAIL' | 'DECLINED' | 'WRONG_NUMBER' | 'DUPLICATE' | 'NOT_INTERESTED' | 'SCHEDULED_CALLBACK' | null
  outcomeNotes: string | null
  appointmentDate: string | null
  completedAt: string | null
  providerNotes: string | null
  provider?: {
    id: string
    name: string
    email: string | null
    claimEmail: string | null
  }
  notifications?: LeadNotification[]
}

export function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'open' | 'claimed' | 'delivered' | 'unsold'>('all')

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/leads', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })

      if (!res.ok) {
        console.error('Failed to load leads')
        return
      }

      const data = await res.json()
      if (data.success) {
        setLeads(data.leads)
      }
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLeads = leads.filter(lead => {
    if (filter === 'new') return lead.status === 'NEW'
    if (filter === 'open') return lead.status === 'OPEN'
    if (filter === 'claimed') return lead.status === 'CLAIMED'
    if (filter === 'delivered') return lead.status === 'DELIVERED'
    if (filter === 'unsold') return lead.status === 'UNSOLD'
    return true
  })

  const newLeads = leads.filter(l => l.status === 'NEW')
  const openLeads = leads.filter(l => l.status === 'OPEN')
  const claimedLeads = leads.filter(l => l.status === 'CLAIMED')
  const deliveredLeads = leads.filter(l => l.status === 'DELIVERED')
  const unsoldLeads = leads.filter(l => l.status === 'UNSOLD')

  // Helper to get status badge info
  const getStatusInfo = (status: Lead['status']) => {
    switch (status) {
      case 'NEW':
        return { label: 'New', color: 'bg-blue-100 text-blue-800', description: 'Just received' }
      case 'OPEN':
        return { label: 'Open', color: 'bg-purple-100 text-purple-800', description: 'Notified to providers' }
      case 'CLAIMED':
        return { label: 'Claimed', color: 'bg-yellow-100 text-yellow-800', description: 'Provider claimed' }
      case 'DELIVERED':
        return { label: 'Delivered', color: 'bg-green-100 text-green-800', description: 'Routed to provider' }
      case 'UNSOLD':
        return { label: 'Unsold', color: 'bg-gray-100 text-gray-800', description: 'No provider found' }
      case 'REFUNDED':
        return { label: 'Refunded', color: 'bg-red-100 text-red-800', description: 'Refunded' }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', description: '' }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">Loading leads...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg border ${
            filter === 'all'
              ? 'bg-gray-100 border-gray-300 text-gray-900 font-semibold'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All: {leads.length}
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-lg border ${
            filter === 'new'
              ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          New: {newLeads.length}
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded-lg border ${
            filter === 'open'
              ? 'bg-purple-50 border-purple-200 text-purple-800 font-semibold'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Open: {openLeads.length}
        </button>
        <button
          onClick={() => setFilter('claimed')}
          className={`px-4 py-2 rounded-lg border ${
            filter === 'claimed'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800 font-semibold'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Claimed: {claimedLeads.length}
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`px-4 py-2 rounded-lg border ${
            filter === 'delivered'
              ? 'bg-green-50 border-green-200 text-green-800 font-semibold'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Delivered: {deliveredLeads.length}
        </button>
        <button
          onClick={() => setFilter('unsold')}
          className={`px-4 py-2 rounded-lg border ${
            filter === 'unsold'
              ? 'bg-gray-50 border-gray-300 text-gray-800 font-semibold'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Unsold: {unsoldLeads.length}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Leads List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Blood Draw Requests</h2>

          <div className="space-y-3">
            {filteredLeads.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No leads found
              </div>
            )}

            {filteredLeads.map((lead) => {
              const statusInfo = getStatusInfo(lead.status)
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedLead?.id === lead.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{lead.fullName}</h3>
                      <p className="text-sm text-gray-600">{lead.city}, {lead.state} {lead.zip}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(lead.createdAt).toLocaleString()}
                      </p>
                      {lead.provider && (
                        <p className="text-xs text-green-600 mt-1">
                          → {lead.provider.name}
                        </p>
                      )}
                      {lead.notifications && lead.notifications.length > 0 && (
                        <p className="text-xs text-purple-600 mt-1">
                          ✉ {lead.notifications.length} notification{lead.notifications.length > 1 ? 's' : ''} sent
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {lead.urgency === 'STAT' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-semibold">
                          STAT
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Lead Details */}
        <div>
          {selectedLead ? (
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Patient Name</label>
                  <p className="text-gray-900 font-medium">{selectedLead.fullName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">
                      <a href={`tel:${selectedLead.phone}`} className="text-primary-600 hover:underline">
                        {selectedLead.phone}
                      </a>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900 text-sm">
                      {selectedLead.email ? (
                        <a href={`mailto:${selectedLead.email}`} className="text-primary-600 hover:underline">
                          {selectedLead.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">Not provided</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">
                    {selectedLead.address1 && `${selectedLead.address1}, `}
                    {selectedLead.city}, {selectedLead.state} {selectedLead.zip}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Urgency</label>
                    <p className={`text-gray-900 font-medium ${selectedLead.urgency === 'STAT' ? 'text-red-600' : ''}`}>
                      {selectedLead.urgency === 'STAT' ? 'STAT (Urgent)' : 'Standard (24-48 hrs)'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Lead Value</label>
                    <p className="text-gray-900 font-medium">
                      ${(selectedLead.priceCents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                {selectedLead.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedLead.notes}
                    </p>
                  </div>
                )}

                {/* Pipeline Status Tracker */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500 mb-3 block">Lead Pipeline</label>

                  {/* Visual Pipeline */}
                  <div className="space-y-3">
                    {/* Step 1: Received */}
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedLead.status ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
                      }`}>
                        {selectedLead.status ? '✓' : '1'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Lead Received</p>
                        <p className="text-xs text-gray-500">
                          {new Date(selectedLead.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Notifications Sent */}
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedLead.notifications && selectedLead.notifications.length > 0
                          ? 'bg-green-500 text-white'
                          : selectedLead.status === 'NEW'
                          ? 'bg-gray-300 text-gray-500'
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {selectedLead.notifications && selectedLead.notifications.length > 0 ? '✓' : '2'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Providers Notified</p>
                        {selectedLead.notifications && selectedLead.notifications.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {selectedLead.notifications.map((notif, idx) => (
                              <div key={notif.id} className="text-xs bg-purple-50 border border-purple-200 rounded px-2 py-1">
                                <span className="font-medium text-purple-900">{notif.providerName}</span>
                                <span className={`ml-2 ${
                                  notif.status === 'SENT' ? 'text-green-600' :
                                  notif.status === 'FAILED' ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  ({notif.status})
                                </span>
                                {notif.sentAt && (
                                  <span className="ml-2 text-gray-500">
                                    {new Date(notif.sentAt).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No notifications sent yet</p>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Claimed/Routed */}
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedLead.status === 'CLAIMED' || selectedLead.status === 'DELIVERED'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-500'
                      }`}>
                        {selectedLead.status === 'CLAIMED' || selectedLead.status === 'DELIVERED' ? '✓' : '3'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {selectedLead.status === 'CLAIMED' ? 'Claimed by Provider' : 'Routed to Provider'}
                        </p>
                        {selectedLead.provider ? (
                          <div className="mt-1">
                            <p className="text-xs text-green-700 font-medium">{selectedLead.provider.name}</p>
                            {selectedLead.routedAt && (
                              <p className="text-xs text-gray-500">
                                {new Date(selectedLead.routedAt).toLocaleString()}
                              </p>
                            )}
                            {selectedLead.claimedAt && (
                              <p className="text-xs text-blue-600">
                                Claimed: {new Date(selectedLead.claimedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Awaiting provider response</p>
                        )}
                      </div>
                    </div>

                    {/* Current Status Badge */}
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Current Status:</span>
                        <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${
                          getStatusInfo(selectedLead.status).color
                        }`}>
                          {getStatusInfo(selectedLead.status).label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getStatusInfo(selectedLead.status).description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Provider Tracking & Outcome */}
                {(selectedLead.claimedAt || selectedLead.outcome) && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-500 mb-3 block">📊 Provider Tracking</label>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      {/* Call Attempts */}
                      {selectedLead.callAttempts > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Call Attempts:</span>
                          <span className="text-sm font-semibold text-blue-900">{selectedLead.callAttempts}</span>
                        </div>
                      )}

                      {/* First Contact */}
                      {selectedLead.firstContactAt && (
                        <div>
                          <span className="text-xs text-gray-600">First Contact:</span>
                          <p className="text-sm text-gray-900">{new Date(selectedLead.firstContactAt).toLocaleString()}</p>
                        </div>
                      )}

                      {/* Outcome */}
                      {selectedLead.outcome && (
                        <div className="pt-2 border-t border-blue-300">
                          <span className="text-xs text-gray-600">Outcome:</span>
                          <p className={`text-sm font-semibold mt-1 ${
                            selectedLead.outcome === 'APPOINTMENT_COMPLETED' ? 'text-green-700' :
                            selectedLead.outcome === 'APPOINTMENT_BOOKED' ? 'text-blue-700' :
                            selectedLead.outcome === 'CONTACTED' ? 'text-purple-700' :
                            selectedLead.outcome === 'NO_ANSWER' || selectedLead.outcome === 'VOICEMAIL' ? 'text-yellow-700' :
                            'text-red-700'
                          }`}>
                            {selectedLead.outcome.replace(/_/g, ' ')}
                          </p>
                        </div>
                      )}

                      {/* Appointment Date */}
                      {selectedLead.appointmentDate && (
                        <div className="pt-2">
                          <span className="text-xs text-gray-600">Appointment Scheduled:</span>
                          <p className="text-sm font-medium text-green-700">{new Date(selectedLead.appointmentDate).toLocaleString()}</p>
                        </div>
                      )}

                      {/* Outcome Notes */}
                      {selectedLead.outcomeNotes && (
                        <div className="pt-2">
                          <span className="text-xs text-gray-600">Outcome Notes:</span>
                          <p className="text-sm text-gray-900 bg-white p-2 rounded border border-blue-200 mt-1">
                            {selectedLead.outcomeNotes}
                          </p>
                        </div>
                      )}

                      {/* Provider Notes */}
                      {selectedLead.providerNotes && (
                        <div className="pt-2">
                          <span className="text-xs text-gray-600">Provider Notes:</span>
                          <p className="text-sm text-gray-900 bg-white p-2 rounded border border-blue-200 mt-1">
                            {selectedLead.providerNotes}
                          </p>
                        </div>
                      )}

                      {/* Completed */}
                      {selectedLead.completedAt && (
                        <div className="pt-2 border-t border-blue-300">
                          <span className="text-xs text-gray-600">✅ Service Completed:</span>
                          <p className="text-sm font-semibold text-green-700">{new Date(selectedLead.completedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {!selectedLead.outcome && selectedLead.claimedAt && (
                      <p className="text-xs text-gray-500 mt-2 italic">Provider has claimed this lead. Awaiting outcome update via email/SMS.</p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">Submitted</label>
                  <p className="text-gray-900 text-sm">
                    {new Date(selectedLead.createdAt).toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Lead ID: {selectedLead.id}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select a lead to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
