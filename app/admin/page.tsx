'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CorporateInquiriesPanel } from './CorporateInquiriesPanel'
import { LeadsPanel } from './LeadsPanel'
import { ChargeProviderPanel } from './ChargeProviderPanel'

interface PendingProvider {
  id: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  businessName: string
  contactName: string
  email: string
  phone: string
  website?: string
  services?: string[]
  description: string
  address?: string
  city: string
  state: string
  zipCode?: string
  serviceArea?: string
  yearsExperience?: string
  licensed?: boolean
  insurance?: boolean
  certifications?: string
  specialties?: string
  emergencyAvailable?: boolean
  weekendAvailable?: boolean
  logo?: string
  ipAddress?: string
}

interface BusinessClaim {
  id: string
  submittedAt: string
  status: 'pending' | 'verified' | 'rejected'
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

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'providers' | 'corporate' | 'leads' | 'billing'>('providers')
  const [submissions, setSubmissions] = useState<PendingProvider[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<PendingProvider | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deployLoading, setDeployLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    serviceArea: '',
    yearsExperience: '',
    licensed: true,
    insurance: true,
    certifications: '',
    specialties: '',
    emergencyAvailable: false,
    weekendAvailable: false,
    logo: ''
  })

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        return
      }

      const res = await fetch('/api/admin/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        setIsAuthenticated(true)
        loadSubmissions()
      } else {
        // Token invalid, clear it
        localStorage.removeItem('admin_token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  // Check auth on mount
  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem('admin_token', data.token)
        setPassword('')
        setIsAuthenticated(true)
        loadSubmissions()
      } else {
        setLoginError(data.error || 'Login failed')
      }
    } catch (error) {
      setLoginError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      localStorage.removeItem('admin_token')
      await fetch('/api/admin/logout', { method: 'POST' })
      setIsAuthenticated(false)
      setSubmissions([])
      setSelectedSubmission(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/submissions', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })
      if (!res.ok) {
        setIsAuthenticated(false)
        localStorage.removeItem('admin_token')
        return
      }

      const data = await res.json()
      if (data.success) {
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error('Failed to load submissions:', error)
    }
  }

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this submission?`)) {
      return
    }

    setActionLoading(id)

    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action })
      })

      const data = await res.json()

      if (data.success) {
        alert(data.message)
        loadSubmissions()
        setSelectedSubmission(null)
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
    if (!confirm('Are you sure you want to permanently delete this submission?')) {
      return
    }

    setActionLoading(id)

    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })

      const data = await res.json()

      if (data.success) {
        alert('Submission deleted')
        loadSubmissions()
        setSelectedSubmission(null)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeploy = async () => {
    if (!confirm('Deploy approved providers to production? This will commit and push changes to your repository.')) {
      return
    }

    setDeployLoading(true)

    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/deploy', {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })

      const data = await res.json()

      if (data.success) {
        alert(data.message)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setDeployLoading(false)
    }
  }

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        alert('Provider added successfully! It will appear in the submissions list.')
        // Reset form
        setFormData({
          businessName: '',
          contactName: '',
          email: '',
          phone: '',
          website: '',
          description: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          serviceArea: '',
          yearsExperience: '',
          licensed: true,
          insurance: true,
          certifications: '',
          specialties: '',
          emergencyAvailable: false,
          weekendAvailable: false,
          logo: ''
        })
        setShowAddForm(false)
        loadSubmissions()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Login</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>

            {loginError && (
              <div className="text-red-600 text-sm">{loginError}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Dashboard
  const pendingSubmissions = submissions.filter(s => s.status === 'pending')
  const approvedSubmissions = submissions.filter(s => s.status === 'approved')
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex gap-3">
              {activeTab === 'providers' && (
                <>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                  >
                    {showAddForm ? '✕ Cancel' : '+ Add Provider'}
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={deployLoading || approvedSubmissions.length === 0}
                    className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deployLoading ? 'Deploying...' : '🚀 Deploy Changes'}
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('providers')
                setShowAddForm(false)
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'providers'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Provider Submissions
            </button>
            <button
              onClick={() => {
                setActiveTab('leads')
                setShowAddForm(false)
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'leads'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Blood Draw Leads
            </button>
            <button
              onClick={() => {
                setActiveTab('corporate')
                setShowAddForm(false)
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'corporate'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Corporate Inquiries
            </button>
            <button
              onClick={() => {
                setActiveTab('billing')
                setShowAddForm(false)
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'billing'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Billing & Charges
            </button>
          </div>

          {activeTab === 'providers' && (
            <div className="mt-4 flex gap-4 text-sm">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                <span className="font-medium text-yellow-800">Pending: </span>
                <span className="text-yellow-900">{pendingSubmissions.length}</span>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <span className="font-medium text-green-800">Approved: </span>
                <span className="text-green-900">{approvedSubmissions.length}</span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <span className="font-medium text-red-800">Rejected: </span>
                <span className="text-red-900">{rejectedSubmissions.length}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Add Provider Form */}
        {showAddForm && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Provider</h2>
            <form onSubmit={handleAddProvider} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CA"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Area</label>
                  <input
                    type="text"
                    value={formData.serviceArea}
                    onChange={(e) => setFormData({...formData, serviceArea: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
                  <input
                    type="text"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                  <input
                    type="text"
                    value={formData.certifications}
                    onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                  <input
                    type="text"
                    value={formData.specialties}
                    onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.licensed}
                    onChange={(e) => setFormData({...formData, licensed: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Licensed</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.insurance}
                    onChange={(e) => setFormData({...formData, insurance: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Insured</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.emergencyAvailable}
                    onChange={(e) => setFormData({...formData, emergencyAvailable: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Emergency Available</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.weekendAvailable}
                    onChange={(e) => setFormData({...formData, weekendAvailable: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Weekend Available</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Provider'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Provider Submissions Tab */}
        {activeTab === 'providers' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Submissions List */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Provider Submissions</h2>

            <div className="space-y-3">
              {submissions.length === 0 && (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  No submissions yet
                </div>
              )}

              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedSubmission?.id === submission.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{submission.businessName}</h3>
                      <p className="text-sm text-gray-600">{submission.city}, {submission.state}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        submission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : submission.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Submission Details */}
          <div>
            {selectedSubmission ? (
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Submission Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Name</label>
                    <p className="text-gray-900">{selectedSubmission.businessName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Person</label>
                    <p className="text-gray-900">{selectedSubmission.contactName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 text-sm">{selectedSubmission.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900 text-sm">{selectedSubmission.phone}</p>
                    </div>
                  </div>

                  {selectedSubmission.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Website</label>
                      <a
                        href={selectedSubmission.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        {selectedSubmission.website}
                      </a>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">
                      {selectedSubmission.address && `${selectedSubmission.address}, `}
                      {selectedSubmission.city}, {selectedSubmission.state} {selectedSubmission.zipCode}
                    </p>
                  </div>

                  {selectedSubmission.serviceArea && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Service Area</label>
                      <p className="text-gray-900">{selectedSubmission.serviceArea}</p>
                    </div>
                  )}

                  {selectedSubmission.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-900 text-sm">{selectedSubmission.description}</p>
                    </div>
                  )}

                  {selectedSubmission.yearsExperience && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                      <p className="text-gray-900">{selectedSubmission.yearsExperience}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Licensed</label>
                      <p className="text-gray-900">{selectedSubmission.licensed ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Insured</label>
                      <p className="text-gray-900">{selectedSubmission.insurance ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {selectedSubmission.certifications && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Certifications</label>
                      <p className="text-gray-900">{selectedSubmission.certifications}</p>
                    </div>
                  )}

                  {selectedSubmission.specialties && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Specialties</label>
                      <p className="text-gray-900">{selectedSubmission.specialties}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <label className="text-sm font-medium text-gray-500">Submitted</label>
                    <p className="text-gray-900 text-sm">{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                    {selectedSubmission.ipAddress && (
                      <p className="text-gray-500 text-xs mt-1">IP: {selectedSubmission.ipAddress}</p>
                    )}
                  </div>

                  {selectedSubmission.status === 'pending' && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleAction(selectedSubmission.id, 'approve')}
                        disabled={actionLoading === selectedSubmission.id}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === selectedSubmission.id ? 'Processing...' : 'Approve & Add to Directory'}
                      </button>
                      <button
                        onClick={() => handleAction(selectedSubmission.id, 'reject')}
                        disabled={actionLoading === selectedSubmission.id}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === selectedSubmission.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(selectedSubmission.id)}
                    disabled={actionLoading === selectedSubmission.id}
                    className="w-full mt-2 text-sm text-red-600 hover:text-red-800 py-2"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Select a submission to view details
              </div>
            )}
          </div>
        </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <LeadsPanel />
        )}

        {/* Corporate Inquiries Tab */}
        {activeTab === 'corporate' && (
          <CorporateInquiriesPanel />
        )}

        {/* Billing & Charges Tab */}
        {activeTab === 'billing' && (
          <ChargeProviderPanel />
        )}
      </div>
    </div>
  )
}
