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
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            {/* Icon and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <span className="text-5xl">🔜</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Patient Lead Requests - Coming Soon
              </h1>
              <p className="text-xl text-gray-600">
                We&apos;re launching our patient request system soon!
              </p>
            </div>

            {/* What You Can Do Now */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">For now, you can:</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-gray-700 font-medium">Search our directory of mobile phlebotomy providers</p>
                    <p className="text-sm text-gray-500 mt-1">Browse verified providers in your area</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-gray-700 font-medium">Contact providers directly from their profiles</p>
                    <p className="text-sm text-gray-500 mt-1">Call or visit their websites to schedule appointments</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-gray-700 font-medium">Check back in 2-3 weeks for our lead request feature</p>
                    <p className="text-sm text-gray-500 mt-1">We&apos;re working hard to launch this service</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Signup */}
            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6">
              <div className="flex items-start mb-4">
                <Mail className="text-blue-600 mr-3 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Want to be notified when we launch?
                  </h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Enter your email and we&apos;ll send you an update as soon as our patient request system is live.
                  </p>
                </div>
              </div>

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
                  {isLoading ? 'Saving...' : 'Notify Me When Available'}
                </button>
              </form>
            </div>

            {/* Search Directory CTA */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Search Provider Directory
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
