'use client'

import { useState } from 'react'

const EVENT_TYPES = [
  'Corporate wellness',
  'Conference/trade show',
  'Clinical trial/research',
  'Insurance exams',
  'Health fair/community',
  'Other'
]

export function CorporateQuoteForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    eventLocation: '',
    eventVenue: '',
    eventDates: '',
    estimatedDraws: '',
    estimatedPhlebotomists: '',
    eventType: [] as string[],
    additionalDetails: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleEventTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      eventType: prev.eventType.includes(type)
        ? prev.eventType.filter(t => t !== type)
        : [...prev.eventType, type]
    }))
    if (errors.eventType) {
      setErrors(prev => ({ ...prev, eventType: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.companyName.trim() || formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name is required'
    }

    if (!formData.contactName.trim() || formData.contactName.trim().length < 2) {
      newErrors.contactName = 'Contact name is required'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Valid email is required'
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      newErrors.phone = 'Phone number is required'
    }

    if (!formData.eventLocation.trim()) {
      newErrors.eventLocation = 'Event location is required'
    }

    if (!formData.eventDates.trim()) {
      newErrors.eventDates = 'Event dates are required'
    }

    if (!formData.estimatedDraws.trim()) {
      newErrors.estimatedDraws = 'Estimated number of blood draws is required'
    }

    if (formData.eventType.length === 0) {
      newErrors.eventType = 'Please select at least one event type'
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

    try {
      const response = await fetch('/api/corporate/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eventType: formData.eventType.join(', ')
        })
      })

      const data = await response.json()

      if (data.ok) {
        setSubmitted(true)
        // Scroll to the success message smoothly
        setTimeout(() => {
          document.getElementById('quote-form')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }, 100)
      } else {
        setSubmitError(data.error || 'Failed to submit inquiry. Please try again.')
      }
    } catch (error) {
      console.error('Corporate inquiry submission error:', error)
      setSubmitError('Network error. Please try again or contact us directly at hector@mobilephlebotomy.org')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 border-2 border-green-200">
        <div className="text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Inquiry Submitted Successfully!
          </h3>
          <p className="text-gray-700 mb-6">
            Thank you for your interest in our corporate phlebotomy staffing services.
          </p>
          <p className="text-gray-600">
            We'll review your event details and follow up within 24-48 hours with a staffing proposal and pricing quote.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Check your email at <strong>{formData.email}</strong> for a confirmation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8" id="quote-form">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Request a Corporate/Event Staffing Quote
      </h3>
      <p className="text-gray-600 mb-8">
        Tell us about your event and we'll coordinate certified phlebotomists to meet your needs.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.companyName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Acme Corporation"
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.contactName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John Smith"
            />
            {errors.contactName && (
              <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="john@company.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(555) 123-4567"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Location (City, State) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="eventLocation"
                value={formData.eventLocation}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.eventLocation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Chicago, IL"
              />
              {errors.eventLocation && (
                <p className="text-red-500 text-sm mt-1">{errors.eventLocation}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Venue (Optional)
              </label>
              <input
                type="text"
                name="eventVenue"
                value={formData.eventVenue}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="McCormick Place"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Dates <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="eventDates"
                value={formData.eventDates}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.eventDates ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="March 15-17, 2026"
              />
              {errors.eventDates && (
                <p className="text-red-500 text-sm mt-1">{errors.eventDates}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Blood Draws <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="estimatedDraws"
                value={formData.estimatedDraws}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.estimatedDraws ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="50-100"
              />
              {errors.estimatedDraws && (
                <p className="text-red-500 text-sm mt-1">{errors.estimatedDraws}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Phlebotomists Needed (Optional)
            </label>
            <input
              type="text"
              name="estimatedPhlebotomists"
              value={formData.estimatedPhlebotomists}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="2-3"
            />
            <p className="text-sm text-gray-500 mt-1">
              If unsure, we'll help you determine the right staffing level
            </p>
          </div>
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type of Event <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EVENT_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleEventTypeToggle(type)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
                  formData.eventType.includes(type)
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {formData.eventType.includes(type) && (
                  <span className="mr-2">✓</span>
                )}
                {type}
              </button>
            ))}
          </div>
          {errors.eventType && (
            <p className="text-red-500 text-sm mt-2">{errors.eventType}</p>
          )}
        </div>

        {/* Additional Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Details
          </label>
          <textarea
            name="additionalDetails"
            value={formData.additionalDetails}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Any special requirements, lab kits, shipping needs, or other details..."
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
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By submitting this form, you agree to be contacted about your inquiry.
        </p>
      </form>
    </div>
  )
}
