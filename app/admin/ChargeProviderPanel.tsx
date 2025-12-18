'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, Search, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Provider {
  id: string
  name: string
  email: string
  slug: string
  stripeCustomerId: string | null
  stripePaymentMethodId: string | null
  status: string
}

export function ChargeProviderPanel() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [showChargeModal, setShowChargeModal] = useState(false)
  const [chargeAmount, setChargeAmount] = useState('')
  const [description, setDescription] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [charging, setCharging] = useState(false)
  const [chargeResult, setChargeResult] = useState<{
    success: boolean
    message: string
    paymentIntentId?: string
  } | null>(null)

  useEffect(() => {
    loadProviders()
  }, [])

  useEffect(() => {
    // Filter providers based on search term
    if (!searchTerm) {
      setFilteredProviders(providers)
    } else {
      const filtered = providers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.includes(searchTerm)
      )
      setFilteredProviders(filtered)
    }
  }, [searchTerm, providers])

  const loadProviders = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/providers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        // Only show providers with payment methods
        const providersWithPayment = data.providers.filter(
          (p: Provider) => p.stripeCustomerId && p.stripePaymentMethodId
        )
        setProviders(providersWithPayment)
        setFilteredProviders(providersWithPayment)
      }
    } catch (error) {
      console.error('Failed to load providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const openChargeModal = (provider: Provider) => {
    setSelectedProvider(provider)
    setShowChargeModal(true)
    setChargeAmount('')
    setDescription(`Contract Referral Fee - ${provider.name}`)
    setReferenceId('')
    setChargeResult(null)
  }

  const handleCharge = async () => {
    if (!selectedProvider || !chargeAmount) return

    const amountCents = Math.round(parseFloat(chargeAmount) * 100)
    if (isNaN(amountCents) || amountCents <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!confirm(`Charge $${chargeAmount} to ${selectedProvider.name}?`)) {
      return
    }

    setCharging(true)
    setChargeResult(null)

    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/charge-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          amountCents,
          description,
          referenceId: referenceId || undefined
        })
      })

      const data = await res.json()

      if (data.ok) {
        setChargeResult({
          success: true,
          message: data.message,
          paymentIntentId: data.paymentIntentId
        })
        // Reset form after 3 seconds
        setTimeout(() => {
          setShowChargeModal(false)
          setChargeResult(null)
        }, 3000)
      } else {
        setChargeResult({
          success: false,
          message: data.error || 'Failed to charge provider'
        })
      }
    } catch (error: any) {
      setChargeResult({
        success: false,
        message: error.message || 'An error occurred'
      })
    } finally {
      setCharging(false)
    }
  }

  const quickChargeOptions = [
    { label: '$99 - Standard Referral', amount: 99 },
    { label: '$250 - Premium Referral', amount: 250 },
    { label: '$500 - Enterprise Referral', amount: 500 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Charge Contract Fee</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manually charge providers for B2B contract referrals
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search providers by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Showing {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} with payment methods
          </p>
        </div>

        {/* Providers List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                      <div className="text-sm text-gray-500">{provider.email}</div>
                      <div className="text-xs text-gray-400 font-mono">{provider.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      provider.status === 'VERIFIED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {provider.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-green-600">
                      <CreditCard size={16} className="mr-1" />
                      Card on file
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => openChargeModal(provider)}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      <DollarSign size={16} />
                      Charge Fee
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProviders.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No providers found with payment methods</p>
            </div>
          )}
        </div>
      </div>

      {/* Charge Modal */}
      {showChargeModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Charge Contract Fee
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Provider:</p>
              <p className="text-lg font-bold text-gray-900">{selectedProvider.name}</p>
              <p className="text-sm text-gray-600">{selectedProvider.email}</p>
            </div>

            {!chargeResult && (
              <>
                {/* Quick Charge Options */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick Options:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {quickChargeOptions.map((option) => (
                      <button
                        key={option.amount}
                        onClick={() => setChargeAmount(option.amount.toString())}
                        className={`px-4 py-2 text-left rounded-lg border-2 transition-colors ${
                          chargeAmount === option.amount.toString()
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contract Referral Fee"
                  />
                </div>

                {/* Reference ID (Optional) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CONTRACT-2025-001"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowChargeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={charging}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCharge}
                    disabled={!chargeAmount || charging}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {charging ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Charging...
                      </span>
                    ) : (
                      `Charge $${chargeAmount || '0.00'}`
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Result */}
            {chargeResult && (
              <div className={`p-4 rounded-lg ${
                chargeResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {chargeResult.success ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  ) : (
                    <XCircle className="text-red-600 flex-shrink-0" size={24} />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      chargeResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {chargeResult.success ? 'Charge Successful!' : 'Charge Failed'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      chargeResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {chargeResult.message}
                    </p>
                    {chargeResult.paymentIntentId && (
                      <p className="text-xs text-green-600 mt-2 font-mono">
                        {chargeResult.paymentIntentId}
                      </p>
                    )}
                  </div>
                </div>
                {chargeResult.success && (
                  <p className="text-xs text-green-600 mt-3 text-center">
                    Closing in 3 seconds...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
