'use client'

import { useEffect } from 'react'
import { ga4 } from '@/lib/ga4'

export default function Privacy() {
  useEffect(() => {
    ga4.policyView('privacy')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-8">
              Last updated: {new Date().toISOString().slice(0, 10)}
            </p>

            <div className="prose prose-lg max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What we do</h2>
                <p className="text-gray-700 leading-relaxed">
                  MobilePhlebotomy.org is a directory connecting patients with mobile phlebotomy providers.
                  We collect minimal information to process a referral request.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Information we collect</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Contact details you submit (name, phone, email)</li>
                  <li>Location info you provide (city, state, ZIP)</li>
                  <li>Urgency selection and optional notes</li>
                  <li>Technical events (page views, clicks) for analytics</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How we use it</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>To route your request to a verified provider</li>
                  <li>To contact you about your request</li>
                  <li>To improve our service and prevent abuse</li>
                </ul>
              </section>

              <section className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">HIPAA notice</h2>
                <p className="text-gray-700 leading-relaxed">
                  We are a marketing and referral platform. We do not store medical records or lab results.
                  We are not a covered entity under HIPAA. Do not include sensitive medical details in the notes field.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Sharing</h2>
                <p className="text-gray-700 leading-relaxed">
                  We share your submitted contact details with a verified provider solely to service your request.
                  We do not sell your personal information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data retention</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 mr-3 text-sm font-semibold text-primary-600 bg-primary-100 rounded-full flex-shrink-0">
                        ✓
                      </span>
                      <span><strong>Referral requests:</strong> up to 18 months</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 mr-3 text-sm font-semibold text-primary-600 bg-primary-100 rounded-full flex-shrink-0">
                        ✓
                      </span>
                      <span><strong>Call recordings</strong> (if enabled): up to 90 days</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your rights</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you reside in California (CCPA) or other jurisdictions with privacy laws, you may request
                  access or deletion of your data.
                </p>
                <a
                  href="mailto:privacy@mobilephlebotomy.org"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Contact Privacy Team
                </a>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We use encryption in transit and at rest. Access is restricted to authorized personnel.
                </p>
              </section>

              <section className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact us</h3>
                <p className="text-gray-700">
                  For privacy-related questions, email:{' '}
                  <a
                    href="mailto:privacy@mobilephlebotomy.org"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    privacy@mobilephlebotomy.org
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
