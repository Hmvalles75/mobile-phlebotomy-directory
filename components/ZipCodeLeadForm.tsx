'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trackEvent } from '@/lib/ga4'
import {
  MARKET_CONFIG,
  isMarketLocked,
  getMarketRequestPathWithZip,
  getMarketMetroPath
} from '@/lib/config/market'

/**
 * ZipCodeLeadForm
 *
 * When market lock is enabled:
 * - Shows a simplified ZIP-only input
 * - Routes to /los-angeles/request?zip=XXXXX
 * - Includes secondary "Browse providers" link
 *
 * When market lock is disabled:
 * - Shows city + state inputs
 * - Routes to /request-blood-draw?city=...&state=...
 */
export function ZipCodeLeadForm() {
  const router = useRouter()
  const marketLocked = isMarketLocked()

  // ZIP-only state for market-locked flow
  const [zip, setZip] = useState('')
  const [zipError, setZipError] = useState('')

  // City/state for national flow
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [error, setError] = useState('')

  // Track hero view for LA
  useEffect(() => {
    if (marketLocked) {
      trackEvent('la_home_hero_view', { market: MARKET_CONFIG.MARKET_SLUG })
    }
  }, [marketLocked])

  // Validate ZIP code (5 digits)
  const isValidZip = (value: string) => /^\d{5}$/.test(value)

  const handleMarketLockedSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setZipError('')

    const trimmedZip = zip.trim()

    // Track submit attempt
    trackEvent('la_home_zip_submit', {
      market: MARKET_CONFIG.MARKET_SLUG,
      zip: trimmedZip
    })

    if (!trimmedZip) {
      trackEvent('la_home_zip_error', { error_message: 'empty_zip' })
      setZipError('Please enter your ZIP code')
      return
    }

    if (!isValidZip(trimmedZip)) {
      trackEvent('la_home_zip_error', { error_message: 'invalid_zip_format' })
      setZipError('Please enter a valid 5-digit ZIP code')
      return
    }

    // Track successful navigation
    trackEvent('la_home_to_request', {
      market: MARKET_CONFIG.MARKET_SLUG,
      zip: trimmedZip
    })

    // Route to market-specific request page with ZIP
    router.push(getMarketRequestPathWithZip(trimmedZip))
  }

  const handleNationalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!city.trim() || !state.trim()) {
      setError('Please enter both city and state')
      return
    }

    if (state.length !== 2) {
      setError('Please enter state as 2-letter code (e.g., CA, NY, TX)')
      return
    }

    // Route to national lead form
    router.push(`/request-blood-draw?city=${encodeURIComponent(city)}&state=${state.toUpperCase()}`)
  }

  // Market-locked: ZIP-focused form - ultra simple, conversion focused
  if (marketLocked) {
    return (
      <div className="max-w-md mx-auto">
        <form onSubmit={handleMarketLockedSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              id="zip"
              value={zip}
              onChange={(e) => {
                // Only allow digits, max 5
                const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                setZip(value)
                if (zipError) setZipError('')
              }}
              placeholder="Enter your ZIP code"
              maxLength={5}
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-full px-6 py-4 text-xl text-center border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 font-medium tracking-wider ${
                zipError ? 'border-red-400' : 'border-gray-200'
              }`}
              required
            />
            {zipError && (
              <p className="text-red-200 text-sm mt-2 bg-red-900/30 px-3 py-2 rounded">
                {zipError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={zip.length < 5}
            className="w-full px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-bold text-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Get Matched Now
          </button>
        </form>

        {/* Subtle secondary link */}
        <div className="text-center mt-4">
          <Link
            href={getMarketMetroPath()}
            className="text-white/60 hover:text-white/90 text-sm transition-colors"
          >
            Browse Los Angeles providers
          </Link>
        </div>
      </div>
    )
  }

  // National flow: City + State form
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/20 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Request a Mobile Blood Draw
        </h2>
        <p className="text-white/90 text-lg">
          Get matched with a certified local provider
        </p>
      </div>

      <form onSubmit={handleNationalSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-white mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Los Angeles"
              className="w-full px-4 py-3 text-lg border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-white/90 text-gray-900 placeholder-gray-500"
              required
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-white mb-2">
              State
            </label>
            <input
              type="text"
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="CA"
              maxLength={2}
              className="w-full px-4 py-3 text-lg border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-white/90 text-gray-900 placeholder-gray-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!city.trim() || state.length !== 2}
          className="w-full px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Find Providers
        </button>

        {error && (
          <p className="text-red-200 text-sm mt-2 bg-red-900/30 px-3 py-2 rounded">
            {error}
          </p>
        )}

        {/* Trust Signal */}
        <div className="flex items-center justify-center gap-2 text-white/90 text-sm">
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Vetted & Certified Phlebotomists Only</span>
        </div>
      </form>
    </div>
  )
}
