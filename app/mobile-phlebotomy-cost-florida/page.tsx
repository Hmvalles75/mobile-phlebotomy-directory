import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'
import Link from 'next/link'

// Florida-specific companion to /mobile-phlebotomy-cost. Florida is the site's
// second-largest lead source and the national cost page ranks for the generic
// query but not the state one.
//
// Figures are Hector's own market numbers, not derived from the national
// $75–$150 range. A Miami price produced by nudging a US average would be a
// fabricated number, and the point of a state page is to be more accurate than
// the national one, not less.
export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Cost in Florida: $75–$140 Per Visit (2026)',
  description: 'Mobile phlebotomy in Florida costs $75–$140 per visit in 2026. Compare typical prices in Miami, Tampa, Orlando and Jacksonville, and see what affects the fee.',
  keywords: 'mobile phlebotomy cost florida, at home blood draw florida, mobile blood draw miami, mobile phlebotomist tampa cost, orlando mobile phlebotomy price, jacksonville at home blood draw, florida traveling phlebotomist cost',
  openGraph: {
    title: 'Mobile Phlebotomy Cost in Florida: $75–$140 Per Visit (2026)',
    description: 'Mobile phlebotomy in Florida costs $75–$140 per visit in 2026. Compare typical prices in Miami, Tampa, Orlando and Jacksonville, and see what affects the fee.',
    type: 'article',
  }
}

