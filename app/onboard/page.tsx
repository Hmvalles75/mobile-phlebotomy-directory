'use client'

import { useState } from 'react'
import { Search, Plus, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

export default function OnboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [settingUpPayment, setSettingUpPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data for new provider
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    serviceZipCodes: ''
  })

  async function handleSearch() {
    if (!searchQuery.trim()) return

    setSearching(true)
    setError(null)

    try {
      const response = await fetch(`/api/provider/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.ok) {
        setSearchResults(data.providers || [])
        if (data.providers.length === 0) {
          setShowCreateForm(true)
        }
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (err: any) {
      setError(err.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  async function handleSelectProvider(provider: any) {
    setSelectedProvider(provider)

    // Send login link to access dashboard
    await sendLoginLink(provider.id, provider.claimEmail || provider.email)
  }

  async function handleCreateProvider() {
    setError(null)
    setSettingUpPayment(true)

    try {
      // Create provider first
      const createResponse = await fetch('/api/provider/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const createData = await createResponse.json()

      if (!createData.ok) {
        throw new Error(createData.error || 'Failed to create provider')
      }

      // Send login link to access dashboard
      await sendLoginLink(createData.providerId, formData.email)

    } catch (err: any) {
      setError(err.message || 'Failed to create provider')
      setSettingUpPayment(false)
    }
  }

  async function sendLoginLink(providerId: string, email: string) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.ok) {
        // Show success message
        setError(null)
        setSelectedProvider({ email })
        setSettingUpPayment(false)
      } else {
        throw new Error(data.error || 'Failed to send login link')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send login link')
      setSettingUpPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Get Access to Patient Leads
          </h1>
          <p className="text-lg text-gray-600">
            Claim your listing to start receiving and managing mobile phlebotomy service requests
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for Your Business
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter business name, email, or phone..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              <Search size={20} />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Success Message - Login Link Sent */}
        {selectedProvider && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Check Your Email!
            </h2>
            <p className="text-gray-600 mb-2">
              We've sent a secure login link to:
            </p>
            <p className="text-lg font-semibold text-gray-900 mb-6">
              {selectedProvider.email}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-800 font-semibold mb-2">What happens next:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click the link in your email to access your dashboard</li>
                <li>• Explore how the lead system works</li>
                <li>• Add payment details when you're ready to receive leads</li>
                <li>• Get a 30-day FREE trial when you add payment</li>
              </ul>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && !selectedProvider && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Found {searchResults.length} Provider{searchResults.length > 1 ? 's' : ''}
            </h2>
            <div className="space-y-3">
              {searchResults.map((provider) => (
                <div
                  key={provider.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 cursor-pointer transition-colors"
                  onClick={() => handleSelectProvider(provider)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-600">{provider.email || provider.claimEmail}</p>
                      <p className="text-sm text-gray-600">{provider.phone}</p>
                    </div>
                    <button className="text-primary-600 font-semibold text-sm hover:text-primary-700">
                      Access Dashboard →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create New Provider Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">
                Create New Provider Account
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service ZIP Codes <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="90210, 90211, 902* (comma-separated)"
                  value={formData.serviceZipCodes}
                  onChange={(e) => setFormData({ ...formData, serviceZipCodes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can use wildcards (902*) or ranges (90210-90220)
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateProvider}
              disabled={settingUpPayment}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              {settingUpPayment ? 'Creating account...' : 'Create Account & View Dashboard'}
            </button>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• We'll send you a secure login link via email</li>
                <li>• Access your dashboard to explore the lead system</li>
                <li>• Add payment details when you're ready to start receiving leads</li>
                <li>• Get a <strong>30-day FREE trial</strong> when you add payment</li>
                <li>• After trial: $20/lead (standard) or $50/lead (STAT)</li>
                <li>• Only pay when you claim a lead</li>
              </ul>
            </div>
          </div>
        )}

        {/* Call to Action (when no search yet) */}
        {!searching && searchResults.length === 0 && !showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-gray-600 mb-6">
              Search for your existing listing above, or click below to create a new provider account.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create New Provider
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
