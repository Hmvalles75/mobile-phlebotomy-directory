import { Metadata } from 'next'
import Link from 'next/link'
import { topMetroAreas } from '@/data/top-metros'

export const metadata: Metadata = {
  title: 'How Much Does Mobile Phlebotomy Cost? $60\u2013$150 Per Visit (2026)',
  description: 'Mobile phlebotomy costs $75\u2013$150 per visit. See prices by state, 5 ways to pay less, and get a free quote today. Most Medicare & Medicaid patients pay $0\u2013$25.',
  keywords: 'mobile phlebotomy cost, at home blood draw cost, mobile blood draw price, home phlebotomy pricing, blood draw at home cost, mobile lab cost, traveling phlebotomist cost, at home blood work price, how much does mobile phlebotomy cost',
  openGraph: {
    title: 'How Much Does Mobile Phlebotomy Cost? $60\u2013$150 Per Visit (2026)',
    description: 'Mobile phlebotomy costs $75\u2013$150 per visit. See prices by state, 5 ways to pay less, and get a free quote today. Most Medicare & Medicaid patients pay $0\u2013$25.',
    type: 'article',
  }
}

export default function MobilePhlebotomyCostPage() {
  const majorMetros = topMetroAreas.slice(0, 8)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How Much Does Mobile Phlebotomy Cost? $60-150 (2026 Prices)',
    description: 'Complete guide to mobile phlebotomy costs including provider price comparisons, insurance coverage, state-by-state pricing, and ways to save.',
    author: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      url: 'https://mobilephlebotomy.org'
    },
    publisher: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      url: 'https://mobilephlebotomy.org'
    },
    datePublished: '2024-01-01',
    dateModified: '2026-03-12'
  }

  const pricingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Mobile Phlebotomy Services',
    description: 'At-home blood draw services by certified phlebotomists',
    provider: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org'
    },
    areaServed: { '@type': 'Country', name: 'United States' },
    offers: [
      {
        '@type': 'Offer',
        name: 'Basic Blood Draw',
        price: '60',
        priceCurrency: 'USD',
        description: 'Single vial blood collection at your location'
      },
      {
        '@type': 'Offer',
        name: 'Multiple Vials',
        price: '85',
        priceCurrency: 'USD',
        description: 'Multiple samples collected during one visit'
      },
      {
        '@type': 'Offer',
        name: 'Specialty Testing',
        price: '100',
        priceCurrency: 'USD',
        description: 'Specialized blood collections and testing services'
      }
    ]
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does a mobile phlebotomist charge?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A mobile phlebotomist typically charges $75 to $150 for the service fee, which covers travel and blood collection at your location. Lab processing fees are billed separately. Independent phlebotomists tend to charge $60-$100, while national companies like Quest charge around $79. Prices vary by location, time of day, and number of specimens collected.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does insurance cover mobile phlebotomy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, many insurance plans cover mobile phlebotomy when it is deemed medically necessary. Medicare covers mobile blood draws for homebound patients, with typical copays of $0-$25. Private insurance may cover it with pre-authorization, especially for patients with mobility limitations or chronic conditions requiring frequent monitoring. Medicaid coverage varies by state but often covers mobile services with little to no copay.'
        }
      },
      {
        '@type': 'Question',
        name: 'Will Quest come to my home?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Quest Diagnostics offers mobile phlebotomy through their Quest Mobile service. The home visit fee is approximately $79 per appointment, plus lab processing fees. You can schedule online through their website. Alternatively, independent mobile phlebotomists found through directories like MobilePhlebotomy.org may offer more flexible scheduling and competitive pricing in your area.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I find a mobile phlebotomist near me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can find a mobile phlebotomist near you by searching the MobilePhlebotomy.org directory, which lists certified independent providers across the United States. You can also check with your doctor\'s office, local hospitals, or national services like Getlabs and Quest Mobile. When comparing providers, ask about their service area, pricing, credentials, and insurance acceptance.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is the cheapest mobile phlebotomy option?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The cheapest mobile phlebotomy option is typically Getlabs, which partners with Labcorp and starts at $35 per visit. Independent mobile phlebotomists often charge $60-$100, which is less than national company rates of $79-$150. To find the lowest price, compare providers on MobilePhlebotomy.org, schedule during regular business hours, and ask about bundled pricing if you need multiple tests.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is mobile phlebotomy covered by Medicare?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Medicare covers mobile phlebotomy for patients who are homebound or have difficulty traveling to a lab. Medicare Part B typically covers 80% of the approved amount after the deductible, resulting in a copay of $0-$25 for most patients. Your doctor must order the lab work and document medical necessity. Nursing home residents and post-hospitalization patients also qualify.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much does a home blood draw cost without insurance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Without insurance, a home blood draw costs $60 to $150 for the phlebotomist\'s service fee. Lab processing fees are additional and vary from $25 to $200+ depending on the tests ordered. To reduce costs without insurance, use an independent phlebotomist ($60-$100) rather than a national service, schedule during business hours, bundle multiple tests in one visit, and ask about self-pay discounts. Some providers also accept HSA and FSA payments.'
        }
      }
    ]
  }

  const statePricing = [
    { state: 'California', abbr: 'CA', range: '$80–$160', slug: 'california' },
    { state: 'New York', abbr: 'NY', range: '$75–$150', slug: 'new-york' },
    { state: 'Texas', abbr: 'TX', range: '$60–$120', slug: 'texas' },
    { state: 'Florida', abbr: 'FL', range: '$65–$130', slug: 'florida' },
    { state: 'Illinois', abbr: 'IL', range: '$70–$130', slug: 'illinois' },
    { state: 'Pennsylvania', abbr: 'PA', range: '$65–$125', slug: 'pennsylvania' },
    { state: 'Ohio', abbr: 'OH', range: '$60–$110', slug: 'ohio' },
    { state: 'Georgia', abbr: 'GA', range: '$65–$125', slug: 'georgia' },
    { state: 'North Carolina', abbr: 'NC', range: '$60–$120', slug: 'north-carolina' },
    { state: 'Michigan', abbr: 'MI', range: '$60–$115', slug: 'michigan' },
    { state: 'New Jersey', abbr: 'NJ', range: '$75–$140', slug: 'new-jersey' },
    { state: 'Virginia', abbr: 'VA', range: '$65–$125', slug: 'virginia' },
    { state: 'Washington', abbr: 'WA', range: '$75–$140', slug: 'washington' },
    { state: 'Arizona', abbr: 'AZ', range: '$60–$120', slug: 'arizona' },
    { state: 'Massachusetts', abbr: 'MA', range: '$75–$145', slug: 'massachusetts' },
    { state: 'Colorado', abbr: 'CO', range: '$70–$130', slug: 'colorado' },
    { state: 'Tennessee', abbr: 'TN', range: '$60–$115', slug: 'tennessee' },
    { state: 'Maryland', abbr: 'MD', range: '$70–$135', slug: 'maryland' },
    { state: 'Louisiana', abbr: 'LA', range: '$60–$120', slug: 'louisiana' },
    { state: 'Oregon', abbr: 'OR', range: '$70–$135', slug: 'oregon' },
  ]

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Answer Block — direct answer for AI Overview extraction */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How Much Does Mobile Phlebotomy Cost?
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <p className="text-lg text-gray-900 leading-relaxed mb-3">
                <strong>Mobile phlebotomy typically costs $75–$150 per visit</strong> for the phlebotomist&apos;s service fee. Lab testing is billed separately by your lab.
              </p>
              <p className="text-lg text-gray-900 leading-relaxed">
                Medicare and Medicaid patients often pay <strong>$0–$25</strong> when a doctor orders the draw and documents medical necessity.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/request-blood-draw"
                className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
              >
                Find a Provider in Your Area
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">Last updated: March 2026</p>
          </div>
        </div>
      </div>

      {/* Price Comparison Table */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mobile Phlebotomy Price Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-6 py-4 text-left">Provider</th>
                    <th className="px-6 py-4 text-left">Starting Price</th>
                    <th className="px-6 py-4 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Getlabs (via Labcorp)</td>
                    <td className="px-6 py-4 text-gray-900">$35</td>
                    <td className="px-6 py-4 text-gray-600">Appointment required, limited availability</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">Quest Mobile</td>
                    <td className="px-6 py-4 text-gray-900">$79</td>
                    <td className="px-6 py-4 text-gray-600">In-home, by appointment, major metro areas</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">NPPN</td>
                    <td className="px-6 py-4 text-gray-900">$99</td>
                    <td className="px-6 py-4 text-gray-600">National network, corporate and insurance clients</td>
                  </tr>
                  <tr className="bg-green-50 border-2 border-green-300">
                    <td className="px-6 py-4 font-semibold text-green-800">
                      Independent Phlebotomist
                      <span className="block text-xs text-green-600 mt-1">via MobilePhlebotomy.org</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-800">$60–$150</td>
                    <td className="px-6 py-4 text-green-700">
                      <Link href="/search" className="underline hover:text-green-900">
                        Compare providers in your area
                      </Link>
                      {' '}— flexible scheduling, local service
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Prices are approximate and may vary by location. Lab processing fees are separate from the service fee shown above.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Cost Factors */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What Affects Mobile Phlebotomy Pricing?</h2>
            <p className="text-gray-700 mb-8">
              The cost of a mobile blood draw depends on several factors. Understanding these can help you estimate what you will pay and find ways to reduce your costs.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Distance and Travel Fee</h3>
                  <p className="text-gray-600">
                    Most providers include travel within a 10–25 mile radius. Beyond that, expect a $15–$50 travel surcharge. Rural areas with fewer providers tend to have higher travel fees than urban areas with more competition.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Specimen Type and Number of Draws</h3>
                  <p className="text-gray-600">
                    A single-vial routine blood draw costs less than a multi-vial comprehensive panel. Drawing 4–6 vials for a metabolic panel costs more than a single tube for a CBC. Bundling multiple tests in one visit is more cost-effective than scheduling separate appointments.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Time of Day</h3>
                  <p className="text-gray-600">
                    Evening, weekend, and holiday appointments typically cost 25–50% more. Early morning slots (6–8am) are popular for fasting labs and may be standard-priced or slightly premium depending on the provider.
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Specialty Collection Kits</h3>
                  <p className="text-gray-600">
                    Functional medicine labs, hormone panels, and genetic testing kits require special handling and packaging. Expect an additional $20–$50 fee for specialty kit processing on top of the standard service fee.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Urban vs. Rural Pricing</h3>
                  <p className="text-gray-600">
                    Urban areas like NYC and San Francisco charge $90–$150 due to higher operating costs. Midwest and Southern rural areas typically range $60–$100. More providers in an area generally means more competitive pricing.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Provider Type</h3>
                  <p className="text-gray-600">
                    Independent mobile phlebotomists often charge $60–$100, lower than national companies ($79–$150). However, larger companies may offer insurance billing and broader availability. Specialty providers (pediatric, geriatric) may charge a premium.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Insurance Coverage */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Does Insurance Cover Mobile Phlebotomy?</h2>
            <p className="text-gray-700 mb-8">
              Yes, many insurance plans cover mobile phlebotomy when it is medically necessary. Coverage depends on your plan, your medical situation, and whether the provider is in-network.
            </p>

            <div className="space-y-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Medicare Coverage</h3>
                <p className="text-gray-700 mb-3">
                  <strong>Medicare covers mobile phlebotomy for homebound patients.</strong> Part B pays 80% of the approved amount after the annual deductible, leaving most patients with a $0–$25 copay. Your doctor must order the lab work and document that you are homebound or have difficulty traveling to a lab facility.
                </p>
                <p className="text-sm text-gray-600">
                  Qualifying situations: mobility limitations, post-surgery recovery, chronic illness requiring frequent monitoring, nursing home or assisted living residents.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Medicaid Coverage</h3>
                <p className="text-gray-700 mb-3">
                  <strong>Medicaid typically covers mobile phlebotomy with little to no copay ($0–$15).</strong> Coverage varies by state, but most state Medicaid programs cover mobile lab services when ordered by a physician. You must use a Medicaid-approved provider.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Private Insurance</h3>
                <p className="text-gray-700 mb-3">
                  <strong>Private insurance may cover mobile phlebotomy with pre-authorization.</strong> Typical copays range from $10–$50. Coverage is more likely when the service is for disability accommodations, high-risk pregnancy monitoring, or chronic condition management. Check if the mobile phlebotomist is in your provider network before booking.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Self-Pay Options</h3>
                <p className="text-gray-700 mb-3">
                  <strong>Without insurance, expect to pay $60–$150 for the service fee plus lab processing costs.</strong> To reduce out-of-pocket costs: use an independent phlebotomist instead of a national service, schedule during business hours, bundle multiple tests in one visit, and ask about self-pay discounts. Mobile phlebotomy is an eligible HSA and FSA expense.
                </p>
              </div>
            </div>
          </section>

          {/* State Pricing */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mobile Phlebotomy Costs by State</h2>
            <p className="text-gray-700 mb-6">
              Pricing varies by state based on cost of living, provider availability, and local demand. Below are typical service fee ranges for common states. Lab processing fees are additional.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-6 py-3 text-left">State</th>
                    <th className="px-6 py-3 text-left">Typical Service Fee</th>
                    <th className="px-6 py-3 text-left">Find Providers</th>
                  </tr>
                </thead>
                <tbody>
                  {statePricing.map((s, i) => (
                    <tr key={s.abbr} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-3 font-semibold text-gray-900">{s.state}</td>
                      <td className="px-6 py-3 text-gray-900">{s.range}</td>
                      <td className="px-6 py-3">
                        <Link href={`/us/${s.slug}`} className="text-green-600 hover:text-green-800 underline">
                          View {s.abbr} providers
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Specialty Kit Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Specialty Lab Kit Collection Fees</h2>
            <p className="text-gray-700 mb-6">
              Some lab tests require specialty collection kits with specific handling, packaging, or temperature requirements. These kits add $20–$50 to the standard mobile phlebotomy service fee.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Functional Medicine Labs</h3>
                <p className="text-sm text-gray-600 mb-2">Additional fee: $25–$50</p>
                <p className="text-gray-600 text-sm">
                  Tests from labs like Genova, Vibrant Wellness, and Great Plains often require special collection tubes, timed draws, or cold-chain shipping. Your phlebotomist handles the kit prep and shipping.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hormone Panels</h3>
                <p className="text-sm text-gray-600 mb-2">Additional fee: $20–$40</p>
                <p className="text-gray-600 text-sm">
                  Comprehensive hormone panels (thyroid, cortisol, reproductive) may require multiple vials and specific timing. Some panels require fasting or early morning draws for accurate results.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Genetic Testing Kits</h3>
                <p className="text-sm text-gray-600 mb-2">Additional fee: $20–$35</p>
                <p className="text-gray-600 text-sm">
                  DNA and genetic testing kits from companies like Invitae or Color require specific collection methods and chain-of-custody documentation. The phlebotomist ensures proper sample handling and shipping.
                </p>
              </div>
            </div>
          </section>

          {/* Regional Pricing with Metro Links */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mobile Phlebotomy Costs in Major Cities</h2>
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

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mobile Phlebotomy Cost FAQ</h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.name}</h3>
                  <p className="text-gray-700">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Block */}
          <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Find a Mobile Phlebotomist in Your Area</h2>
            <p className="text-green-100 mb-6 text-lg">
              Get a free quote from certified providers in our network — compare prices, read reviews, and book online.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/search"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Compare Providers Near You
              </Link>
              <Link
                href="/mobile-phlebotomy-insurance-coverage"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              >
                Insurance Coverage Guide
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
