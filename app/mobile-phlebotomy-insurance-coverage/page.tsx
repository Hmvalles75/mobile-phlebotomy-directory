import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Insurance Coverage: Medicare, Medicaid & Private Plans (2026)',
  description: '💡 YES! Most insurance covers mobile phlebotomy. Medicare pays up to 80%. Get CPT codes, pre-authorization tips, and maximize your benefits. Save hundreds on at-home blood draws.',
  keywords: 'mobile phlebotomy insurance coverage, does insurance cover mobile phlebotomy, Medicare mobile phlebotomy, at home blood draw insurance, mobile blood draw Medicare, phlebotomy insurance billing',
}

export default function InsuranceCoveragePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Mobile Phlebotomy Insurance Coverage: Medicare, Medicaid & Private Plans',
    description: 'Comprehensive guide to insurance coverage for mobile phlebotomy services including Medicare, Medicaid, and private insurance plans.',
    author: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org'
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString()
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Does insurance cover mobile phlebotomy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Many insurance plans cover mobile phlebotomy when medically necessary, including Medicare, Medicaid, and most private insurance. Coverage depends on medical necessity and your specific plan. Mobile phlebotomy is typically covered for homebound patients, elderly individuals, or those with mobility limitations.'
        }
      }
    ]
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Mobile Phlebotomy Insurance Coverage Guide
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Understanding Medicare, Medicaid, and private insurance coverage for at-home blood draw services
            </p>
          </div>
        </div>
      </div>

      {/* Quick Answer */}
      <div className="bg-green-50 border border-green-200 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-green-800 mb-4">Quick Answer</h2>
            <p className="text-lg text-green-700">
              <strong>Yes, insurance often covers mobile phlebotomy!</strong> Medicare, Medicaid, and most private
              insurance plans cover mobile blood draws when medically necessary, especially for homebound patients,
              elderly individuals, or those with mobility limitations.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Coverage Overview */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Insurance Coverage Overview</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">✅ Usually Covered</h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>• Homebound patients</li>
                  <li>• Elderly with mobility issues</li>
                  <li>• Post-surgical patients</li>
                  <li>• Chronic condition monitoring</li>
                  <li>• Disabled individuals</li>
                  <li>• High-risk pregnancies</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Sometimes Covered</h3>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li>• Routine wellness checks</li>
                  <li>• Convenience preferences</li>
                  <li>• Non-essential testing</li>
                  <li>• Out-of-network providers</li>
                  <li>• Experimental tests</li>
                  <li>• Cosmetic testing</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">❌ Rarely Covered</h3>
                <ul className="text-sm text-red-700 space-y-2">
                  <li>• Purely convenience-based</li>
                  <li>• Direct-pay services</li>
                  <li>• Cash-only providers</li>
                  <li>• Non-medical testing</li>
                  <li>• Unlicensed providers</li>
                  <li>• Travel-only fees</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Medicare Coverage */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Medicare Coverage</h2>
            <div className="bg-blue-50 rounded-lg p-8 mb-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Medicare Part B Coverage</h3>
              <p className="text-blue-800 mb-4">
                Medicare covers mobile phlebotomy services under Part B when specific criteria are met.
                The key requirement is that the patient must be <strong>homebound</strong>.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Homebound Definition</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Unable to leave home without considerable effort</li>
                    <li>• Requires assistance to leave home</li>
                    <li>• Leaving home is medically contraindicated</li>
                    <li>• Has a condition that restricts ability to leave</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Coverage Details</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 80% coverage after deductible</li>
                    <li>• Patient pays 20% coinsurance</li>
                    <li>• Must be ordered by physician</li>
                    <li>• Provider must accept Medicare</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Typical Costs with Medicare</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Medicare Pays:</span>
                    <span className="font-semibold text-green-600">80%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Coinsurance:</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span>Typical Out-of-Pocket:</span>
                    <span className="font-semibold">$12-30</span>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Documentation</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Physician&apos;s order for tests</li>
                  <li>• Medical necessity documentation</li>
                  <li>• Homebound status verification</li>
                  <li>• Previous unsuccessful lab attempts (if applicable)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Medicaid Coverage */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Medicaid Coverage</h2>
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-green-800 mb-3">State-by-State Variation</h3>
              <p className="text-green-700 mb-4">
                Medicaid coverage for mobile phlebotomy varies significantly by state. Most states cover
                the service for eligible patients, but requirements and copays differ.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">Generous Coverage</h4>
                  <ul className="text-xs text-green-700">
                    <li>• California</li>
                    <li>• New York</li>
                    <li>• Massachusetts</li>
                    <li>• Washington</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">Standard Coverage</h4>
                  <ul className="text-xs text-green-700">
                    <li>• Texas</li>
                    <li>• Florida</li>
                    <li>• Illinois</li>
                    <li>• Ohio</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">Limited Coverage</h4>
                  <ul className="text-xs text-green-700">
                    <li>• Some rural states</li>
                    <li>• Non-expansion states</li>
                    <li>• Check state guidelines</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Typical Medicaid Coverage</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Full coverage when approved</li>
                  <li>• Minimal or no copays ($0-5)</li>
                  <li>• Must use approved providers</li>
                  <li>• May require prior authorization</li>
                  <li>• Transportation barriers qualify</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Qualifying Conditions</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Pregnancy complications</li>
                  <li>• Chronic illnesses</li>
                  <li>• Mental health conditions</li>
                  <li>• Substance abuse treatment</li>
                  <li>• Disability status</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Private Insurance */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Private Insurance Coverage</h2>
            <p className="text-gray-700 mb-6">
              Most private insurance plans cover mobile phlebotomy when medically necessary. Coverage
              varies by insurer and plan type, but generally follows Medicare guidelines.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Major Insurers</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-blue-700">Blue Cross Blue Shield</h4>
                    <p className="text-sm text-blue-600">Usually covers with medical necessity</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700">Aetna</h4>
                    <p className="text-sm text-blue-600">Covers homebound and mobility-impaired</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700">Cigna</h4>
                    <p className="text-sm text-blue-600">Prior authorization may be required</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700">UnitedHealth</h4>
                    <p className="text-sm text-blue-600">Network providers preferred</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Typical Costs</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>HMO Plans:</span>
                    <span className="font-semibold">$10-25 copay</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPO Plans:</span>
                    <span className="font-semibold">$20-50 copay</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High-Deductible:</span>
                    <span className="font-semibold">Full cost until met</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Out-of-Network:</span>
                    <span className="font-semibold">Higher coinsurance</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How to Get Coverage */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to Get Your Insurance to Cover Mobile Phlebotomy</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Step-by-Step Process</h3>
              <ol className="list-decimal list-inside space-y-3 text-yellow-700">
                <li><strong>Get a physician&apos;s order</strong> - Your doctor must order the blood tests</li>
                <li><strong>Document medical necessity</strong> - Explain why mobile service is needed</li>
                <li><strong>Verify coverage</strong> - Call your insurance to confirm benefits</li>
                <li><strong>Choose in-network provider</strong> - Use approved mobile phlebotomy services</li>
                <li><strong>Submit pre-authorization</strong> - If required by your plan</li>
                <li><strong>Keep documentation</strong> - Save all receipts and medical records</li>
              </ol>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Medical Necessity Documentation</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Mobility limitations or disabilities</li>
                  <li>• Transportation barriers</li>
                  <li>• Risk of exposure to illness</li>
                  <li>• Post-operative restrictions</li>
                  <li>• Chronic conditions requiring frequent monitoring</li>
                  <li>• Mental health conditions affecting travel</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Questions to Ask Your Insurer</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Is mobile phlebotomy covered under my plan?</li>
                  <li>• What is my copay or coinsurance?</li>
                  <li>• Do I need prior authorization?</li>
                  <li>• Are there preferred providers?</li>
                  <li>• What documentation is required?</li>
                  <li>• Is there a visit limit per year?</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Billing and CPT Codes */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Billing and CPT Codes</h2>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Common CPT Codes for Mobile Phlebotomy</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Collection Codes</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 36415 - Collection of venous blood by venipuncture</li>
                    <li>• 36416 - Collection of capillary blood specimen</li>
                    <li>• G0471 - Collection of venous blood by venipuncture or urine sample by catheterization from an individual in a skilled nursing facility (SNF) or by a laboratory on behalf of a home health agency (HHA)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Travel Codes</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• P9603 - Travel allowance one way in connection with medically necessary laboratory specimen collection drawn from homebound or nursing home bound patient; prorated miles actually traveled</li>
                    <li>• P9604 - Travel allowance one way in connection with medically necessary laboratory specimen collection drawn from homebound or nursing home bound patient; prorated trip charge</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Tips for Maximizing Coverage */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Tips for Maximizing Insurance Coverage</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Do&apos;s</h3>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• Use in-network providers when possible</li>
                  <li>• Get pre-authorization if required</li>
                  <li>• Keep detailed medical records</li>
                  <li>• Follow up on claims processing</li>
                  <li>• Appeal denials with additional documentation</li>
                  <li>• Bundle multiple tests in one visit</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">❌ Don&apos;ts</h3>
                <ul className="text-sm text-red-700 space-y-2">
                  <li>• Don&apos;t assume coverage without verification</li>
                  <li>• Don&apos;t use out-of-network providers unnecessarily</li>
                  <li>• Don&apos;t skip pre-authorization requirements</li>
                  <li>• Don&apos;t accept initial denials without appeal</li>
                  <li>• Don&apos;t pay full price without checking benefits</li>
                  <li>• Don&apos;t forget to submit required documentation</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Need Help Finding Covered Mobile Phlebotomy Services?</h2>
            <p className="text-blue-100 mb-6">
              Find insurance-accepting mobile phlebotomists in your area and verify coverage before your appointment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/search"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Find Covered Providers
              </Link>
              <Link
                href="/mobile-phlebotomy-cost"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Pricing Guide
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}