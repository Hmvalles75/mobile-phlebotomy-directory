'use client'

import { useState } from 'react'

export default function AddProvider() {
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    services: [] as string[],
    address: '',
    city: '',
    state: '',
    zipCode: '',
    serviceArea: '',
    insurance: false,
    licensed: false,
    yearsExperience: '',
    leadOptIn: 'yes' as 'yes' | 'no',
    leadContactMethod: [] as string[],
    leadEmail: '',
    leadPhone: '',
    availability: [] as string[],
  })

  const serviceOptions = [
    'Blood Draw',
    'Lab Collection',
    'IV Therapy',
    'Wellness Testing',
    'Corporate Health Screenings',
    'Mobile Lab Services',
    'Diagnostic Testing',
    'Health Monitoring'
  ]

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      // Submit to API endpoint
      const response = await fetch('/api/submit-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Show success modal instead of alert
        setShowSuccessModal(true)

        // Reset form
        setFormData({
          businessName: '',
          contactName: '',
          email: '',
          phone: '',
          website: '',
          description: '',
          services: [],
          address: '',
          city: '',
          state: '',
          zipCode: '',
          serviceArea: '',
          insurance: false,
          licensed: false,
          yearsExperience: '',
          leadOptIn: 'yes',
          leadContactMethod: [],
          leadEmail: '',
          leadPhone: '',
          availability: [],
        })
      } else {
        // Show specific error message (including duplicate detection)
        alert(data.message || data.error || 'There was an error processing your submission. Please try again or contact us directly at hector@mobilephlebotomy.org')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('There was an error processing your submission. Please contact us directly at hector@mobilephlebotomy.org')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const handleContactMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      leadContactMethod: prev.leadContactMethod.includes(method)
        ? prev.leadContactMethod.filter(m => m !== method)
        : [...prev.leadContactMethod, method]
    }))
  }

  const handleAvailabilityToggle = (option: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Your Mobile Phlebotomy Service</h1>
            <p className="text-gray-600 mb-8">
              Join our directory and connect with patients who need mobile blood draw services. 
              Fill out the form below to get started.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({...prev, businessName: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({...prev, contactName: e.target.value}))}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({...prev, website: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services Offered *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {serviceOptions.map((service) => (
                    <label key={service} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your mobile phlebotomy services, experience, and what makes your service unique..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({...prev, state: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="DC">District of Columbia</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({...prev, zipCode: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <select
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData(prev => ({...prev, yearsExperience: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Experience</option>
                    <option value="1-2">1-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Area
                </label>
                <input
                  type="text"
                  value={formData.serviceArea}
                  onChange={(e) => setFormData(prev => ({...prev, serviceArea: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Los Angeles County, 25 mile radius"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.licensed}
                    onChange={(e) => setFormData(prev => ({...prev, licensed: e.target.checked}))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                  />
                  <span className="text-sm text-gray-700">Licensed phlebotomist</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.insurance}
                    onChange={(e) => setFormData(prev => ({...prev, insurance: e.target.checked}))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                  />
                  <span className="text-sm text-gray-700">Insured and bonded</span>
                </label>
              </div>

              <div className="border-t pt-6 mt-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Would you like to receive patient leads from MobilePhlebotomy.org? *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="leadOptIn"
                      value="yes"
                      checked={formData.leadOptIn === 'yes'}
                      onChange={(e) => setFormData(prev => ({...prev, leadOptIn: e.target.value as 'yes' | 'no'}))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">Yes, send me patient requests</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="leadOptIn"
                      value="no"
                      checked={formData.leadOptIn === 'no'}
                      onChange={(e) => setFormData(prev => ({...prev, leadOptIn: e.target.value as 'yes' | 'no'}))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">Not right now (directory listing only)</span>
                  </label>
                </div>
              </div>

              {formData.leadOptIn === 'yes' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      How should we send you patient requests? *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.leadContactMethod.includes('email')}
                          onChange={() => handleContactMethodToggle('email')}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                        />
                        <span className="text-sm text-gray-700">Email</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.leadContactMethod.includes('sms')}
                          onChange={() => handleContactMethodToggle('sms')}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                        />
                        <span className="text-sm text-gray-700">Text message</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lead notification email (optional)
                      </label>
                      <input
                        type="email"
                        value={formData.leadEmail}
                        onChange={(e) => setFormData(prev => ({...prev, leadEmail: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="If different from above"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lead notification phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.leadPhone}
                        onChange={(e) => setFormData(prev => ({...prev, leadPhone: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="If different from above"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Typical availability (check all that apply) *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Weekdays', 'Evenings', 'Weekends', 'Same-day / urgent requests'].map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.availability.includes(option)}
                            onChange={() => handleAvailabilityToggle(option)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• We review and approve your listing (usually within 24–48 hours)</li>
                  <li>• Your business becomes discoverable by patients in your service area</li>
                  <li>• If you opted in, you can start receiving patient requests by email/text</li>
                  <li>• No obligation — you control which requests you accept</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Submit Listing Application'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Application Submitted Successfully!
            </h3>

            {/* Message */}
            <div className="space-y-3 text-gray-600 text-sm mb-6">
              <p className="text-center">
                Thank you for your interest in joining MobilePhlebotomy.org!
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-blue-900">What happens next?</p>
                <ul className="space-y-1 text-blue-800">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>We review and approve your listing (usually within <strong>24–48 hours</strong>)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Your business becomes discoverable by patients in your service area</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>If you opted in, you can start receiving patient requests by email/text</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>No obligation — you control which requests you accept</span>
                  </li>
                </ul>
              </div>

              <p className="text-center text-xs text-gray-500">
                Questions? Email us at <a href="mailto:hector@mobilephlebotomy.org" className="text-primary-600 hover:underline">hector@mobilephlebotomy.org</a>
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}