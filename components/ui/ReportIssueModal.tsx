'use client'

import { useState } from 'react'
import { ga4 } from '@/lib/ga4'

interface ReportIssueModalProps {
  isOpen: boolean
  onClose: () => void
  providerId: string
  providerName: string
}

export function ReportIssueModal({ isOpen, onClose, providerId, providerName }: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Track GA4 event
      ga4.reportSubmit({ provider_id: providerId, issue_type: issueType })

      const response = await fetch('/api/providers/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          reporterName: reporterName || undefined,
          reporterEmail: reporterEmail || undefined,
          issueType,
          description
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      setSubmitStatus('success')

      // Reset form and close after 2 seconds
      setTimeout(() => {
        setIssueType('')
        setDescription('')
        setReporterName('')
        setReporterEmail('')
        setSubmitStatus('idle')
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error submitting report:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Report Incorrect Information
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Help us keep our directory accurate by reporting issues with <strong>{providerName}</strong>.
          </p>

          {submitStatus === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">
                ✅ Report submitted successfully! Thank you for helping us improve our directory.
              </p>
            </div>
          ) : submitStatus === 'error' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium">
                ❌ {errorMessage}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Issue Type */}
              <div>
                <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-1">
                  What&apos;s the issue? <span className="text-red-500">*</span>
                </label>
                <select
                  id="issueType"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select an issue...</option>
                  <option value="phone">Incorrect phone number</option>
                  <option value="address">Incorrect address</option>
                  <option value="hours">Incorrect hours</option>
                  <option value="closed">Business is closed</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Please provide details <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={10}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
              </div>

              {/* Optional Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Contact Information (Optional)</p>
                <p className="text-xs text-gray-600">
                  Leave your contact info if you&apos;d like us to follow up with you.
                </p>

                <div>
                  <label htmlFor="reporterName" className="block text-sm text-gray-600 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="reporterName"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="reporterEmail" className="block text-sm text-gray-600 mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="reporterEmail"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !issueType || !description || description.length < 10}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
