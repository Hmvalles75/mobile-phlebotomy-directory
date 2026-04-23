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

              <section className="bg-primary-50 border-l-4 border-primary-600 p-6 rounded-r-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">SMS / text messaging</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you are a provider who has registered on MobilePhlebotomy.org and opted in, or a patient
                  who has submitted a request and shared a mobile number, we may send you SMS/text messages.
                </p>
                <div className="space-y-3 text-gray-700">
                  <p>
                    <strong>What we send:</strong> For providers, new patient-lead notifications in your
                    service area, account and billing alerts, and occasional platform updates. For patients,
                    appointment-status updates related to the specific request you submitted.
                  </p>
                  <p>
                    <strong>Frequency:</strong> Varies based on lead volume in your area and your account
                    activity. You may receive multiple messages per week. You will not receive marketing
                    messages unrelated to the request or account you signed up for.
                  </p>
                  <p>
                    <strong>Carrier fees:</strong> Message and data rates may apply. Check with your mobile
                    carrier for details about your text messaging plan. MobilePhlebotomy.org does not charge
                    for SMS itself.
                  </p>
                  <p>
                    <strong>How to opt out:</strong> Reply <strong>STOP</strong> to any SMS message from us
                    at any time. You will receive a one-time confirmation and no further messages will be
                    sent. You can also contact{' '}
                    <a href="mailto:privacy@mobilephlebotomy.org" className="text-primary-600 hover:text-primary-700 font-medium">
                      privacy@mobilephlebotomy.org
                    </a>{' '}
                    to request removal from SMS lists.
                  </p>
                  <p>
                    <strong>Help:</strong> Reply <strong>HELP</strong> to any SMS message or email{' '}
                    <a href="mailto:support@mobilephlebotomy.org" className="text-primary-600 hover:text-primary-700 font-medium">
                      support@mobilephlebotomy.org
                    </a>.
                  </p>
                  <p>
                    <strong>Phone-number privacy:</strong> We do not sell or share your phone number with
                    third parties for their marketing purposes. Phone numbers are used solely to deliver
                    the SMS notifications you opted in to receive.
                  </p>
                </div>
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
