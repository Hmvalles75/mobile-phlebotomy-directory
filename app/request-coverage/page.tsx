import type { Metadata } from 'next'
import { CoverageRequestForm } from './CoverageRequestForm'

export const metadata: Metadata = {
  title: 'Request Mobile Phlebotomy Coverage — Clinical Studies, Labs, Healthcare Facilities',
  description:
    'Need mobile phlebotomy coverage for a clinical study, lab routing, healthcare facility, or wellness program? Tell us where and when — we coordinate certified providers nationwide as your single point of contact.',
  alternates: { canonical: 'https://mobilephlebotomy.org/request-coverage' },
  openGraph: {
    title: 'Request Mobile Phlebotomy Coverage',
    description: 'Clinical study, lab routing, healthcare facility, or wellness program — one point of contact, nationwide coordination.',
    type: 'website',
  },
}

export default function RequestCoveragePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Request Mobile Phlebotomy Coverage</h1>
          <p className="text-lg text-gray-600">
            Clinical studies. Lab routing. Healthcare facilities. Wellness programs. We coordinate
            certified mobile phlebotomists across the U.S. — you work with one point of contact.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-3">How this works</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>You share your need below — organization, location, timeline, volume.</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>I review personally and reply within 1-2 business days with availability.</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>We coordinate the providers. You stay one-to-one with us — no contractor management on your side.</span>
            </li>
          </ul>
        </div>

        <CoverageRequestForm />

        <div className="mt-8 text-center text-sm text-gray-500">
          Prefer email? Reach me directly at{' '}
          <a href="mailto:hector@mobilephlebotomy.org" className="text-primary-600 hover:underline">
            hector@mobilephlebotomy.org
          </a>
        </div>
      </div>
    </div>
  )
}
