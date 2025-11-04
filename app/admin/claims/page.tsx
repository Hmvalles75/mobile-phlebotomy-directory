'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BusinessClaim {
  id: string
  submittedAt: string
  status: 'pending' | 'registered' | 'rejected'
  providerId: string
  providerName: string
  claimantName: string
  claimantEmail: string
  claimantPhone: string
  requestedUpdates: string
  isOwnerConfirmed: boolean
  verifiedAt?: string
  verificationMethod?: string
  verificationNotes?: string
  ipAddress?: string
}

export default function AdminClaims() {
  const [claims, setClaims] = useState<BusinessClaim[]>([])
  const [selectedClaim, setSelectedClaim] = useState<BusinessClaim | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [verificationNotes, setVerificationNotes] = useState('')

  useEffect(() => {
    loadClaims()
  }, [])

  const loadClaims = async () => {
    try {
      const res = await fetch('/api/admin/claims')
      if (!res.ok) {
        window.location.href = '/admin'
        return
      }

      const data = await res.json()
      if (data.success) {
        setClaims(data.claims)
      }
    } catch (error) {
      console.error('Failed to load claims:', error)
    }
  }

  const handleAction = async (id: string, action: 'register' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action === 'register' ? 'register' : 'reject'} this claim?`)) {
      return
    }

    setActionLoading(id)

    try {
      const res = await fetch(`/api/admin/claims/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          verificationMethod: 'email_reply',
          verificationNotes
        })
      })

      const data = await res.json()

      if (data.success) {
        alert(data.message)
        loadClaims()
        setSelectedClaim(null)
        setVerificationNotes('')
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
    if (!confirm('Are you sure you want to permanently delete this claim?')) {
      return
    }

    setActionLoading(id)

    try {
      const res = await fetch(`/api/admin/claims/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        alert('Claim deleted')
        loadClaims()
        setSelectedClaim(null)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const pendingClaims = claims.filter(c => c.status === 'pending')
  const registeredClaims = claims.filter(c => c.status === 'registered')
  const rejectedClaims = claims.filter(c => c.status === 'rejected')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Claims Management</h1>
              <p className="text-sm text-gray-600 mt-1">Verify ownership of business listings</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
              <span className="font-medium text-yellow-800">Pending: </span>
              <span className="text-yellow-900">{pendingClaims.length}</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <span className="font-medium text-green-800">Registered: </span>
              <span className="text-green-900">{registeredClaims.length}</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <span className="font-medium text-red-800">Rejected: </span>
              <span className="text-red-900">{rejectedClaims.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Claims List */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Business Claims</h2>

            <div className="space-y-3">
              {claims.length === 0 && (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  No claims yet
                </div>
              )}

              {claims.map((claim) => (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaim(claim)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedClaim?.id === claim.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{claim.providerName}</h3>
                      <p className="text-sm text-gray-600">Claimed by: {claim.claimantName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(claim.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        claim.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : claim.status === 'registered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Claim Details */}
          <div>
            {selectedClaim ? (
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Claim Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Name</label>
                    <p className="text-gray-900">{selectedClaim.providerName}</p>
                    <p className="text-xs text-gray-500">Provider ID: {selectedClaim.providerId}</p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Claimant Information</h3>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Name:</span>
                        <p className="text-gray-900">{selectedClaim.claimantName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Email:</span>
                        <p className="text-gray-900">{selectedClaim.claimantEmail}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Phone:</span>
                        <p className="text-gray-900">{selectedClaim.claimantPhone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-500">Requested Updates</label>
                    <p className="text-gray-900 text-sm mt-1 whitespace-pre-wrap">
                      {selectedClaim.requestedUpdates}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <div className="text-sm">
                      <p className="text-gray-500">
                        <span className="font-medium">Owner Confirmed:</span>{' '}
                        {selectedClaim.isOwnerConfirmed ? '✓ Yes' : '✗ No'}
                      </p>
                      <p className="text-gray-500 mt-1">
                        <span className="font-medium">Submitted:</span>{' '}
                        {new Date(selectedClaim.submittedAt).toLocaleString()}
                      </p>
                      {selectedClaim.ipAddress && (
                        <p className="text-gray-500 mt-1">
                          <span className="font-medium">IP:</span> {selectedClaim.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedClaim.verifiedAt && (
                    <div className="border-t pt-4 bg-green-50 rounded p-3">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Registered:</span>{' '}
                        {new Date(selectedClaim.verifiedAt).toLocaleString()}
                      </p>
                      {selectedClaim.verificationMethod && (
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Method:</span> {selectedClaim.verificationMethod}
                        </p>
                      )}
                      {selectedClaim.verificationNotes && (
                        <p className="text-sm text-green-800 mt-2">
                          <span className="font-medium">Notes:</span> {selectedClaim.verificationNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedClaim.status === 'pending' && (
                    <>
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Verification Notes (optional)
                        </label>
                        <textarea
                          rows={3}
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Add any notes about the verification process..."
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => handleAction(selectedClaim.id, 'register')}
                          disabled={actionLoading === selectedClaim.id}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === selectedClaim.id ? 'Processing...' : '✓ Register Provider'}
                        </button>
                        <button
                          onClick={() => handleAction(selectedClaim.id, 'reject')}
                          disabled={actionLoading === selectedClaim.id}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === selectedClaim.id ? 'Processing...' : '✗ Reject'}
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(selectedClaim.id)}
                    disabled={actionLoading === selectedClaim.id}
                    className="w-full mt-2 text-sm text-red-600 hover:text-red-800 py-2"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Select a claim to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
