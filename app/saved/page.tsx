'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProviderActions, ProviderDetailsModal } from '@/components/ui/ProviderActions'
import { SearchBar } from '@/components/ui/SearchBar'
import { getSavedProviders } from '@/lib/provider-actions'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'

export default function SavedProviders() {
  const [savedProviderIds, setSavedProviderIds] = useState<string[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'recent'>('recent')

  // Load saved provider IDs
  useEffect(() => {
    const savedIds = getSavedProviders()
    setSavedProviderIds(savedIds)
  }, [])

  // Fetch provider details for saved IDs
  useEffect(() => {
    async function fetchSavedProviders() {
      if (savedProviderIds.length === 0) {
        setProviders([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Fetch providers by IDs
        const params = new URLSearchParams()
        savedProviderIds.forEach(id => params.append('ids', id))
        
        const response = await fetch(`/api/providers?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch saved providers')
        }
        
        const fetchedProviders = await response.json()
        setProviders(Array.isArray(fetchedProviders) ? fetchedProviders : [])
      } catch (error) {
        console.error('Error fetching saved providers:', error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchSavedProviders()
  }, [savedProviderIds])

  // Filter and sort providers
  useEffect(() => {
    let filtered = providers.filter(provider =>
      !searchQuery || 
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Sort providers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'recent':
        default:
          // Sort by order in savedProviderIds (most recently saved first)
          const aIndex = savedProviderIds.indexOf(a.id)
          const bIndex = savedProviderIds.indexOf(b.id)
          return aIndex - bIndex
      }
    })

    setFilteredProviders(filtered)
  }, [providers, searchQuery, sortBy, savedProviderIds])

  const handleProviderUpdated = () => {
    // Refresh saved provider IDs when a provider is unsaved
    const newSavedIds = getSavedProviders()
    setSavedProviderIds(newSavedIds)
  }

  const handleClearAll = () => {
    if (confirm(`Are you sure you want to remove all ${savedProviderIds.length} saved providers?`)) {
      localStorage.removeItem('savedProviders')
      setSavedProviderIds([])
      setProviders([])
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Saved Mobile Phlebotomy Providers',
    description: 'Your saved mobile phlebotomy providers for easy access and comparison',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/saved`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: providers.length,
      itemListElement: providers.map((provider, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'MedicalBusiness',
          name: provider.name,
          description: provider.description || `Mobile phlebotomy services by ${provider.name}`,
          url: provider.website,
          telephone: provider.phone,
          serviceType: 'Mobile Phlebotomy'
        }
      }))
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Saved Providers</h1>
                <p className="text-gray-600 mt-1">
                  {savedProviderIds.length > 0 
                    ? `${savedProviderIds.length} mobile phlebotomy provider${savedProviderIds.length !== 1 ? 's' : ''} saved for quick access`
                    : 'No providers saved yet'
                  }
                </p>
              </div>
              
              {savedProviderIds.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Breadcrumb */}
            <nav className="text-sm mb-6">
              <Link href="/" className="text-primary-600 hover:text-primary-700">
                Home
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-700">Saved Providers</span>
            </nav>

            {savedProviderIds.length > 0 && (
              <>
                {/* Search and Sort */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search your saved providers..."
                      className="max-w-none"
                    />
                  </div>
                  
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'recent')}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="recent">Sort by Recently Saved</option>
                    <option value="name">Sort by Name</option>
                    <option value="rating">Sort by Rating</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Loading saved providers...</h3>
              <p className="text-gray-600">Please wait while we load your saved providers.</p>
            </div>
          ) : savedProviderIds.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">❤️</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No providers saved yet</h3>
              <p className="text-gray-600 mb-6">
                Start saving providers you&apos;re interested in for quick access later. 
                Look for the &quot;Save&quot; button on any provider listing.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/search"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Find Providers
                </Link>
                <div>
                  <Link 
                    href="/"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No providers match your search</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or browse all your saved providers.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  Showing {filteredProviders.length} of {providers.length} saved provider{providers.length !== 1 ? 's' : ''}
                </p>
                
                <Link
                  href="/search"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Find More Providers →
                </Link>
              </div>

              {/* Provider Grid */}
              <div className="grid gap-6">
                {filteredProviders.map((provider) => (
                  <div 
                    key={provider.id} 
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{provider.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                          {provider.address?.city && (
                            <span>📍 {provider.address.city}, {provider.address.state}</span>
                          )}
                          {provider.phone && <span>📞 {provider.phone}</span>}
                          {provider.rating && provider.reviewsCount && (
                            <span>⭐ {provider.rating} ({provider.reviewsCount} reviews)</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                          ❤️ Saved
                        </span>
                        {provider.badges?.map((badge) => (
                          <span
                            key={badge}
                            className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    {provider.description && (
                      <p className="text-gray-600 mb-4">{provider.description}</p>
                    )}

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Services Offered:</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.services.map((service) => (
                          <span
                            key={service}
                            className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4 text-sm text-gray-600">
                      <span className="font-medium">Coverage:</span>{' '}
                      {formatCoverageDisplay(provider.coverage)}
                    </div>

                    <ProviderActions
                      provider={provider}
                      currentLocation="Saved Providers"
                      className="mt-4"
                    />
                  </div>
                ))}
              </div>

              {/* Export Options */}
              <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Export Your Saved Providers
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const data = filteredProviders.map(p => ({
                        name: p.name,
                        phone: p.phone,
                        email: p.email,
                        website: p.website,
                        services: p.services.join(', '),
                        coverage: formatCoverageDisplay(p.coverage)
                      }))
                      const csv = [
                        'Name,Phone,Email,Website,Services,Coverage',
                        ...data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','))
                      ].join('\n')
                      
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'saved-providers.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Export as CSV
                  </button>
                  
                  <button
                    onClick={() => {
                      const text = filteredProviders.map(p => 
                        `${p.name}\n` +
                        `Phone: ${p.phone || 'Not provided'}\n` +
                        `Email: ${p.email || 'Not provided'}\n` +
                        `Website: ${p.website || 'Not provided'}\n` +
                        `Services: ${p.services.join(', ')}\n` +
                        `Coverage: ${formatCoverageDisplay(p.coverage)}\n\n`
                      ).join('')
                      
                      navigator.clipboard.writeText(text).then(() => {
                        alert('Provider list copied to clipboard!')
                      }).catch(() => {
                        alert('Failed to copy to clipboard')
                      })
                    }}
                    className="border border-primary-600 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Provider Details Modal */}
        <ProviderDetailsModal
          provider={selectedProvider}
          isOpen={!!selectedProvider}
          onClose={() => setSelectedProvider(null)}
          currentLocation="Saved Providers"
        />
      </div>
    </>
  )
}