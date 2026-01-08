'use client'

import { useState, useEffect } from 'react'
import { Activity, Users, FileText, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Provider {
  id: string
  name: string
  email: string | null
  claimEmail: string | null
  phone: string | null
  createdAt: string
  claimVerifiedAt?: string | null
  stripePaymentMethodId: string | null
  eligibleForLeads: boolean
  status?: string
  _count: {
    leads: number
  }
}

interface LeadClaim {
  id: string
  fullName: string
  phone: string
  email: string | null
  city: string
  state: string
  urgency: string
  priceCents: number
  routedAt: string
  provider: {
    id: string
    name: string
    email: string | null
  }
}

interface ActivityData {
  stats: {
    providers: {
      total: number
      withPayment: number
      whoClaimedLeads: number
      claimedViaOnboard: number
    }
    leads: {
      total: number
      claimed: number
      open: number
    }
  }
  recentProviders: Provider[]
  onboardedProviders: Provider[]
  allProviders: Provider[]
  recentLeadClaims: LeadClaim[]
}

export default function AdminActivityPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ActivityData | null>(null)
  const [activeTab, setActiveTab] = useState<'onboarded' | 'recent' | 'all' | 'claims'>('onboarded')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/activity', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      })

      const result = await response.json()

      if (result.ok) {
        setIsAuthenticated(true)
        setData(result)
      } else {
        setError('Invalid password')
      }
    } catch (err: any) {
      setError('Failed to authenticate')
    } finally {
      setLoading(false)
    }
  }

  async function refreshData() {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/activity', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      })

      const result = await response.json()

      if (result.ok) {
        setData(result)
      }
    } catch (err) {
      console.error('Failed to refresh data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Auto-refresh every 30 seconds
      const interval = setInterval(refreshData, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-primary-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">Admin Activity Monitor</h1>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              placeholder="Enter admin password"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading activity data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Admin Activity Monitor</h1>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-blue-600" size={24} />
              <h3 className="font-semibold text-gray-900">Total Providers</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.stats.providers.total}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="text-green-600" size={24} />
              <h3 className="font-semibold text-gray-900">With Payment</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.stats.providers.withPayment}</p>
            <p className="text-sm text-gray-600 mt-1">
              {Math.round((data.stats.providers.withPayment / data.stats.providers.total) * 100)}% of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="text-purple-600" size={24} />
              <h3 className="font-semibold text-gray-900">Onboarded</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.stats.providers.claimedViaOnboard}</p>
            <p className="text-sm text-gray-600 mt-1">claimed via /onboard</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="text-orange-600" size={24} />
              <h3 className="font-semibold text-gray-900">Open Leads</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.stats.leads.open}</p>
            <p className="text-sm text-gray-600 mt-1">
              {data.stats.leads.claimed} claimed / {data.stats.leads.total} total
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('onboarded')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'onboarded'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Onboarded ({data.onboardedProviders.length})
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'recent'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Recent Providers ({data.recentProviders.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'all'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                All Providers ({data.allProviders.length})
              </button>
              <button
                onClick={() => setActiveTab('claims')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'claims'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Recent Claims ({data.recentLeadClaims.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Onboarded Providers Tab */}
            {activeTab === 'onboarded' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Providers who claimed their listing via /onboard page
                </p>
                {data.onboardedProviders.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No onboarded providers yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Claimed</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.onboardedProviders.map((provider) => (
                          <tr key={provider.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{provider.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{provider.claimEmail || provider.email || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{provider.phone || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {provider.claimVerifiedAt ? new Date(provider.claimVerifiedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                provider.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                provider.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {provider.status || 'UNVERIFIED'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {provider.stripePaymentMethodId ? (
                                <span className="text-green-600 font-semibold">✓ Yes</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Recent Providers Tab */}
            {activeTab === 'recent' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Providers who signed up in the last 30 days
                </p>
                {data.recentProviders.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No recent providers</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Provider</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Signed Up</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Payment</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Claims</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.recentProviders.map((provider) => (
                          <tr key={provider.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{provider.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {provider.claimEmail || provider.email || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{provider.phone || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(provider.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {provider.stripePaymentMethodId ? (
                                <CheckCircle className="text-green-600 inline" size={18} />
                              ) : (
                                <Clock className="text-gray-400 inline" size={18} />
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                              {provider._count.leads}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* All Providers Tab */}
            {activeTab === 'all' && (
              <div className="space-y-4">
                {data.allProviders.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No providers yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Provider</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Signed Up</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Payment</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Claims</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.allProviders.map((provider) => (
                          <tr key={provider.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{provider.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {provider.claimEmail || provider.email || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{provider.phone || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(provider.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {provider.stripePaymentMethodId ? (
                                <CheckCircle className="text-green-600 inline" size={18} />
                              ) : (
                                <Clock className="text-gray-400 inline" size={18} />
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                              {provider._count.leads}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Recent Claims Tab */}
            {activeTab === 'claims' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Leads claimed in the last 30 days
                </p>
                {data.recentLeadClaims.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No recent claims</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Urgency</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Claimed By</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Claimed At</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.recentLeadClaims.map((claim) => (
                          <tr key={claim.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{claim.fullName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {claim.city}, {claim.state}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                  claim.urgency === 'STAT'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {claim.urgency}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{claim.provider.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(claim.routedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              ${(claim.priceCents / 100).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
