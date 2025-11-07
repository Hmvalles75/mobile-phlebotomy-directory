'use client'

import { useEffect } from 'react'
import { ga4 } from '@/lib/ga4'
import Link from 'next/link'

export default function Terms() {
  useEffect(() => {
    ga4.policyView('terms')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-sm text-gray-500 mb-8">
              Last updated: {new Date().toISOString().slice(0, 10)}
            </p>

            <div className="prose prose-lg max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Service</h2>
                <p className="text-gray-700 leading-relaxed">
                  We provide a directory and referral service that connects patients with mobile phlebotomy providers.
                  We are not a healthcare provider and do not guarantee provider performance or availability.
                </p>
              </section>

              <section className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded-r-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Listings</h2>
                <p className="text-gray-700 leading-relaxed">
                  Some listings are unverified and may contain public business information. Providers can claim and
                  verify their listings. Unverified listings are labeled and may be removed upon request.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Referrals & Payment</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Providers may purchase lead credits and featured placements. Patients do not pay MobilePhlebotomy.org.
                    Any fees for phlebotomy services are between patient and provider.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">For Patients</h3>
                      <p className="text-sm text-gray-600">
                        No charges from us. Pay providers directly for their services.
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">For Providers</h3>
                      <p className="text-sm text-gray-600">
                        Pay-per-lead credits and optional featured placement subscriptions.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptable Use</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-gray-700 leading-relaxed mb-3">
                    <strong className="text-red-900">Do not:</strong>
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Post false information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Attempt to access others&apos; data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Interfere with our systems</span>
                    </li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-3">
                    We may suspend access for abuse.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer</h2>
                <p className="text-gray-700 leading-relaxed">
                  We provide the site &quot;as is&quot; without warranties. We are not liable for indirect or
                  consequential damages. Our liability is limited to the amount paid to us in the preceding 3 months,
                  if any.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Disputes</h2>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Governing law:</strong> California, USA. By using the site, you agree to these terms.
                </p>
              </section>

              <section className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact us</h3>
                <p className="text-gray-700 mb-4">
                  For questions about these terms, email:{' '}
                  <a
                    href="mailto:support@mobilephlebotomy.org"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    support@mobilephlebotomy.org
                  </a>
                </p>
                <div className="flex gap-3">
                  <a
                    href="mailto:support@mobilephlebotomy.org"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Contact Support
                  </a>
                  <Link
                    href="/privacy"
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Privacy Policy
                  </Link>
                </div>
              </section>

              <div className="bg-gray-50 p-6 rounded-lg mt-8 border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  By using MobilePhlebotomy.org, you acknowledge that you have read, understood,
                  and agree to be bound by these Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
