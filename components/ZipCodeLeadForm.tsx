'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ZipCodeLeadForm() {
  const router = useRouter()
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
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

    // Route to lead form with city and state
    router.push(`/request-blood-draw?city=${encodeURIComponent(city)}&state=${state.toUpperCase()}`)
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/20 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Need a Blood Draw Now?
        </h2>
        <p className="text-white/90 text-lg">
          Check Availability & Get Pricing
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
