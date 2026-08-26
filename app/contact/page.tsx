'use client'

import { useState } from 'react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'patient'
  })
  // Honeypot — never shown to humans.
  const [websiteUrl, setWebsiteUrl] = useState('')

  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setErrorMessage('')
    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, website_url: websiteUrl }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) {
        setErrorMessage(json.message || 'Something went wrong. Please email hector@mobilephlebotomy.org directly.')
        setStatus('error')
        return
      }
      setStatus('sent')
    } catch {
      setErrorMessage('We could not reach the server. Please email hector@mobilephlebotomy.org directly.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-xl text-gray-600">
              We&apos;re here to help! Reach out with any questions or feedback.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              
              {status === 'sent' ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <h3 className="font-semibold text-green-900 mb-2">Message sent</h3>
                  <p className="text-green-800 text-sm">
                    Thanks {formData.name.split(' ')[0] || 'for reaching out'} — your message is with us
                    and Hector will reply to {formData.email} personally, usually within one business day.
                  </p>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Honeypot — off-screen, unfocusable, hidden from assistive tech. */}
                <input
                  type="text"
                  name="website_url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  style={{ position: 'absolute', left: '-9999px' }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    I am a... *
                  </label>
                  <select
                    required
                    value={formData.userType}
                    onChange={(e) => setFormData(prev => ({...prev, userType: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="patient">Patient looking for services</option>
                    <option value="provider">Healthcare provider</option>
                    <option value="business">Business/Corporate client</option>
                    <option value="media">Media/Press inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({...prev, subject: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Please provide details about your question or request..."
                  />
                </div>

                {status === 'error' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-red-800 text-sm">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
              )}
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Get in Touch</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-primary-600 text-xl">📧</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Email Support</h4>
                      <p className="text-gray-600">hector@mobilephlebotomy.org</p>
                      <p className="text-sm text-gray-500">We respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="text-primary-600 text-xl">📞</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Phone Support</h4>
                      <p className="text-gray-600">(909) 784-5734</p>
                      <p className="text-sm text-gray-500">Mon-Fri, 9am-6pm EST</p>
                    </div>
                  </div>

                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">How do I find providers in my area?</h4>
                    <p className="text-sm text-gray-600">Use our search feature to find mobile phlebotomy services near you. You can filter by location, services, and more.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">How much do services typically cost?</h4>
                    <p className="text-sm text-gray-600">Costs vary by provider and service. Contact providers directly for accurate pricing information.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Are all providers licensed and insured?</h4>
                    <p className="text-sm text-gray-600">We verify that all providers meet our quality standards, including proper licensing and insurance requirements.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">How do I add my practice to the directory?</h4>
                    <p className="text-sm text-gray-600">Use our &quot;Add Provider&quot; page to submit your information. We&apos;ll review and add your listing within 24-48 hours.</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-primary-900 mb-2">Need Immediate Help?</h3>
                <p className="text-primary-800 text-sm">
                  For urgent inquiries or technical issues, please call our support line at (909) 784-5734.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}