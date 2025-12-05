'use client'

import { useState, useEffect } from 'react'

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
  status: string
  routedToId: string | null
  routedAt: string | null
  priceCents: number
  provider?: {
    name: string
  }
}

export function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'delivered'>('all')

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
    if (filter === 'delivered') return lead.status === 'DELIVERED'
    return true
  })

  const newLeads = leads.filter(l => l.status === 'NEW')
  const deliveredLeads = leads.filter(l => l.status === 'DELIVERED')

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
      <div className="mb-6 flex gap-4 text-sm">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg border ${
            filter === 'all'
              ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Leads: {leads.length}
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-lg border ${
            filter === 'new'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800 font-medium'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Unserved: {newLeads.length}
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`px-4 py-2 rounded-lg border ${
            filter === 'delivered'
              ? 'bg-green-50 border-green-200 text-green-800 font-medium'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Delivered: {deliveredLeads.length}
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

            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedLead?.id === lead.id ? 'ring-2 ring-primary-500' : ''
                }`}
              }
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
                        → Routed to: {lead.provider.name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        lead.status === 'NEW'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {lead.status === 'NEW' ? 'Unserved' : 'Delivered'}
                    </span>
                    {lead.urgency === 'STAT' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                        STAT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  {selectedLead.provider ? (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        <strong>✓ Delivered to:</strong> {selectedLead.provider.name}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Routed: {selectedLead.routedAt ? new Date(selectedLead.routedAt).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠ Unserved Lead</strong>
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        No provider found in {selectedLead.city}, {selectedLead.state}
                      </p>
                    </div>
                  )}
                </div>

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
