'use client'

import { useState } from 'react'

interface InlineLeadFormProps {
  city: string
  state: string
  variant?: 'card' | 'no-results'
}

export default function InlineLeadForm({ city, state, variant = 'card' }: InlineLeadFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    zip: '',
    cityInput: '',
    urgency: 'STANDARD' as 'STANDARD' | 'STAT',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Lookup ZIP to get city/state, or use page defaults
      let submitCity = city || formData.cityInput
      let submitState = state

      if (formData.zip && formData.zip.length === 5) {
        try {
          const zipRes = await fetch(`/api/zip-lookup?zip=${formData.zip}`)
          const zipData = await zipRes.json()
          if (zipData.ok) {
            if (!submitCity) submitCity = zipData.city
            if (!submitState) submitState = zipData.state
          }
        } catch {
          // Fall back to page city/state
        }
      }

      const response = await fetch('/api/lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          city: submitCity,
          state: submitState,
          labPreference: 'Other/Unsure',
          source: 'inline_city_page',
        })
      })

      const data = await response.json()

      if (data.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Failed to submit. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={`rounded-xl p-8 text-center ${variant === 'no-results' ? 'bg-green-50 border-2 border-green-200' : 'bg-green-50'}`}>
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
        <p className="text-gray-600">
          We're matching you with a mobile phlebotomist in the {city}, {state} area.
          You'll hear from a provider shortly.
        </p>
      </div>
    )
  }

  const isNoResults = variant === 'no-results'

  return (
    <div className={`rounded-xl p-8 ${isNoResults ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {isNoResults
            ? `Need a Mobile Phlebotomist in ${city || state}?`
            : `Request a Mobile Blood Draw${city ? ` in ${city}` : ''}`
          }
        </h3>
        <p className="text-gray-600 text-sm">
          {isNoResults
            ? "Submit your info and we'll match you with a provider in your area — usually within a few hours."
            : "Fill out this quick form and a licensed phlebotomist will contact you to schedule."
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="(555) 555-5555"
            />
          </div>
        </div>

        <div className={`grid grid-cols-1 ${!city ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>
          {!city && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.cityInput}
                onChange={(e) => setFormData({ ...formData, cityInput: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your city"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
            <input
              type="text"
              required
              maxLength={5}
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value.replace(/\D/g, '') })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="ZIP code"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Any details — lab order, preferred time, special needs..."
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Request a Phlebotomist'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Free service — no fees, no obligation. A provider will reach out to schedule.
        </p>
      </form>
    </div>
  )
}
