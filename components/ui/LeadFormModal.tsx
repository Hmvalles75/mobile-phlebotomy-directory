'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { ga4 } from '@/lib/ga4'

interface LeadFormModalProps {
  isOpen: boolean
  onClose: () => void
  defaultCity?: string
  defaultState?: string
  defaultZip?: string
}

export function LeadFormModal({
  isOpen,
  onClose,
  defaultCity = '',
  defaultState = '',
  defaultZip = ''
}: LeadFormModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address1: '',
    city: defaultCity,
    state: defaultState,
    zip: defaultZip,
    urgency: 'STANDARD' as 'STANDARD' | 'STAT',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formStarted, setFormStarted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Track form start on first field interaction (once per session)
    if (!formStarted && value.trim().length > 0) {
      setFormStarted(true)
      ga4.leadFormStart({ first_field: name })
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name is required (at least 2 characters)'
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      newErrors.phone = 'Valid phone number is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim() || formData.state.trim().length !== 2) {
      newErrors.state = 'State code is required (2 letters)'
    }

    if (!formData.zip.trim() || formData.zip.trim().length < 5) {
      newErrors.zip = 'Valid ZIP code is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)
    setSubmitError('')

    // Track submit attempt
    ga4.leadSubmitAttempt({
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      urgency: formData.urgency
    })

    try {
      const response = await fetch('/api/lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      // Determine location_type from URL
      let locationType: 'city' | 'metro' | 'state' | 'not_found' = 'city'
      if (typeof window !== 'undefined') {
        const path = window.location.pathname
        if (path.includes('/metro/')) locationType = 'metro'
        else if (path.match(/\/us\/[a-z]{2}$/)) locationType = 'state'
        else if (!path.includes('/us/')) locationType = 'not_found'
      }

      // Track success with lead_id and location_type
      ga4.leadSubmitSuccess({
        lead_id: data.leadId || data.id,
        location_type: locationType,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        urgency: formData.urgency,
        provider_status: data.status
      })

      setSubmitted(true)

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose()
        // Reset form after close
        setTimeout(() => {
          setFormData({
            fullName: '',
            phone: '',
            email: '',
            address1: '',
            city: defaultCity,
            state: defaultState,
            zip: defaultZip,
            urgency: 'STANDARD',
            notes: ''
          })
          setSubmitted(false)
          setFormStarted(false)
        }, 300)
      }, 3000)
    } catch (error: any) {
      console.error('Submit error:', error)
      const errorMessage = error.message || 'Failed to submit request. Please try again.'
      setSubmitError(errorMessage)

      // Track error
      ga4.leadSubmitError({
        error_code: error.code || 'SUBMIT_FAILED',
        error_message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Request Submitted!
              </h2>
              <p className="text-gray-600">
                A licensed mobile phlebotomist will contact you shortly to schedule your appointment.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Request a Home Blood Draw
              </h2>
              <p className="text-gray-600 mb-6">
                Fill out the form below and a licensed phlebotomist will contact you to schedule your appointment.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="John Doe"
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
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Email (optional) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
                    Address (optional)
                  </label>
                  <input
                    type="text"
                    id="address1"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main St"
                  />
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      maxLength={2}
                      className={`w-full px-3 py-2 border rounded-md uppercase ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="CA"
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="zip"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    maxLength={10}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.zip ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="12345"
                  />
                  {errors.zip && (
                    <p className="text-red-500 text-sm mt-1">{errors.zip}</p>
                  )}
                </div>

                {/* Urgency */}
                <div>
                  <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
                    When do you need service?
                  </label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="STANDARD">Standard (1-2 business days)</option>
                    <option value="STAT">STAT/Urgent (same day)</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any special requirements or questions..."
                  />
                </div>

                {/* Privacy Notice */}
                <p className="text-xs text-gray-500">
                  By submitting, you consent to be contacted by a licensed mobile phlebotomist regarding your request.
                </p>

                {/* Error Message */}
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{submitError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Submitting...' : 'Request Blood Draw'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
