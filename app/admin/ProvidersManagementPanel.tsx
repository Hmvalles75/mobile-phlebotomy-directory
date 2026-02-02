'use client'

import { useState, useEffect } from 'react'

interface Provider {
  id: string
  businessName: string
  slug: string
  email: string
  phone: string
  city: string
  state: string
  eligibleForLeads: boolean
  createdAt: string
}

export function ProvidersManagementPanel() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'eligible' | 'not-eligible'>('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/providers', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProviders(data.providers)
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEligibility = async (providerId: string, currentStatus: boolean) => {
    setUpdating(providerId)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ eligibleForLeads: !currentStatus })
      })

      if (res.ok) {
        setProviders(prev =>
          prev.map(p =>
            p.id === providerId ? { ...p, eligibleForLeads: !currentStatus } : p
          )
        )
      }
    } catch (error) {
      console.error('Failed to update provider:', error)
    } finally {
      setUpdating(null)
    }
  }

  const filteredProviders = providers
    .filter(p => {
      if (filter === 'eligible') return p.eligibleForLeads
      if (filter === 'not-eligible') return !p.eligibleForLeads
      return true
    })
    .filter(p => {
      if (!search) return true
      const searchLower = search.toLowerCase()
      return (
        p.businessName?.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower) ||
        p.city?.toLowerCase().includes(searchLower) ||
        p.state?.toLowerCase().includes(searchLower)
      )
    })

  const eligibleCount = providers.filter(p => p.eligibleForLeads).length
  const notEligibleCount = providers.filter(p => !p.eligibleForLeads).length

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading providers...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Provider Management</h2>
        <p className="text-gray-600">Manage which providers receive lead notifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{providers.length}</div>
          <div className="text-sm text-gray-500">Total Providers</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{eligibleCount}</div>
          <div className="text-sm text-gray-500">Receiving Leads</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-400">{notEligibleCount}</div>
          <div className="text-sm text-gray-500">Not Activated</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, city, state..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Providers</option>
          <option value="eligible">Receiving Leads ({eligibleCount})</option>
          <option value="not-eligible">Not Activated ({notEligibleCount})</option>
        </select>
      </div>

      {/* Provider List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lead Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProviders.map(provider => (
              <tr key={provider.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{provider.businessName || provider.slug}</div>
                  <div className="text-sm text-gray-500">{provider.slug}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {provider.city}, {provider.state}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">{provider.email}</div>
                  {provider.phone && <div className="text-sm text-gray-400">{provider.phone}</div>}
                </td>
                <td className="px-4 py-3 text-center">
                  {provider.eligibleForLeads ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Not Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleEligibility(provider.id, provider.eligibleForLeads)}
                    disabled={updating === provider.id}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      provider.eligibleForLeads
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    } disabled:opacity-50`}
                  >
                    {updating === provider.id ? '...' : provider.eligibleForLeads ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProviders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No providers found matching your criteria
          </div>
        )}
      </div>
    </div>
  )
}
