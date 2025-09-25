'use client'

import { useState, useEffect, useRef } from 'react'
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
  enableAutocomplete?: boolean
}

interface AutocompleteSuggestion {
  type: 'city' | 'state' | 'provider' | 'service'
  display: string
  value: string
  category: string
}

export function AutocompleteSearchBar({
  placeholder = "Enter ZIP code or city...",
  onSearch,
  onChange,
  value,
  className,
  showLocationInput = false,
  onLocationChange,
  enableZipCodeRouting = false,
  enableAutocomplete = true
}: SearchBarProps) {
  const [internalQuery, setInternalQuery] = useState('')
  const [location, setLocation] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Use controlled or uncontrolled value
  const query = value !== undefined ? value : internalQuery

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (!enableAutocomplete || !query || query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true)
      try {
        const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setSuggestions(data || [])
        setShowSuggestions(data?.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, enableAutocomplete])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          selectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Select a suggestion
  const selectSuggestion = (suggestion: AutocompleteSuggestion) => {
    const newQuery = suggestion.value
    handleInputChange(newQuery)
    setShowSuggestions(false)
    setSelectedIndex(-1)

    // Auto-submit the search
    setTimeout(() => {
      onSearch?.(newQuery)
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)

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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((groups, suggestion, index) => {
    const category = suggestion.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push({ ...suggestion, originalIndex: index })
    return groups
  }, {} as Record<string, (AutocompleteSuggestion & { originalIndex: number })[]>)

  return (
    <div className={cn("w-full max-w-2xl mx-auto relative", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            aria-label="Search location"
            autoComplete="off"
          />

          {/* Autocomplete Dropdown */}
          {enableAutocomplete && showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
            >
              {isLoadingSuggestions ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  Searching...
                </div>
              ) : (
                <div>
                  {Object.entries(groupedSuggestions).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">
                        {category}
                      </div>
                      {items.map((suggestion) => (
                        <button
                          key={suggestion.originalIndex}
                          type="button"
                          onClick={() => selectSuggestion(suggestion)}
                          className={cn(
                            "w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-50 last:border-b-0",
                            selectedIndex === suggestion.originalIndex && "bg-primary-50 text-primary-900"
                          )}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {suggestion.display}
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}

                  {suggestions.length === 0 && !isLoadingSuggestions && query.length >= 2 && (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      No suggestions found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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