'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Star, TrendingUp, Users, LogOut, AlertCircle } from 'lucide-react'
import Link from 'next/link'

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
  status: 'NEW' | 'DELIVERED' | 'REFUNDED' | 'UNSOLD'
  priceCents: number
  notes?: string
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
  leads: Lead[]
  stats: {
    totalLeads: number
    newLeads: number
    deliveredLeads: number
    revenueGenerated: number
  }
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">New</span>
      case 'DELIVERED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Delivered</span>
      case 'REFUNDED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Refunded</span>
      case 'UNSOLD':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Unsold</span>
    }
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

  const { provider, leads, stats } = data

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
              <CreditCard className="text-blue-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">{provider.leadCredit}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Lead Credits</p>
            <p className="text-xs text-gray-500 mt-1">Available for new leads</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-green-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">{stats.totalLeads}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Leads</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-purple-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">{stats.newLeads}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">New Leads</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting contact</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="text-yellow-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">${stats.revenueGenerated.toFixed(0)}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Spent</p>
            <p className="text-xs text-gray-500 mt-1">On lead credits</p>
          </div>
        </div>

        {/* Low Credits Warning */}
        {provider.leadCredit < 5 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Low credit balance</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You have {provider.leadCredit} lead credit{provider.leadCredit === 1 ? '' : 's'} remaining.
                  Purchase more to continue receiving leads.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Leads</h2>
          </div>

          {leads.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
              <p className="text-gray-600">
                Leads will appear here once you start receiving patient requests.
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(lead.priceCents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.createdAt)}
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Need More Leads?</h3>
            <p className="text-gray-600 mb-4">
              Purchase lead credits to continue receiving patient requests in your service area.
            </p>
            <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 font-medium">
              Purchase Credits
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upgrade to Featured</h3>
            <p className="text-gray-600 mb-4">
              Get premium placement and more leads with a Featured subscription.
            </p>
            <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 font-medium">
              View Plans
            </button>
          </div>
        </div>
      </div>
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
