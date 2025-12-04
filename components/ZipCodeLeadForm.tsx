'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ZipCodeLeadForm() {
  const router = useRouter()
  const [zipCode, setZipCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zipCode)) {
      setError('Please enter a valid 5-digit ZIP code')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/check-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      })

      const data = await response.json()

      if (data.ok) {
        if (data.action === 'lead_form') {
          // HIGH COVERAGE: Route to internal lead form
          router.push(`/request-blood-draw?zip=${zipCode}`)
        } else if (data.action === 'affiliate') {
          // LOW COVERAGE: Redirect to affiliate (Speedy Sticks)
          window.location.href = data.affiliateUrl
        }
      } else {
        setError(data.error || 'Failed to check coverage')
      }
    } catch (error) {
      console.error('Coverage check error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-white mb-2">
            Enter Your ZIP Code
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Enter ZIP code"
              maxLength={5}
              disabled={loading}
              className="flex-1 px-4 py-3 text-lg border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-white/90 text-gray-900 placeholder-gray-500 disabled:opacity-50"
              required
            />
            <button
              type="submit"
              disabled={loading || zipCode.length !== 5}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Checking...' : 'Find Providers'}
            </button>
          </div>
          {error && (
            <p className="text-red-200 text-sm mt-2 bg-red-900/30 px-3 py-2 rounded">
              {error}
            </p>
          )}
        </div>

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
