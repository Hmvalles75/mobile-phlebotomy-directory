'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

export default function OnboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [settingUpPayment, setSettingUpPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [claimingProvider, setClaimingProvider] = useState<any>(null)
  const [claimEmail, setClaimEmail] = useState('')

  // Form data for new provider
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    serviceZipCodes: ''
  })

  // Autocomplete suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 3) {
        try {
          const response = await fetch(`/api/provider/search?q=${encodeURIComponent(searchQuery)}`)
          const data = await response.json()
          if (data.ok) {
            setSuggestions(data.providers || [])
            setShowSuggestions(true)
          }
        } catch (err) {
          // Silently fail for autocomplete
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  function handleSelectSuggestion(provider: any) {
    setSearchQuery(provider.name)
    setShowSuggestions(false)
    setSuggestions([])
    // Trigger the search with the selected provider name
    setTimeout(() => handleSearch(), 100)
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return

    setSearching(true)
    setError(null)
    setShowSuggestions(false)

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
    // Show email confirmation modal instead of immediately sending link
    setClaimingProvider(provider)
    setClaimEmail('')
    setError(null)
  }

  async function handleConfirmClaim() {
    if (!claimEmail.trim()) {
      setError('Please enter your email address')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(claimEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setError(null)
    setSettingUpPayment(true)

    // Send login link to the email they provided
    await sendLoginLink(claimingProvider.id, claimEmail)
    setClaimingProvider(null)
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
            Receive Patient Requests in Your Service Area
          </h1>
          <p className="text-lg text-gray-600">
            Complete onboarding to receive email/SMS notifications when patients request mobile blood draw services.
          </p>
          <div className="mt-6 text-sm text-gray-700 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <span className="font-medium">1.</span> Claim your listing
              <span className="text-gray-400">→</span>
              <span className="font-medium">2.</span> Confirm coverage & availability
              <span className="text-gray-400">→</span>
              <span className="font-medium">3.</span> Receive patient requests
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && !claimingProvider && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Email Confirmation Modal */}
        {claimingProvider && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-6 border-2 border-primary-500">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Verify Your Email to Claim Listing
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              You&apos;re claiming: <span className="font-semibold">{claimingProvider.name}</span>
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                value={claimEmail}
                onChange={(e) => setClaimEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConfirmClaim()}
                placeholder="Enter your email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                We&apos;ll send a secure login link to this email address to verify ownership.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmClaim}
                disabled={settingUpPayment}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50"
              >
                {settingUpPayment ? 'Sending...' : 'Send Login Link'}
              </button>
              <button
                onClick={() => {
                  setClaimingProvider(null)
                  setClaimEmail('')
                  setError(null)
                }}
                disabled={settingUpPayment}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for Your Business
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Enter your business name, email, or phone number to locate your listing
          </p>
          <p className="text-sm text-gray-700 mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            Providers who complete onboarding are eligible to receive direct patient service requests. Listings that are not onboarded remain visible but do not receive lead notifications.
          </p>
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {suggestions.slice(0, 5).map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => handleSelectSuggestion(provider)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-semibold text-gray-900">{provider.name}</div>
                  </div>
                ))}
              </div>
            )}
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
              We&apos;ve sent a secure login link to:
            </p>
            <p className="text-lg font-semibold text-gray-900 mb-6">
              {selectedProvider.email}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-800 font-semibold mb-2">What happens next:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click the link in your email to access your dashboard</li>
                <li>• Confirm your service coverage area and availability</li>
                <li>• Start receiving patient service requests via email/SMS</li>
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
                <li>• We&apos;ll send you a secure login link via email</li>
                <li>• Access your dashboard to confirm coverage and availability</li>
                <li>• Start receiving patient service requests via email/SMS</li>
              </ul>
              <p className="text-xs text-blue-700 mt-3 italic">
                Onboarding is required to receive patient service requests. Directory visibility remains active either way.
              </p>
            </div>
          </div>
        )}

        {/* Call to Action (when no search yet) */}
        {!searching && searchResults.length === 0 && !showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Get Started
            </h2>
            <p className="text-gray-600 mb-6">
              Claim your listing to receive patient requests and manage your service coverage.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Complete Provider Onboarding
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Onboarding is required to receive patient service requests. Directory visibility remains active either way.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
