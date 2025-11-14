'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ClaimContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const providerId = searchParams?.get('id')

  useEffect(() => {
    // If there's a provider ID, redirect to add-provider form with claim mode
    if (providerId) {
      router.push(`/add-provider?claim=${providerId}`)
    }
  }, [providerId, router])

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Claim Your Business Listing
          </h1>

          <div className="space-y-4 text-gray-700">
            <p>
              Are you the owner of a mobile phlebotomy business listed on MobilePhlebotomy.org?
              Claim your listing to:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Update your business information</li>
              <li>Add photos and services</li>
              <li>Respond to reviews</li>
              <li>Get verified status</li>
              <li>Receive referrals directly</li>
            </ul>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 my-6">
              <h2 className="font-semibold text-gray-900 mb-3">
                How to claim your listing:
              </h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>Click the &ldquo;Claim This Listing&rdquo; button on your provider page</li>
                <li>Fill out the claim form with your business details</li>
                <li>Our team will verify your ownership (typically 24-48 hours)</li>
                <li>Once verified, you&apos;ll receive login credentials to manage your listing</li>
              </ol>
            </div>

            {!providerId && (
              <div className="mt-8">
                <p className="mb-4">
                  Don&apos;t have a listing yet? Add your business to our directory:
                </p>
                <Link
                  href="/add-provider"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Add Your Business
                </Link>
              </div>
            )}

            {providerId && (
              <div className="mt-8">
                <p className="text-sm text-gray-600">
                  Redirecting you to the claim form...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  If you&apos;re not redirected automatically,{' '}
                  <Link
                    href={`/add-provider?claim=${providerId}`}
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    click here
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a
                href="mailto:support@mobilephlebotomy.org"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClaimProviderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ClaimContent />
    </Suspense>
  )
}
