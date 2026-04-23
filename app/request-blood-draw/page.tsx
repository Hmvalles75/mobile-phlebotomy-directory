'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { captureAttribution } from '@/lib/attribution'

function RequestBloodDrawForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCity = searchParams.get('city') || ''
  const initialState = searchParams.get('state') || ''

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    zip: '',
    city: initialCity,
    state: initialState,
    address1: '',
    urgency: 'STANDARD' as 'STANDARD' | 'STAT',
    notes: '',
    // Lead screening (replaces the old 3-step conditional flow)
    drawCount: '1-3' as '1-3' | '4-19' | '20+',
    hasDoctorOrder: '' as '' | 'yes' | 'no' | 'need_help',
    paymentMethod: '' as '' | 'insurance' | 'out_of_pocket' | 'not_sure',
  })

  const showDoctorOrderWarning = formData.hasDoctorOrder === 'no'
  const showPricingNote = formData.paymentMethod === 'not_sure'

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [coverageData, setCoverageData] = useState<{
    providerCount: number
    coverage: 'high' | 'low'
    affiliateUrl?: string
  } | null>(null)

  // Check coverage when city and state are available
  useEffect(() => {
    const checkCoverage = async () => {
      if (formData.city && formData.state && formData.state.length === 2) {
        try {
          const response = await fetch('/api/check-coverage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: formData.city, state: formData.state })
          })
          const data = await response.json()
          if (data.ok) {
            setCoverageData({
              providerCount: data.providerCount,
              coverage: data.coverage,
              affiliateUrl: data.affiliateUrl
            })
          }
        } catch (error) {
          console.error('Coverage check error:', error)
        }
      }
    }
    checkCoverage()
  }, [formData.city, formData.state])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Require the two screening questions since they're button inputs (no native "required")
    if (!formData.hasDoctorOrder) {
      setError('Please answer whether you have a doctor\'s order.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!formData.paymentMethod) {
      setError('Please select how you\'ll be paying.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          labPreference: 'Other/Unsure',
          drawCount: formData.drawCount,
          hasDoctorOrder: formData.hasDoctorOrder || undefined,
          paymentMethod: formData.paymentMethod || undefined,
          attribution: captureAttribution(),
        })
      })

      const data = await response.json()

      if (data.ok) {
        setSubmitted(true)
        // Scroll to success message
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      } else {
        setError(data.error || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Lead submission error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl w-full border-2 border-green-200">
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Request Received!
            </h1>
            <p className="text-gray-700 text-lg mb-6">
              Thank you for your request. We&apos;re connecting you with certified mobile phlebotomists in your area.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">What Happens Next?</h3>
              <ul className="text-left text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Local providers will review your request within 1-2 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>You&apos;ll receive calls/texts from available phlebotomists</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Choose the provider that best fits your schedule and budget</span>
                </li>
              </ul>
            </div>
            <p className="text-sm text-gray-500">
              Check your email at <strong>{formData.email}</strong> for confirmation.
            </p>
            <Link href="/" className="inline-block mt-6 text-primary-600 hover:text-primary-700 font-medium">
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
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="mr-2" size={20} />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Request a Mobile Blood Draw
            </h1>
            <p className="text-gray-600 mb-8">
              Fill out the form below and we&apos;ll connect you with certified mobile phlebotomists in your area.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1 — Draw count (first screening question) */}
              <div className="border-b pb-6">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  How many draws do you need? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: '1-3',   label: '1–3 draws',     hint: 'One person or family' },
                    { value: '4-19',  label: '4–19 draws',    hint: 'Small group or clinic' },
                    { value: '20+',   label: '20+ draws',     hint: 'Organization or clinical study' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, drawCount: opt.value as typeof formData.drawCount }))}
                      className={`text-left px-4 py-3 border-2 rounded-lg transition-all ${
                        formData.drawCount === opt.value
                          ? 'border-primary-600 bg-primary-50 text-primary-900'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opt.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 — Doctor's order (required, soft-warn on "no") */}
              <div className="border-b pb-6">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Do you have a doctor&apos;s order? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'yes',       label: 'Yes' },
                    { value: 'no',        label: 'No' },
                    { value: 'need_help', label: 'I need help getting one' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, hasDoctorOrder: opt.value as typeof formData.hasDoctorOrder }))}
                      className={`text-left px-4 py-3 border-2 rounded-lg transition-all ${
                        formData.hasDoctorOrder === opt.value
                          ? 'border-primary-600 bg-primary-50 text-primary-900'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                    </button>
                  ))}
                </div>
                {showDoctorOrderWarning && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                    <strong>Heads up:</strong> most mobile phlebotomists require a physician&apos;s order. You may still submit this request — a provider will follow up and can discuss options with you.
                  </div>
                )}
              </div>

              {/* Step 3 — Payment readiness (required, pricing disclosure on "not_sure") */}
              <div className="border-b pb-6">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  How will you be paying? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'insurance',     label: 'Insurance' },
                    { value: 'out_of_pocket', label: 'Out of pocket' },
                    { value: 'not_sure',      label: 'Not sure' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: opt.value as typeof formData.paymentMethod }))}
                      className={`text-left px-4 py-3 border-2 rounded-lg transition-all ${
                        formData.paymentMethod === opt.value
                          ? 'border-primary-600 bg-primary-50 text-primary-900'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                    </button>
                  ))}
                </div>
                {showPricingNote && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                    Rates typically range from <strong>$75–$150 per visit</strong>. The provider will confirm exact pricing when they contact you.
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      maxLength={5}
                      pattern="[0-9]{5}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      maxLength={2}
                      placeholder="CA"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address (Optional)
                    </label>
                    <input
                      type="text"
                      name="address1"
                      value={formData.address1}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="STANDARD">Standard (within 24-48 hours)</option>
                      <option value="STAT">STAT (same-day or urgent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Any special requirements or questions..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By submitting this form, you agree to be contacted by mobile phlebotomy providers.
              </p>
            </form>
          </div>

          {/* Low Coverage Affiliate Fallback */}
          {coverageData && coverageData.coverage === 'low' && coverageData.affiliateUrl && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-blue-500 text-2xl">ℹ️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Limited Provider Availability in Your Area
                  </h3>
                  <p className="text-blue-800 text-sm mb-3">
                    We found {coverageData.providerCount} provider{coverageData.providerCount !== 1 ? 's' : ''} in your ZIP code.
                    For guaranteed same-day or next-day service, you may want to check our trusted nationwide partner.
                  </p>
                  <a
                    href={coverageData.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Check Speedy Sticks Availability
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <p className="text-xs text-blue-600 mt-3">
                    We may earn a commission if you book through this partner link, at no extra cost to you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* High Coverage Confirmation */}
          {coverageData && coverageData.coverage === 'high' && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-green-500 text-2xl">✓</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">
                    Great News! Excellent Coverage in Your Area.
                  </h3>
                  <p className="text-green-800 text-sm">
                    We found {coverageData.providerCount} certified providers serving your ZIP code.
                    Submit the form above and we will immediately match your request to the top 3-5 best-rated professionals. They will contact you shortly to confirm pricing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RequestBloodDrawPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <RequestBloodDrawForm />
    </Suspense>
  )
}
