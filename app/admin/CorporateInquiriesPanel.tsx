'use client'

import { useState, useEffect } from 'react'

interface CorporateInquiry {
  id: string
  createdAt: string
  companyName: string
  contactName: string
  email: string
  phone: string
  eventLocation: string
  eventVenue?: string
  eventDates: string
  estimatedDraws: string
  estimatedPhlebotomists?: string
  eventType: string
  additionalDetails?: string
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'BOOKED' | 'COMPLETED' | 'DECLINED'
  ipAddress?: string
  userAgent?: string
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'QUOTED', label: 'Quoted', color: 'bg-purple-100 text-purple-800' },
  { value: 'BOOKED', label: 'Booked', color: 'bg-green-100 text-green-800' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  { value: 'DECLINED', label: 'Declined', color: 'bg-red-100 text-red-800' },
]

export function CorporateInquiriesPanel() {
  const [inquiries, setInquiries] = useState<CorporateInquiry[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<CorporateInquiry | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadInquiries = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/corporate-inquiries', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })

      if (!res.ok) {
        console.error('Failed to load inquiries')
        return
      }

      const data = await res.json()
      if (data.success) {
        setInquiries(data.inquiries)
      }
    } catch (error) {
      console.error('Failed to load inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInquiries()
  }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/corporate-inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()

      if (data.success) {
        await loadInquiries()
        // Update selected inquiry if it's the one we just changed
        if (selectedInquiry?.id === id) {
          setSelectedInquiry(data.inquiry)
        }
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this inquiry?')) {
      return
    }

    setActionLoading(id)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/corporate-inquiries/${id}`, {
        method: 'DELETE',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })

      const data = await res.json()

      if (data.success) {
        alert('Inquiry deleted')
        loadInquiries()
        setSelectedInquiry(null)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800'
  }

  const groupedInquiries = {
    new: inquiries.filter(i => i.status === 'NEW'),
    contacted: inquiries.filter(i => i.status === 'CONTACTED'),
    quoted: inquiries.filter(i => i.status === 'QUOTED'),
    booked: inquiries.filter(i => i.status === 'BOOKED'),
    completed: inquiries.filter(i => i.status === 'COMPLETED'),
    declined: inquiries.filter(i => i.status === 'DECLINED'),
  }

  if (loading && inquiries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading inquiries...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="font-medium text-blue-800 text-sm">New: </span>
          <span className="text-blue-900 font-bold text-lg">{groupedInquiries.new.length}</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <span className="font-medium text-yellow-800 text-sm">Contacted: </span>
          <span className="text-yellow-900 font-bold text-lg">{groupedInquiries.contacted.length}</span>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
          <span className="font-medium text-purple-800 text-sm">Quoted: </span>
          <span className="text-purple-900 font-bold text-lg">{groupedInquiries.quoted.length}</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <span className="font-medium text-green-800 text-sm">Booked: </span>
          <span className="text-green-900 font-bold text-lg">{groupedInquiries.booked.length}</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <span className="font-medium text-gray-800 text-sm">Completed: </span>
          <span className="text-gray-900 font-bold text-lg">{groupedInquiries.completed.length}</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span className="font-medium text-red-800 text-sm">Declined: </span>
          <span className="text-red-900 font-bold text-lg">{groupedInquiries.declined.length}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Inquiries List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Corporate Event Inquiries</h2>

          <div className="space-y-3">
            {inquiries.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No inquiries yet
              </div>
            )}

            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry)}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedInquiry?.id === inquiry.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{inquiry.companyName}</h3>
                    <p className="text-sm text-gray-600">{inquiry.eventLocation}</p>
                    <p className="text-sm text-gray-600">Dates: {inquiry.eventDates}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(inquiry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(inquiry.status)}`}>
                    {inquiry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Inquiry Details */}
        <div>
          {selectedInquiry ? (
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Inquiry Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <select
                    value={selectedInquiry.status}
                    onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value)}
                    disabled={actionLoading === selectedInquiry.id}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Company Information</h3>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Company Name</label>
                    <p className="text-gray-900">{selectedInquiry.companyName}</p>
                  </div>

                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-500">Contact Person</label>
                    <p className="text-gray-900">{selectedInquiry.contactName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <a href={`mailto:${selectedInquiry.email}`} className="text-primary-600 hover:underline text-sm block">
                        {selectedInquiry.email}
                      </a>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <a href={`tel:${selectedInquiry.phone}`} className="text-primary-600 hover:underline text-sm block">
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Event Details</h3>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{selectedInquiry.eventLocation}</p>
                  </div>

                  {selectedInquiry.eventVenue && (
                    <div className="mt-3">
                      <label className="text-sm font-medium text-gray-500">Venue</label>
                      <p className="text-gray-900">{selectedInquiry.eventVenue}</p>
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-500">Event Dates</label>
                    <p className="text-gray-900">{selectedInquiry.eventDates}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estimated Draws</label>
                      <p className="text-gray-900">{selectedInquiry.estimatedDraws}</p>
                    </div>
                    {selectedInquiry.estimatedPhlebotomists && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Est. Phlebotomists</label>
                        <p className="text-gray-900">{selectedInquiry.estimatedPhlebotomists}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-500">Event Type</label>
                    <p className="text-gray-900">{selectedInquiry.eventType}</p>
                  </div>

                  {selectedInquiry.additionalDetails && (
                    <div className="mt-3">
                      <label className="text-sm font-medium text-gray-500">Additional Details</label>
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">{selectedInquiry.additionalDetails}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 mt-4">
                  <label className="text-sm font-medium text-gray-500">Submitted</label>
                  <p className="text-gray-900 text-sm">{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                  {selectedInquiry.ipAddress && (
                    <p className="text-gray-500 text-xs mt-1">IP: {selectedInquiry.ipAddress}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(selectedInquiry.id)}
                  disabled={actionLoading === selectedInquiry.id}
                  className="w-full mt-4 text-sm text-red-600 hover:text-red-800 py-2 disabled:opacity-50"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select an inquiry to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
