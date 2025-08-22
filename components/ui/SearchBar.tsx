'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { detectSearchType, handleZipCodeSearch } from '@/lib/zip-geocoding'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onChange?: (query: string) => void
  value?: string
  className?: string
  showLocationInput?: boolean
  onLocationChange?: (location: string) => void
  enableZipCodeRouting?: boolean
}

export function SearchBar({ 
  placeholder = "Enter ZIP code or city...", 
  onSearch, 
  onChange,
  value,
  className,
  showLocationInput = false,
  onLocationChange,
  enableZipCodeRouting = false
}: SearchBarProps) {
  const [internalQuery, setInternalQuery] = useState('')
  const [location, setLocation] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Use controlled or uncontrolled value
  const query = value !== undefined ? value : internalQuery

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) return
    
    // Enhanced ZIP code routing for homepage
    if (enableZipCodeRouting && detectSearchType(query) === 'zipcode') {
      setIsProcessing(true)
      try {
        const routing = await handleZipCodeSearch(query.trim())
        if (routing) {
          window.location.href = routing.route
          return
        }
      } catch (error) {
        console.error('Error processing ZIP code:', error)
        // Fall back to regular search
      } finally {
        setIsProcessing(false)
      }
    }
    
    // Regular search or fallback
    onSearch?.(query)
  }

  const handleInputChange = (newQuery: string) => {
    if (value === undefined) {
      setInternalQuery(newQuery)
    }
    onChange?.(newQuery)
  }

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLocationChange?.(location)
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            aria-label="Search location"
          />
        </div>
        <button
          type="submit"
          disabled={isProcessing}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Search"
        >
          {isProcessing ? 'Finding...' : 'Search'}
        </button>
      </form>
      
      {showLocationInput && (
        <form onSubmit={handleLocationSubmit} className="mt-2">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Refine by specific location..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
            aria-label="Location filter"
          />
        </form>
      )}
    </div>
  )
}