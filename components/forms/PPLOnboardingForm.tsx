'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface FormData {
  businessName: string
  contactName: string
  email: string
  phone: string
  serviceZipCodes: string
  labsServiced: string[]
  agreedToTerms: boolean
}

const LAB_OPTIONS = [
  'Quest Diagnostics',
  'LabCorp',
  'BioReference',
  'Sonic Healthcare',
  'Hospital-based labs',
  'Independent labs',
  'Other'
]

export function PPLOnboardingForm() {
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    serviceZipCodes: '',
    labsServiced: [],
    agreedToTerms: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleLabToggle = (lab: string) => {
    setFormData(prev => ({
      ...prev,
      labsServiced: prev.labsServiced.includes(lab)
        ? prev.labsServiced.filter(l => l !== lab)
        : [...prev.labsServiced, lab]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!formData.agreedToTerms) {
      setError('You must agree to the Pay-Per-Lead terms to continue')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/provider/onboardPPL', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setProviderId(data.providerId)
      setSuccess(true)

      // Redirect to payment setup
      if (data.requiresPaymentSetup && data.providerId) {
        setIsRedirecting(true)

        const setupResponse = await fetch('/api/provider/createSetupSession', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId: data.providerId })
        })

        const setupData = await setupResponse.json()

        if (setupData.ok && setupData.url) {
          // Redirect to Stripe Checkout for payment method setup
          window.location.href = setupData.url
        } else {
          throw new Error('Failed to initialize payment setup')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setIsSubmitting(false)
      setIsRedirecting(false)
    }
  }

  if (success && isRedirecting) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Redirecting to Payment Setup...
          </h2>
          <p className="text-gray-600">
            Setting up your payment method to start receiving leads.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your Pay-Per-Lead application has been received. Please complete payment setup to start receiving patient leads.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Pay-Per-Lead Enrollment
      </h2>
      <p className="text-gray-600 mb-6">
        Join our lead generation network and receive qualified patient requests in your service area.
      </p>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Contact Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Service ZIP Codes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service ZIP Codes <span className="text-red-600">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={formData.serviceZipCodes}
            onChange={(e) => setFormData({ ...formData, serviceZipCodes: e.target.value })}
            placeholder="Enter ZIP codes separated by commas (e.g., 90210, 90211, 90212)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Labs Serviced */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Labs Serviced <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {LAB_OPTIONS.map((lab) => (
              <label key={lab} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.labsServiced.includes(lab)}
                  onChange={() => handleLabToggle(lab)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{lab}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Direct Pay-Per-Lead Terms</h3>
          <ul className="text-sm text-blue-800 space-y-1 mb-4">
            <li>• Standard leads: <strong>$20</strong> per qualified patient request</li>
            <li>• STAT (urgent) leads: <strong>$50</strong> per qualified patient request</li>
            <li>• You are charged directly when a lead is routed to you</li>
            <li>• Payment is processed automatically via your saved card</li>
            <li>• All leads are exclusive and delivered in real-time</li>
            <li>• No upfront costs - only pay when you receive a lead</li>
          </ul>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={formData.agreedToTerms}
              onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
              className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              <span className="text-red-600">*</span> I agree to the Direct Pay-Per-Lead terms, including a <strong>$20 to $50 charge</strong> per lead delivered to me
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.agreedToTerms}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
