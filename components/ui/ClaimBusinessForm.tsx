'use client'

import { useState } from 'react'

interface ClaimBusinessFormProps {
  providerId: string
  providerName: string
  onClose?: () => void
}

export function ClaimBusinessForm({ providerId, providerName, onClose }: ClaimBusinessFormProps) {
  const [formData, setFormData] = useState({
    claimantName: '',
    claimantEmail: '',
    claimantPhone: '',
    requestedUpdates: '',
    isOwnerConfirmed: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!formData.isOwnerConfirmed) {
      setError('Please confirm you are authorized to manage this listing')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/claim-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          providerName,
          ...formData
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
      } else {
        setError(data.error || 'Failed to submit claim. Please try again.')
      }
    } catch (error) {
      console.error('Claim submission error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Claim Submitted Successfully!
          </h3>
          <p className="text-gray-600 mb-6">
            Thanks for claiming <strong>{providerName}</strong>. We'll review your submission and send a verification email to <strong>{formData.claimantEmail}</strong> within 24 hours.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please check your email and reply to confirm you're authorized to manage this listing. Once verified, we'll add a "Verified Listing" badge to your page.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Claim This Business</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <p className="text-gray-600 mb-6">
        Are you the owner or authorized representative of <strong>{providerName}</strong>?
        Claim this listing to update your information and get a verified badge.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name (pre-filled, read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name
          </label>
          <input
            type="text"
            value={providerName}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        {/* Your Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            required
            value={formData.claimantName}
            onChange={(e) => setFormData(prev => ({...prev, claimantName: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="John Smith"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Email (Business Email Preferred) *
          </label>
          <input
            type="email"
            required
            value={formData.claimantEmail}
            onChange={(e) => setFormData(prev => ({...prev, claimantEmail: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="owner@yourcompany.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Using your business email helps us verify ownership faster
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.claimantPhone}
            onChange={(e) => setFormData(prev => ({...prev, claimantPhone: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Requested Updates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to update? *
          </label>
          <textarea
            required
            rows={4}
            value={formData.requestedUpdates}
            onChange={(e) => setFormData(prev => ({...prev, requestedUpdates: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Please describe what information needs to be updated (e.g., phone number, address, services, hours, etc.)"
          />
        </div>

        {/* Owner Confirmation */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              required
              checked={formData.isOwnerConfirmed}
              onChange={(e) => setFormData(prev => ({...prev, isOwnerConfirmed: e.target.checked}))}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              I confirm that I am the owner or an authorized representative of this business
              and have the right to manage this listing. *
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
