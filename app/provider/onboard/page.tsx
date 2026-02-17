'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Phone, Mail, MapPin, FileText } from 'lucide-react'

interface ProviderData {
  id: string
  name: string
  email: string | null
  phone: string | null
  phonePublic: string | null
  zipCodes: string | null
  serviceRadiusMiles: number | null
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<ProviderData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    zipCodes: '',
    serviceRadiusMiles: 25,
    smsConsent: false,
    termsAccepted: false
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing onboarding token.')
      setLoading(false)
      return
    }

    // Fetch provider data using token
    fetch(`/api/provider/onboard?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.provider) {
          setProvider(data.provider)
          setFormData(prev => ({
            ...prev,
            email: data.provider.email || data.provider.claimEmail || '',
            phone: data.provider.phonePublic || data.provider.phone || '',
            zipCodes: data.provider.zipCodes || '',
            serviceRadiusMiles: data.provider.serviceRadiusMiles || 25
          }))
        } else {
          setError(data.error || 'Invalid or expired token.')
        }
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load onboarding data.')
        setLoading(false)
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.smsConsent) {
      alert('Please consent to receiving SMS lead alerts to continue.')
      return
    }

    if (!formData.termsAccepted) {
      alert('Please accept the terms of service to continue.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/provider/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ...formData
        })
      })

      const data = await res.json()

      if (data.ok) {
        setSuccess(true)
      } else {
        alert(data.error || 'Failed to complete onboarding.')
      }
    } catch (err) {
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="mailto:support@mobilephlebotomy.org"
            className="text-primary-600 hover:text-primary-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Complete!</h1>
          <p className="text-gray-600 mb-6">
            You&apos;re now set up to receive lead alerts via SMS. When a patient requests
            mobile phlebotomy in your service area, you&apos;ll get a text message with
            details to claim the lead.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>What happens next?</strong><br />
              When a qualified lead comes in your area, you&apos;ll receive an SMS like:<br />
              <code className="text-xs bg-green-100 px-2 py-1 rounded mt-2 block">
                New CONFIRMED request: ZIP 90210, Time: tomorrow 9-12. Reply YES to claim.
              </code>
            </p>
          </div>
          <a
            href="/dashboard/login"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold">Complete Your Provider Onboarding</h1>
            <p className="mt-2 opacity-90">
              Set up your account to receive patient leads via SMS
            </p>
          </div>

          {/* Provider Info */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <p className="text-sm text-gray-600">
              Onboarding for: <strong className="text-gray-900">{provider?.name}</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="your@email.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                We&apos;ll send important account notifications here
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} />
                Mobile Phone Number (for SMS alerts)
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="(555) 123-4567"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is where you&apos;ll receive lead alerts. Make sure it can receive SMS.
              </p>
            </div>

            {/* ZIP Codes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} />
                Service ZIP Code(s)
              </label>
              <input
                type="text"
                required
                value={formData.zipCodes}
                onChange={(e) => setFormData({ ...formData, zipCodes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="90210, 90211, 90212"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter your primary ZIP code. You can add multiple separated by commas.
              </p>
            </div>

            {/* Service Radius */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Service Radius (miles)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={formData.serviceRadiusMiles}
                  onChange={(e) => setFormData({ ...formData, serviceRadiusMiles: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-gray-900 w-16 text-center">
                  {formData.serviceRadiusMiles} mi
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                You&apos;ll receive leads within this distance from your ZIP code(s)
              </p>
            </div>

            {/* SMS Consent - CRITICAL FOR COMPLIANCE */}
            <div className="bg-blue-50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smsConsent}
                  onChange={(e) => setFormData({ ...formData, smsConsent: e.target.checked })}
                  className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    I consent to receiving SMS lead alerts
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    By checking this box, I agree to receive SMS messages from MobilePhlebotomy.org
                    regarding patient lead opportunities in my service area. Message frequency varies.
                    Standard message and data rates may apply. Reply STOP to opt out at any time.
                  </p>
                </div>
              </label>
            </div>

            {/* Terms Acceptance */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    I accept the Terms of Service
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    By checking this box, I agree to the{' '}
                    <a href="/terms" className="text-primary-600 hover:underline" target="_blank">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary-600 hover:underline" target="_blank">
                      Privacy Policy
                    </a>.
                    I confirm that I am authorized to provide mobile phlebotomy services in my area.
                  </p>
                </div>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !formData.smsConsent || !formData.termsAccepted}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Completing Setup...' : 'Complete Onboarding & Start Receiving Leads'}
            </button>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
            Questions? Contact{' '}
            <a href="mailto:support@mobilephlebotomy.org" className="text-primary-600 hover:underline">
              support@mobilephlebotomy.org
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProviderOnboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
