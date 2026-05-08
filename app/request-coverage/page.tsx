import type { Metadata } from 'next'
import { CoverageRequestForm } from './CoverageRequestForm'

export const metadata: Metadata = {
  title: 'Coverage for labs, studies, and institutional draws — MobilePhlebotomy.org',
  description:
    'Mobile phlebotomy coverage across the United States, coordinated through a single point of contact. Tell us what you need and we\'ll respond within one business day with available coverage and pricing.',
  alternates: { canonical: 'https://mobilephlebotomy.org/request-coverage' },
  openGraph: {
    title: 'Coverage for labs, studies, and institutional draws',
    description: 'Mobile phlebotomy coverage across the United States — single point of contact, response within one business day.',
    type: 'website',
  },
}

export default function RequestCoveragePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Coverage for labs, studies, and institutional draws
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mobile phlebotomy coverage across the United States — coordinated through a single
            point of contact. Tell us what you need and we'll respond within one business day with
            available coverage and pricing.
          </p>
        </div>

        <p className="text-sm text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          Used by clinical trial sponsors, decentralized research organizations, reference labs,
          home health groups, and corporate wellness programs.
        </p>

        <CoverageRequestForm />
      </div>
    </div>
  )
}
