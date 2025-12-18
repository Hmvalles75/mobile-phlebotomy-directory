'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Star, TrendingUp, Users, LogOut, AlertCircle, Clock, DollarSign, Zap } from 'lucide-react'
import Link from 'next/link'
import { PremiumPricingModal } from '@/components/ui/PremiumPricingModal'

interface Lead {
  id: string
  createdAt: string
  fullName: string
  phone: string
  email?: string
  city: string
  state: string
  zip: string
  urgency: 'STANDARD' | 'STAT'
  status: 'NEW' | 'DELIVERED' | 'REFUNDED' | 'UNSOLD' | 'CLAIMED'
  priceCents: number
  notes?: string
  routedAt?: string
}

interface AvailableLead {
  id: string
  createdAt: string
  city: string
  state: string
  zip: string
  urgency: 'STANDARD' | 'STAT'
  priceCents: number
}

interface Provider {
  id: string
  name: string
  slug: string
  leadCredit: number
  featuredTier: string | null
  status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
  claimEmail: string | null
  zipCodes: string | null
}

interface DashboardData {
  provider: Provider
  claimedLeads: Lead[]
  availableLeads: AvailableLead[]
  stats: {
    totalLeads: number
    claimedLeads: number
    availableLeads: number
    totalSpent: number
  }
  isTrialActive: boolean
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPricingModal, setShowPricingModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard', {
        credentials: 'include' // Include cookies
      })

      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/dashboard/login')
        return
      }

      const result = await response.json()

      if (result.ok) {
        setData(result)
      } else {
        setError(result.error || 'Failed to load dashboard')
      }
    } catch (error) {
      setError('An error occurred while loading your dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/dashboard/login?logout=success')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Failed to load dashboard'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
            <Link
              href="/dashboard/login"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { provider, claimedLeads, availableLeads, stats, isTrialActive } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success message */}
      {searchParams.get('login') === 'success' && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="container mx-auto">
            <p className="text-sm text-green-800">✓ Logged in successfully</p>
          </div>
        </div>
      )}

      {/* Trial Status Banner */}
      {isTrialActive && (
        <div className="bg-green-500 text-white px-4 py-3">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <Star className="h-5 w-5" />
            <p className="font-semibold">30-Day Free Trial Active - All leads are FREE!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
              <p className="text-gray-600 mt-1">Provider Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  provider.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                  provider.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {provider.status === 'VERIFIED' && '✓ '}
                  {provider.status}
                </span>
              </div>
              <Link
                href={`/provider/${provider.slug}`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View Listing →
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="text-orange-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">{stats.availableLeads}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Available Leads</p>
            <p className="text-xs text-gray-500 mt-1">Ready to claim now</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-green-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">{stats.claimedLeads}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Claimed Leads</p>
            <p className="text-xs text-gray-500 mt-1">Your leads</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-blue-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">
                {isTrialActive ? '$0' : `$${stats.totalSpent.toFixed(0)}`}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Spent</p>
            <p className="text-xs text-gray-500 mt-1">
              {isTrialActive ? 'FREE during trial' : 'On leads'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="text-yellow-600" size={24} />
              <span className="text-2xl font-bold text-gray-900">
                {isTrialActive ? 'TRIAL' : 'ACTIVE'}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Account Status</p>
            <p className="text-xs text-gray-500 mt-1">
              {isTrialActive ? '30-day free trial' : 'Pay per lead'}
            </p>
          </div>
        </div>

        {/* Available Leads Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-orange-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Available Leads in Your Area</h2>
              </div>
              {stats.availableLeads > 0 && (
                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {stats.availableLeads} Ready to Claim
                </span>
              )}
            </div>
          </div>

          {availableLeads.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads available right now</h3>
              <p className="text-gray-600">
                New patient leads will appear here when they submit requests in your service area.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.city}, {lead.state}</div>
                        <div className="text-sm text-gray-500">{lead.zip}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.urgency === 'STAT'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {lead.urgency === 'STAT' ? '🚨 STAT' : '📋 Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {isTrialActive ? (
                          <span className="text-green-600">
                            FREE <span className="line-through text-gray-400 ml-1">${(lead.priceCents / 100).toFixed(2)}</span>
                          </span>
                        ) : (
                          <span className="text-gray-900">${(lead.priceCents / 100).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/claim/${lead.id}`}
                          className="inline-flex items-center gap-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-semibold"
                        >
                          <Zap size={16} />
                          Claim Lead
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Claimed Leads Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Claimed Leads</h2>
          </div>

          {claimedLeads.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No claimed leads yet</h3>
              <p className="text-gray-600">
                Leads you claim will appear here with full patient contact information.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Claimed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {claimedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.fullName}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.city}, {lead.state}</div>
                        <div className="text-sm text-gray-500">{lead.zip}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.urgency === 'STAT'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {lead.urgency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isTrialActive ? (
                          <span className="text-green-600 font-semibold">$0 (Trial)</span>
                        ) : (
                          `$${(lead.priceCents / 100).toFixed(2)}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.routedAt || lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">1.</span>
                <span>New leads appear in &quot;Available Leads&quot; when patients submit requests</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">2.</span>
                <span>Click &quot;Claim Lead&quot; to see full patient info and pay for the lead</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">3.</span>
                <span>First provider to claim gets the lead - it&apos;s a race!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">4.</span>
                <span>{isTrialActive ? 'All leads are FREE during your 30-day trial' : 'Pay only for leads you claim'}</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upgrade to Premium</h3>
            <p className="text-gray-600 mb-4">
              Get premium placement and more visibility with a Premium subscription starting at $49/month.
            </p>
            <button
              onClick={() => setShowPricingModal(true)}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 font-medium"
            >
              View Pricing Plans
            </button>
          </div>
        </div>
      </div>

      {/* Premium Pricing Modal */}
      {data && (
        <PremiumPricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          providerId={provider.id}
          providerName={provider.name}
        />
      )}
    </div>
  )
}

export default function ProviderDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div><p className="text-gray-600">Loading dashboard...</p></div></div>}>
      <DashboardContent />
    </Suspense>
  )
}