export default function MobilePhlebotomyCostFloridaPage() {
  const metroRanges = [
    { metro: 'Miami / Miami-Dade', range: '$70–$140', note: 'Dense metro, heavy traffic; parking surcharges are common downtown and in Brickell.' },
    { metro: 'Tampa / St. Petersburg', range: '$75–$140', note: 'Wide service areas across Hillsborough and Pinellas; bridge crossings add travel time.' },
    { metro: 'Orlando', range: '$75–$150', note: 'Large suburban spread toward Kissimmee and Sanford.' },
    { metro: 'Jacksonville', range: '$75–$130', note: 'Geographically the largest city in the state by land area; distance drives the fee.' },
  ]

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How Much Does Mobile Phlebotomy Cost in Florida? (2026)',
    description: 'Guide to mobile phlebotomy pricing in Florida, including typical ranges by metro area, what changes the fee, and how insurance applies.',
    author: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      url: `${SITE_URL}`
    },
    publisher: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      url: `${SITE_URL}`
    },
    mainEntityOfPage: `${SITE_URL}/mobile-phlebotomy-cost-florida`
  }

  const pricingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Mobile Phlebotomy in Florida',
    serviceType: 'Mobile blood draw and specimen collection',
    provider: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org'
    },
    areaServed: { '@type': 'State', name: 'Florida' },
    offers: [
      {
        '@type': 'Offer',
        name: 'Standard mobile blood draw',
        priceCurrency: 'USD',
        description: 'Single-patient draw at a home, workplace or facility in Florida. Service fee only; laboratory testing is billed separately.'
      },
      {
        '@type': 'Offer',
        name: 'Same-day or STAT draw',
        priceCurrency: 'USD',
        description: 'Urgent collection, typically within a few hours. Usually carries a premium over a scheduled visit.'
      }
    ]
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does a mobile phlebotomist cost in Florida?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A mobile phlebotomist in Florida typically charges $75–$140 for the visit. That fee covers travel and the blood collection itself. Laboratory processing is billed separately by whichever lab runs the test, so the total you pay is the draw fee plus your lab costs.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is mobile phlebotomy more expensive in Miami than the rest of Florida?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Not especially. Miami-Dade runs about $70 to $140, which is in line with the rest of the state and starts slightly lower than most, because the density that creates traffic also means more providers competing for the same routes. The highest ceiling in Florida is Orlando at around $150. Rural counties are where prices genuinely climb, since fewer providers cover longer distances between patients.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does insurance cover mobile phlebotomy in Florida?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The laboratory testing is usually billable to insurance when a physician has ordered it. The mobile collection fee is more often an out-of-pocket convenience charge. Medicare may cover in-home collection for homebound patients when medical necessity is documented. Coverage varies by provider and plan, so confirm it directly before booking.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need a doctor’s order for a mobile blood draw in Florida?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For most clinical testing, yes. A phlebotomist collects the specimen but does not order the test, so a lab requisition from your physician is normally required. Some direct-to-consumer wellness panels are ordered through a partner physician instead, in which case no separate order is needed.'
        }
      },
      {
        '@type': 'Question',
        name: 'Why do same-day draws cost more?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A same-day or STAT request means the provider has to rearrange an existing route, sometimes at short notice, and may need to get the specimen to the lab within a specific window. That disruption is what the premium pays for.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is the price different for multiple people at the same address?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Often it is lower per person. The travel cost is the same whether the provider draws one patient or four, so most will quote a reduced rate for additional household members or for a group booking at a facility or workplace.'
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
              How Much Does Mobile Phlebotomy Cost in Florida?
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <p className="text-lg text-gray-900 leading-relaxed mb-3">
                <strong>Mobile phlebotomy in Florida typically costs $75–$140 per visit</strong> for the phlebotomist&apos;s service fee. Laboratory testing is billed separately by your lab. You can{' '}
                <Link href="/us/florida" className="text-primary-700 font-semibold hover:underline">browse mobile phlebotomists across Florida</Link>{' '}
                to see who covers your area.
              </p>
              <p className="text-lg text-gray-900 leading-relaxed">
                Ranges are fairly consistent across the state. Orlando has the highest top end and Jacksonville the lowest; rural counties often cost more than any metro, because the provider is driving further.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/us/florida"
                className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
              >
                See Mobile Phlebotomists in Florida
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">Last updated: September 2026</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* What changes the price */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What Changes the Price in Florida</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-primary-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Metro versus rural</h3>
                <p className="text-gray-700 leading-relaxed">
                  Both extremes push the price up, for opposite reasons. In Miami-Dade and Broward, traffic and parking make each visit take longer than the draw itself suggests. In rural counties &mdash; much of the Panhandle, the interior south of Ocala &mdash; there are simply fewer providers, and the one who covers you may be driving an hour each way. The most predictable pricing tends to be in well-served suburban areas where several providers compete for the same routes.
                </p>
              </div>
              <div className="border-l-4 border-primary-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">How complex the draw is</h3>
                <p className="text-gray-700 leading-relaxed">
                  A routine venipuncture with one or two tubes is the baseline. Prices rise for difficult sticks, pediatric and geriatric patients, port or PICC draws where a provider is qualified for them, and any specimen that needs processing on site &mdash; a centrifuge spin, or handling that has to happen within minutes of collection.
                </p>
              </div>
              <div className="border-l-4 border-primary-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Timing</h3>
                <p className="text-gray-700 leading-relaxed">
                  Same-day and STAT requests carry a premium because they break an existing route. Early morning fasting draws are in high demand and book out first. Evenings and weekends usually cost more than a weekday mid-morning slot.
                </p>
              </div>
              <div className="border-l-4 border-primary-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">How many people are being drawn</h3>
                <p className="text-gray-700 leading-relaxed">
                  The travel is the expensive part, not the needle. Two people at one address almost always costs less per person than two separate visits, and facility or workplace bookings are usually priced per day rather than per draw.
                </p>
              </div>
            </div>
          </section>

          {/* Metro table */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Typical Ranges by Florida Metro</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-6 py-4 text-left">Metro Area</th>
                    <th className="px-6 py-4 text-left">Typical Range</th>
                    <th className="px-6 py-4 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {metroRanges.map((row, i) => (
                    <tr key={row.metro} className={`border-b border-gray-200 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 font-semibold text-gray-900">{row.metro}</td>
                      <td className="px-6 py-4 text-gray-900">{row.range}</td>
                      <td className="px-6 py-4 text-gray-600">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mt-6">
              Those are the middle of the market. In some Florida markets budget providers start as low as $35&ndash;$60, usually national services running fixed routes with narrow appointment windows, while concierge providers offering evening, weekend or same-day service run higher than the ranges above.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Ranges are for the collection fee only and do not include laboratory testing. Individual providers set their own rates &mdash; confirm the price when you book.
            </p>
          </section>

          {/* Insurance */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What Insurance Usually Covers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              It helps to think of a mobile draw as two separate charges. The <strong>laboratory testing</strong> is normally billable to insurance in the ordinary way once a physician has ordered it. The <strong>collection fee</strong> &mdash; the part that pays for someone to come to you &mdash; is more often out of pocket, because it is a convenience rather than a clinical necessity.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The main exception is homebound patients. Medicare may cover in-home collection when a physician documents that leaving the house is not reasonable, and Florida Medicaid has provisions for similar cases. This varies by plan and by provider, so ask directly before booking rather than assuming either way.
            </p>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
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
            <h2 className="text-2xl font-bold mb-4">Find a Mobile Phlebotomist in Florida</h2>
            <p className="text-green-100 mb-6 text-lg">
              Browse providers covering Miami, Tampa, Orlando, Jacksonville and the rest of the state &mdash; or send one request and hear back from those who cover your area.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/us/florida"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Florida Provider Directory
              </Link>
              <Link
                href="/mobile-phlebotomy-cost"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              >
                National Pricing Guide
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
