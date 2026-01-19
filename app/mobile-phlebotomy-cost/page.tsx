import { Metadata } from 'next'
import Link from 'next/link'
import { topMetroAreas } from '@/data/top-metros'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Cost: Pricing Guide & Insurance Coverage (2026)',
  description: '💰 Mobile phlebotomy costs $60-150 per visit. Get instant price quotes! Most insurance accepted. Medicare/Medicaid covered. Save 50% with these insider tips. Compare providers now.',
  keywords: 'mobile phlebotomy cost, at home blood draw cost, mobile blood draw price, home phlebotomy pricing, blood draw at home cost, mobile lab cost, traveling phlebotomist cost, at home blood work price',
  openGraph: {
    title: 'Mobile Phlebotomy Cost: Pricing Guide & Insurance Coverage (2026)',
    description: '💰 Mobile phlebotomy costs $60-150 per visit. Get instant price quotes! Most insurance accepted. Medicare/Medicaid covered. Save 50% with these insider tips. Compare providers now.',
    type: 'article',
  }
}

export default function MobilePhlebotomyCostPage() {
  const majorMetros = topMetroAreas.slice(0, 8)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Mobile Phlebotomy Cost: Pricing Guide & Insurance Coverage',
    description: 'Complete guide to mobile phlebotomy costs, including pricing factors, insurance coverage, and ways to save money.',
    author: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org'
    },
    publisher: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org'
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString()
  }

  const pricingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Mobile Phlebotomy Services',
    description: 'At-home blood draw services by certified phlebotomists',
    offers: [
      {
        '@type': 'Offer',
        name: 'Basic Blood Draw',
        price: '60-85',
        priceCurrency: 'USD',
        description: 'Single vial blood collection at your location'
      },
      {
        '@type': 'Offer',
        name: 'Multiple Vials',
        price: '85-120',
        priceCurrency: 'USD',
        description: 'Multiple samples collected during one visit'
      },
      {
        '@type': 'Offer',
        name: 'Specialty Testing',
        price: '100-150',
        priceCurrency: 'USD',
        description: 'Specialized blood collections and testing services'
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How Much Does Mobile Phlebotomy Cost?
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Complete pricing guide for at-home blood draws, insurance coverage, and cost-saving tips.
              Most services range from $60-150 per visit.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/search"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Compare Providers & Prices
              </Link>
              <Link
                href="/mobile-phlebotomy-insurance-coverage"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              >
                Insurance Coverage Info
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Price Overview */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Mobile Phlebotomy Pricing at a Glance</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">$60-85</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Blood Draw</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Single vial collection</li>
                  <li>• Routine lab tests</li>
                  <li>• Standard appointment time</li>
                  <li>• Most insurance covered</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center border-2 border-green-500">
                <div className="text-3xl font-bold text-green-600 mb-2">$85-120</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Multiple Vials</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Multiple sample types</li>
                  <li>• Comprehensive panels</li>
                  <li>• Same visit convenience</li>
                  <li>• Often insurance covered</li>
                </ul>
                <div className="mt-4 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Most Popular</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">$100-150</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialty Services</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Specialized collections</li>
                  <li>• Complex testing</li>
                  <li>• Extended appointments</li>
                  <li>• Premium services</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Cost Factors */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What Affects Mobile Phlebotomy Cost?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Geographic Location</h3>
                  <p className="text-gray-600">
                    Costs vary by region. Urban areas like NYC and San Francisco typically charge $90-150,
                    while rural areas may range $60-100. Travel distance affects pricing in remote areas.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Number of Tests</h3>
                  <p className="text-gray-600">
                    Single vial draws cost less than comprehensive panels requiring multiple samples.
                    Bundling tests in one visit is typically more cost-effective.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Time of Service</h3>
                  <p className="text-gray-600">
                    Evening, weekend, and holiday appointments may cost 25-50% more. Some providers
                    offer early morning discounts.
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Provider Type</h3>
                  <p className="text-gray-600">
                    Independent phlebotomists may offer lower rates than large companies.
                    Specialty services (pediatric, geriatric) may cost more.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Insurance Status</h3>
                  <p className="text-gray-600">
                    Insured patients pay copays ($10-50) while self-pay patients pay full rates.
                    Medicare typically covers mobile services for homebound patients.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Frequency</h3>
                  <p className="text-gray-600">
                    Regular patients may receive discounts. Some providers offer package deals
                    for ongoing monitoring or chronic condition management.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Regional Pricing */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Regional Pricing Examples</h2>
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {majorMetros.map((metro) => (
                  <div key={metro.slug} className="text-center">
                    <Link href={`/us/metro/${metro.slug}`} className="block hover:text-green-600">
                      <h3 className="font-semibold text-gray-900 mb-1">{metro.city}</h3>
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {metro.localInfo?.avgCost || '$60-120'}
                      </div>
                      <p className="text-sm text-gray-600">
                        Typical range for basic blood draw
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-600 mt-6">
                <Link href="/metros" className="text-green-600 hover:text-green-700">
                  View pricing in all 50 metro areas →
                </Link>
              </p>
            </div>
          </section>

          {/* Insurance Coverage */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Insurance Coverage for Mobile Phlebotomy</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">✅ Commonly Covered</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Medicare</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Homebound patients</li>
                    <li>• Nursing home residents</li>
                    <li>• Post-hospitalization care</li>
                    <li>• Chronic condition monitoring</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Private Insurance</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Medically necessary tests</li>
                    <li>• Disability accommodations</li>
                    <li>• High-risk pregnancy monitoring</li>
                    <li>• Provider network services</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Medicare</h3>
                <div className="text-2xl font-bold text-green-600 mb-2">$0-25</div>
                <p className="text-sm text-gray-600 mb-3">Typical copay when covered</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 80% coverage after deductible</li>
                  <li>• Must meet homebound criteria</li>
                  <li>• Doctor must order tests</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Private Plans</h3>
                <div className="text-2xl font-bold text-green-600 mb-2">$10-50</div>
                <p className="text-sm text-gray-600 mb-3">Typical copay range</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Varies by plan type</li>
                  <li>• May require pre-approval</li>
                  <li>• Check provider network</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Medicaid</h3>
                <div className="text-2xl font-bold text-green-600 mb-2">$0-15</div>
                <p className="text-sm text-gray-600 mb-3">Usually minimal copay</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Full coverage when approved</li>
                  <li>• State-specific rules</li>
                  <li>• Must use approved providers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Ways to Save */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to Save Money on Mobile Phlebotomy</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">💰 Cost-Saving Tips</h3>
                <ul className="space-y-3 text-green-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Bundle multiple tests in one visit to avoid multiple trip charges</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Schedule during regular business hours to avoid premium pricing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Compare prices from multiple providers in your area</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Ask about package deals for ongoing monitoring needs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Use HSA/FSA funds to pay for services pre-tax</span>
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ Hidden Costs to Watch</h3>
                <ul className="space-y-3 text-yellow-700">
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    <span>Lab processing fees (usually separate from collection fee)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    <span>Travel charges for distances over standard service area</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    <span>Rush processing fees for expedited results</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    <span>Cancellation fees if you don&apos;t provide adequate notice</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    <span>Additional fees for specialized collection methods</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cost Comparison */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mobile vs Traditional Lab Costs</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-left">Factor</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Mobile Phlebotomy</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Traditional Lab</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-semibold">Collection Fee</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">$60-150</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">$25-40</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-semibold">Travel Time</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">0 minutes</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">30-60 minutes</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-semibold">Parking</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">$0</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">$5-25</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-semibold">Wait Time</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">0-5 minutes</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">15-45 minutes</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-semibold">Time Off Work</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">Minimal</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">1-3 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 mt-4">
              <strong>Bottom Line:</strong> While mobile phlebotomy costs more upfront, the time savings and convenience
              often make it cost-effective when you factor in travel time, parking, and potential lost wages.
            </p>
          </section>

          {/* When It's Worth It */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">When Mobile Phlebotomy Is Worth the Cost</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Highly Recommended</h3>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• Mobility limitations or disabilities</li>
                  <li>• Elderly patients or nursing home residents</li>
                  <li>• Busy professionals with limited time</li>
                  <li>• Parents with small children</li>
                  <li>• Immunocompromised individuals</li>
                  <li>• Frequent monitoring needs</li>
                  <li>• Anxiety about medical settings</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚖️ Consider Carefully</h3>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li>• Single, routine test</li>
                  <li>• Live near a convenient lab</li>
                  <li>• Flexible schedule</li>
                  <li>• Cost-conscious with no insurance coverage</li>
                  <li>• Need immediate results</li>
                  <li>• Prefer clinical environment</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Best Value Scenarios</h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>• Multiple tests in one visit</li>
                  <li>• Insurance covers the service</li>
                  <li>• High-value time (professional rates &gt;$50/hr)</li>
                  <li>• Corporate wellness programs</li>
                  <li>• Ongoing monitoring programs</li>
                  <li>• Family members needing tests</li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Pricing FAQ</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Do I pay the lab and the phlebotomist separately?</h3>
                <p className="text-gray-700">
                  Usually yes. You pay the mobile phlebotomist for collection services, and the laboratory
                  bills separately for processing. Some integrated services may provide one combined bill.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I use my HSA or FSA for mobile phlebotomy?</h3>
                <p className="text-gray-700">
                  Yes, mobile phlebotomy is typically an eligible medical expense for HSA and FSA accounts.
                  Save receipts and check with your plan administrator for specific requirements.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Are there additional charges for weekend or evening appointments?</h3>
                <p className="text-gray-700">
                  Many providers charge 25-50% more for appointments outside regular business hours.
                  Some offer standard pricing for early morning or late evening slots within reason.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I need to cancel my appointment?</h3>
                <p className="text-gray-700">
                  Most providers require 24-hour notice to avoid cancellation fees. Emergency
                  cancellations may be waived depending on circumstances. Check cancellation policies
                  when booking.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Compare Mobile Phlebotomy Costs?</h2>
            <p className="text-green-100 mb-6">
              Find certified providers in your area and compare pricing for your specific needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/search"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Compare Providers & Prices
              </Link>
              <Link
                href="/at-home-blood-draw-services"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              >
                Learn More About Services
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}