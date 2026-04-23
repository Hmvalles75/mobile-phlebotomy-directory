'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useZipLookup, isValidZip } from '@/hooks/useZipLookup'
import { ga4, trackEvent } from '@/lib/ga4'
import { MARKET_CONFIG, getMarketMetroPath, isInLACountyCoverage } from '@/lib/config/market'
import { captureAttribution } from '@/lib/attribution'

/**
 * Los Angeles Request Page
 *
 * Dedicated lead capture page for LA market.
 * Accepts ?zip=XXXXX and optional ?providerId=abc query params.
 *
 * Posts to existing /api/lead/submit endpoint.
 */

// Lab preference options
const LAB_OPTIONS = [
  { value: 'Labcorp', label: 'Labcorp' },
  { value: 'Quest', label: 'Quest Diagnostics' },
  { value: 'Any / No preference', label: 'Any / No preference' },
  { value: 'Other/Unsure', label: 'Other / Unsure' }
]

function LARequestForm() {
  const searchParams = useSearchParams()
  const initialZip = searchParams.get('zip') || ''
  const providerId = searchParams.get('providerId') || ''

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    zip: initialZip,
    address1: '',
    labPreference: 'Other/Unsure',
    urgency: 'STANDARD' as 'STANDARD' | 'STAT',
    notes: '',
    // Honeypot field - if filled, it's a bot
    companyWebsite: ''
  })

  // ZIP lookup for autofill
  const { city, state, isLoading: zipLoading, lookupFailed } = useZipLookup(
    formData.zip,
    MARKET_CONFIG.MARKET_NAME,
    MARKET_CONFIG.MARKET_STATE
  )

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formViewed, setFormViewed] = useState(false)

  // Track form view on mount
  useEffect(() => {
    if (!formViewed) {
      setFormViewed(true)
      ga4.leadFormOpen({ zip: formData.zip })
    }
  }, [formViewed, formData.zip])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    // Special handling for ZIP - only allow digits
    if (name === 'zip') {
      const cleanedValue = value.replace(/\D/g, '').slice(0, 5)
      setFormData(prev => ({ ...prev, zip: cleanedValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      newErrors.phone = 'Valid phone number is required'
    }

    if (!isValidZip(formData.zip)) {
      newErrors.zip = 'Please enter a valid 5-digit ZIP code'
    }

    if (!formData.labPreference) {
      newErrors.labPreference = 'Please select a lab preference'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Honeypot check - if filled, silently reject (looks like success to bots)
    if (formData.companyWebsite) {
      console.log('[Anti-spam] Honeypot triggered')
      setSubmitted(true)
      return
    }

    if (!validate()) {
      return
    }

    setLoading(true)
    setSubmitError('')

    // Track submit attempt
    ga4.leadSubmitAttempt({
      city,
      state,
      zip: formData.zip,
      urgency: formData.urgency
    })

    try {
      // Determine source based on ZIP coverage and provider attribution
      const inCoverage = isInLACountyCoverage(formData.zip)
      let source = 'la_request_page'
      if (providerId) {
        source = 'featured_provider_cta'
      } else if (!inCoverage) {
        source = 'la_request_out_of_area'
      }

      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || '',
        address1: formData.address1.trim() || '',
        city: city,
        state: state,
        zip: formData.zip,
        labPreference: formData.labPreference,
        urgency: formData.urgency,
        notes: formData.notes || '',
        // Tracking fields
        source,
        preferredProviderId: providerId || undefined,
        attribution: captureAttribution(),
      }

      const response = await fetch('/api/lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      // Track success
      ga4.leadSubmitSuccess({
        lead_id: data.leadId,
        city,
        state,
        zip: formData.zip
      })

      trackEvent('lead_submit_success', {
        source,
        zip: formData.zip,
        city,
        urgency: formData.urgency
      })

      setSubmitted(true)

      // Scroll to top
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)

    } catch (err: any) {
      console.error('Lead submission error:', err)
      setSubmitError(err.message || 'Something went wrong. Please try again.')

      ga4.leadSubmitError({
        error_message: err.message || 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full border-2 border-green-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Request Received
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              We&apos;re connecting you now.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Most patients are contacted within <strong>10-15 minutes</strong>.
                <br />
                Check your phone for a call or text from a local phlebotomist.
              </p>
            </div>
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-primary-600 font-medium text-sm"
          >
            <ArrowLeft className="mr-2" size={18} />
            Back
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          {/* Hero */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {MARKET_CONFIG.GEO_COPY.headline}
            </h1>
            <p className="text-gray-600">
              {MARKET_CONFIG.GEO_COPY.trustSignal}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="John Smith"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              {/* ZIP Code */}
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="zip"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.zip ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="90210"
                  />
                  {zipLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {errors.zip && (
                  <p className="text-red-500 text-sm mt-1">{errors.zip}</p>
                )}
                {/* Show city/state from ZIP lookup */}
                {isValidZip(formData.zip) && !zipLoading && (
                  <p className="text-gray-500 text-sm mt-1">
                    {lookupFailed ? (
                      <>We&apos;ll confirm your exact location by text.</>
                    ) : (
                      <>{city}, {state}</>
                    )}
                  </p>
                )}
                {/* Out-of-area message - show expansion notice */}
                {isValidZip(formData.zip) && !isInLACountyCoverage(formData.zip) && (
                  <div className="text-amber-700 text-sm mt-2 bg-amber-50 px-4 py-3 rounded border border-amber-200">
                    <p className="font-medium mb-1">We&apos;re currently expanding to your area.</p>
                    <p className="text-amber-600">Submit your info and we&apos;ll notify you when service becomes available.</p>
                  </div>
                )}
              </div>

              {/* Lab Preference */}
              <div>
                <label htmlFor="labPreference" className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Preference <span className="text-red-500">*</span>
                </label>
                <select
                  id="labPreference"
                  name="labPreference"
                  value={formData.labPreference}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.labPreference ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {LAB_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.labPreference && (
                  <p className="text-red-500 text-sm mt-1">{errors.labPreference}</p>
                )}
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When do you need service? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.urgency === 'STANDARD'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="urgency"
                      value="STANDARD"
                      checked={formData.urgency === 'STANDARD'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium">Standard</span>
                    <span className="text-xs text-gray-500">(24-48h)</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.urgency === 'STAT'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="urgency"
                      value="STAT"
                      checked={formData.urgency === 'STAT'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium">STAT</span>
                    <span className="text-xs text-gray-500">(Same day)</span>
                  </label>
                </div>
              </div>

              {/* Optional: Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {/* Optional: Address */}
              <div>
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  id="address1"
                  name="address1"
                  value={formData.address1}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="123 Main St, Apt 4B"
                />
              </div>

              {/* Optional: Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Any special requirements or questions..."
                />
              </div>

              {/* Honeypot - hidden from real users */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="companyWebsite">Company Website</label>
                <input
                  type="text"
                  id="companyWebsite"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </span>
                ) : (
                  'Get Connected'
                )}
              </button>

              {/* Trust line */}
              <p className="text-center text-xs text-gray-500">
                By submitting, you agree to be contacted by certified phlebotomists.
              </p>
            </form>
          </div>

          {/* Secondary link */}
          <div className="text-center mt-6">
            <Link
              href={getMarketMetroPath()}
              className="text-gray-500 hover:text-primary-600 text-sm underline hover:no-underline transition-colors"
            >
              Or browse {MARKET_CONFIG.MARKET_NAME} providers
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LARequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LARequestForm />
    </Suspense>
  )
}
