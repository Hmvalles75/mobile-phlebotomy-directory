'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.ok) {
        setMessage({
          type: 'success',
          text: 'Thanks! We\'ll notify you when patient requests launch.'
        })
        setEmail('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save email' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="mr-2" size={20} />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6">
            {/* Headline and Intro */}
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Need a Mobile Blood Draw? We&apos;re Opening Requests Soon
              </h1>
              <p className="text-lg text-gray-600">
                We&apos;re finalizing our nationwide mobile phlebotomy booking feature. While we finish setup, here&apos;s how you can get help right now.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Option 1 - Contact Local Providers */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                🩸 Option 1 — Contact Local Providers Directly
              </h2>
              <p className="text-gray-700">
                Browse our directory of mobile phlebotomists and reach out to them directly to schedule your blood draw.
              </p>
              <Link
                href="/search"
                className="inline-block w-full md:w-auto px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-center shadow-lg hover:shadow-xl"
              >
                Search Local Providers
              </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Option 2 - Get Notified */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                ⚡ Option 2 — Get Notified When Nationwide Booking Opens
              </h2>
              <p className="text-gray-700">
                We&apos;re launching a nationwide &quot;Book a Mobile Phlebotomist&quot; feature soon. Enter your email and we&apos;ll alert you the moment it goes live.
              </p>

              {/* Email Form */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                    />
                  </div>

                  {message && (
                    <div
                      className={`rounded-lg p-4 ${
                        message.type === 'success'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          message.type === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {message.text}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Notify Me When It Launches'}
                  </button>
                </form>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                We&apos;re also building a direct request system where you submit one form and mobile phlebotomists can contact you with availability. Stay tuned.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
