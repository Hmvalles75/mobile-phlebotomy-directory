import { useState, useEffect, useRef } from 'react'

interface ZipLookupResult {
  city: string
  state: string
  isLoading: boolean
  error: string | null
  lookupFailed: boolean
}

/**
 * Hook to lookup city/state from ZIP code using /api/zip-lookup
 * Includes debouncing to prevent excessive API calls
 *
 * @param zip - 5-digit ZIP code
 * @param defaultCity - Fallback city if lookup fails
 * @param defaultState - Fallback state if lookup fails
 * @param debounceMs - Debounce delay in milliseconds (default 400ms)
 */
export function useZipLookup(
  zip: string,
  defaultCity: string = 'Los Angeles',
  defaultState: string = 'CA',
  debounceMs: number = 400
): ZipLookupResult {
  const [city, setCity] = useState(defaultCity)
  const [state, setState] = useState(defaultState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lookupFailed, setLookupFailed] = useState(false)

  // Track the last looked-up ZIP to avoid duplicate calls
  const lastLookedUpZip = useRef<string>('')

  useEffect(() => {
    // Only lookup if ZIP is exactly 5 digits
    if (!/^\d{5}$/.test(zip)) {
      // Reset to defaults if ZIP is incomplete
      if (zip.length < 5) {
        setCity(defaultCity)
        setState(defaultState)
        setLookupFailed(false)
        lastLookedUpZip.current = ''
      }
      return
    }

    // Skip if we already looked up this ZIP
    if (zip === lastLookedUpZip.current) {
      return
    }

    // Debounce the lookup
    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/zip-lookup?zip=${zip}`)
        const data = await response.json()

        if (response.ok && data.ok) {
          setCity(data.city)
          setState(data.state)
          setLookupFailed(false)
          lastLookedUpZip.current = zip
        } else {
          // Lookup failed - use defaults
          setCity(defaultCity)
          setState(defaultState)
          setLookupFailed(true)
          setError(data.error || 'ZIP not found')
        }
      } catch (err) {
        console.error('ZIP lookup error:', err)
        setCity(defaultCity)
        setState(defaultState)
        setLookupFailed(true)
        setError('Failed to verify ZIP code')
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [zip, defaultCity, defaultState, debounceMs])

  return { city, state, isLoading, error, lookupFailed }
}

/**
 * Simple ZIP validation
 */
export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip)
}
