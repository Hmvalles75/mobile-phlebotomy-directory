'use client'

import { useState } from 'react'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA'

export default function TestLeadGenPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Lead-Gen System Test Page
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Test Components</h2>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">1. Lead Form Modal</h3>
                <p className="text-gray-600 mb-4">
                  Click the button below to test the lead submission form.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold"
                >
                  Open Lead Form
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">2. Sticky Mobile CTA</h3>
                <p className="text-gray-600 mb-2">
                  The sticky mobile CTA bar is active at the bottom of this page (mobile only).
                </p>
                <p className="text-sm text-gray-500">
                  Resize your browser to mobile width or open on a phone to see it.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">3. Test Lead Submission</h3>
                <p className="text-gray-600 mb-4">
                  To test the full flow:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Open the lead form modal (button above)</li>
                  <li>Fill in the form with test data</li>
                  <li>Use a test ZIP code (e.g., 90210, 10001, or your local ZIP)</li>
                  <li>Submit the form</li>
                  <li>Check the console for API response</li>
                  <li>Open Prisma Studio to see the lead in the database: <code className="bg-gray-100 px-2 py-1 rounded">npx prisma studio</code></li>
                </ol>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-yellow-50">
                <h3 className="text-xl font-semibold mb-2">⚠️ Note About SMS/Email</h3>
                <p className="text-gray-700 mb-2">
                  If you haven't configured Twilio and SendGrid in your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>SMS notifications will be skipped (no error)</li>
                  <li>Email notifications will be skipped (no error)</li>
                  <li>Lead will still be created and routed</li>
                  <li>You'll see console logs instead</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
                <h3 className="text-xl font-semibold mb-2">✅ What's Working</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Lead form with client-side validation</li>
                  <li>Lead submission API endpoint</li>
                  <li>Lead routing by ZIP code</li>
                  <li>Database storage (check with Prisma Studio)</li>
                  <li>Provider credit tracking</li>
                  <li>GA4 event tracking (if configured)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">📋 Next Steps After Testing</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Update homepage with lead-gen CTAs (see LEADGEN_IMPLEMENTATION_GUIDE.md)</li>
              <li>Update provider detail pages with claim/verify buttons</li>
              <li>Create provider dashboard</li>
              <li>Set up Stripe, Twilio, SendGrid</li>
              <li>Deploy to Vercel</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultCity="Los Angeles"
        defaultState="CA"
        defaultZip="90210"
      />

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA
        defaultCity="Los Angeles"
        defaultState="CA"
        defaultZip="90210"
      />
    </div>
  )
}
