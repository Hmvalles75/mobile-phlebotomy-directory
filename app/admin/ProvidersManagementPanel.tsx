'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  removedAt: string | null
  removedReason: string | null
  doNotRelist: boolean
}

interface RemovalFollowUp {
  message: string
  source?: string
  destination?: string
}

export function ProvidersManagementPanel() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'eligible' | 'not-eligible' | 'removed'>('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  // Removal is a separate, deliberate action from the Activate/Deactivate
  // pause — it delists the provider from the public site and blocks re-import.
  const [removeTarget, setRemoveTarget] = useState<Provider | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [needsForce, setNeedsForce] = useState(false)
  const [followUp, setFollowUp] = useState<RemovalFollowUp | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/providers', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.providers) {
        setProviders(data.providers)
      } else {
        console.error('Failed to fetch providers:', data)
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

  const removeProvider = async (force = false) => {
    if (!removeTarget) return
    setUpdating(removeTarget.id)
    setRemoveError(null)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/providers/${removeTarget.id}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: removeReason, force }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setRemoveError(data.error || 'Failed to remove provider')
        setNeedsForce(data.requiresForce === true)
        return
      }
      setNeedsForce(false)
      setProviders(prev =>
        prev.map(p =>
          p.id === removeTarget.id
            ? { ...p, removedAt: data.provider.removedAt, removedReason: data.provider.removedReason, doNotRelist: true, eligibleForLeads: false }
            : p
        )
      )
      setFollowUp(data.followUp || null)
      setRemoveTarget(null)
      setRemoveReason('')
    } catch {
      setRemoveError('Network error — provider was not removed')
    } finally {
      setUpdating(null)
    }
  }

  const restoreProvider = async (provider: Provider) => {
    if (!confirm(`Restore ${provider.businessName}'s listing? They will be visible on the site again but will NOT receive leads until you Activate them.`)) return
    setUpdating(provider.id)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/providers/${provider.id}/remove`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setProviders(prev =>
          prev.map(p =>
            p.id === provider.id ? { ...p, removedAt: null, removedReason: null, doNotRelist: false } : p
          )
        )
        setFollowUp(data.followUp || null)
      }
    } finally {
      setUpdating(null)
    }
  }

  const removedCount = providers.filter(p => p.removedAt).length

  const filteredProviders = providers
    .filter(p => {
      if (filter === 'removed') return !!p.removedAt
      // Removed providers are hidden from the working views — they are not
      // candidates for activation and would only add noise.
      if (p.removedAt) return false
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
          <option value="removed">Removed ({removedCount})</option>
        </select>
      </div>

      {followUp && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="text-sm text-amber-900">
              <strong>{followUp.message}</strong>
              {followUp.source && followUp.destination && (
                <pre className="mt-2 overflow-x-auto rounded bg-amber-100 p-3 text-xs">{`{
  source: '${followUp.source}',
  destination: '${followUp.destination}',
  permanent: true,
},`}</pre>
              )}
            </div>
            <button onClick={() => setFollowUp(null)} className="text-amber-700 hover:text-amber-900 text-sm">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Remove {removeTarget.businessName}?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This delists them from the public site, stops all lead routing and email,
              and flags the record so a future import cannot re-add them. It is not the
              same as Deactivate, which is a reversible pause.
            </p>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              Reason (recorded on the provider record)
            </label>
            <textarea
              value={removeReason}
              onChange={e => setRemoveReason(e.target.value)}
              rows={3}
              placeholder="e.g. Provider request 2026-08-04 — emailed asking to be removed."
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            {removeError && (
              <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{removeError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setRemoveTarget(null); setRemoveReason(''); setRemoveError(null); setNeedsForce(false) }}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => removeProvider(needsForce)}
                disabled={removeReason.trim().length < 5 || updating === removeTarget.id}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                {updating === removeTarget.id
                  ? 'Removing…'
                  : needsForce
                    ? 'Remove anyway'
                    : 'Remove listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider List */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[800px]">
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
                  {provider.removedAt ? (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      title={provider.removedReason || undefined}
                    >
                      Removed {provider.removedAt.slice(0, 10)}
                    </span>
                  ) : provider.eligibleForLeads ? (
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
                  <div className="flex flex-col gap-1.5 items-center">
                    {provider.removedAt ? (
                      <button
                        onClick={() => restoreProvider(provider)}
                        disabled={updating === provider.id}
                        className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        {updating === provider.id ? '...' : 'Restore listing'}
                      </button>
                    ) : (
                      <>
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
                        {provider.eligibleForLeads && (
                          <Link
                            href={`/admin/providers/${provider.id}/rematch`}
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                            title="Re-route recent OPEN leads in this provider's radius. Use after activating a new provider."
                          >
                            Rematch open leads →
                          </Link>
                        )}
                        <button
                          onClick={() => { setRemoveTarget(provider); setRemoveReason(''); setRemoveError(null); setNeedsForce(false) }}
                          disabled={updating === provider.id}
                          className="text-xs text-red-700 hover:underline disabled:opacity-50"
                          title="Permanently delist from the public site. Not the same as Deactivate."
                        >
                          Remove listing
                        </button>
                      </>
                    )}
                  </div>
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
