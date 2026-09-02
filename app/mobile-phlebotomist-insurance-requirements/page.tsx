import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'
import Link from 'next/link'

// Provider-facing, unlike /mobile-phlebotomy-insurance-coverage which answers
// the patient question "will my insurance pay for this". Same query word,
// opposite audience — this one is for phlebotomists asking what coverage they
// need to carry.
//
// Limits below are Hector's figures for this market. The "varies by carrier and
// state" caveat stays on the page regardless: someone may buy a policy based on
// what it says.
export const metadata: Metadata = {
  title: 'What Insurance Does a Mobile Phlebotomist Need? (2026 Guide)',
  description: 'Mobile phlebotomists typically carry professional liability, general liability and commercial auto cover. What each protects, typical limits, and why facilities and research clients ask for proof.',
  keywords: 'mobile phlebotomist insurance, phlebotomy liability insurance, professional liability phlebotomist, general liability mobile phlebotomy, malpractice insurance phlebotomist, phlebotomy business insurance requirements',
  openGraph: {
    title: 'What Insurance Does a Mobile Phlebotomist Need? (2026 Guide)',
    description: 'Mobile phlebotomists typically carry professional liability, general liability and commercial auto cover. What each protects, typical limits, and why facilities and research clients ask for proof.',
    type: 'article',
  }
}

export default function MobilePhlebotomistInsuranceRequirementsPage() {
  const coverageTypes = [
    {
      name: 'Professional liability',
      also: 'Malpractice / errors and omissions',
      protects: 'Claims arising from the clinical work itself — a nerve injury from a difficult stick, a mislabelled specimen, a missed identification step.',
      typical: '$1M per occurrence / $3M aggregate',
      note: 'This is the one nearly every facility and lab contract asks for by name.'
    },
    {
      name: 'General liability',
      also: 'Commercial general liability, CGL',
      protects: 'Everything that is not clinical — a patient tripping over your case, damage to a client’s property, an injury in someone’s home that has nothing to do with the draw.',
      typical: '$1M per occurrence / $2M aggregate',
      note: 'Frequently bundled with professional liability as an allied-health package.'
    },
    {
      name: 'Commercial auto',
      also: 'Hired and non-owned auto',
      protects: 'Driving between patients. A personal auto policy usually excludes business use, which is exactly what a mobile route is.',
      typical: '$1M combined single limit',
      note: 'The most commonly missed one, because the vehicle is already insured personally.'
    },
    {
      name: 'Workers’ compensation',
      also: '',
      protects: 'Injury to employees — including needlestick exposure.',
      typical: 'Set by state statute',
      note: 'Generally required once you have employees. Rules for sole proprietors vary by state.'
    }
  ]

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'What Insurance Does a Mobile Phlebotomist Need?',
    description: 'A guide to the insurance coverage mobile phlebotomists carry: professional liability, general liability, commercial auto and workers’ compensation, and why clients require proof of it.',
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
    mainEntityOfPage: `${SITE_URL}/mobile-phlebotomist-insurance-requirements`
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Mobile Phlebotomy Directory Listing',
    serviceType: 'Provider directory listing for mobile phlebotomists',
    provider: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org'
    },
    areaServed: { '@type': 'Country', name: 'United States' },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free directory listing',
        price: '0',
        priceCurrency: 'USD',
        description: 'List a mobile phlebotomy business and receive patient requests in your service area at no cost.'
      }
    ]
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What insurance does a mobile phlebotomist need?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most mobile phlebotomists carry three types: professional liability for the clinical work, general liability for everything else that can happen on someone else’s property, and commercial auto for driving between patients. Workers’ compensation is added once you have employees. Requirements are set by the clients and facilities you work with rather than by a single national rule.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is professional liability the same as malpractice insurance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'In practice, yes. For allied health roles like phlebotomy the coverage is usually sold as professional liability or errors and omissions, and it does the job malpractice insurance does for a physician: it responds to claims arising from the clinical service you performed.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does my personal car insurance cover me between patients?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Usually not. Most personal auto policies exclude business use, and driving a route between patients is business use. This is the most commonly overlooked gap in a mobile practice, because the vehicle already feels insured. Ask your carrier specifically about commercial or hired and non-owned auto cover.'
        }
      },
      {
        '@type': 'Question',
        name: 'Why do facilities and research clients ask for proof of insurance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Because they are transferring risk. A senior living facility, hospice agency or clinical research site is letting an outside person perform an invasive procedure on their premises or their participants. Their own insurer generally requires them to verify that any contractor carries coverage, which is why they ask for a certificate of insurance naming them as an additional insured before work begins.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is a certificate of insurance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A one-page document from your insurer confirming what coverage you hold and for how much. Clients ask for it rather than the full policy. Requests often include naming the client as an additional insured, which your carrier can usually add quickly and at little or no cost.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need insurance to list on MobilePhlebotomy.org?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Listing is free and we ask whether you are licensed and insured so patients can see it, but we do not verify policies or set a coverage requirement. Individual clients — particularly facilities and research sponsors — will have their own requirements, and those are the ones that decide what you actually need to carry.'
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
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
              What Insurance Does a Mobile Phlebotomist Need?
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <p className="text-lg text-gray-900 leading-relaxed mb-3">
                <strong>Most mobile phlebotomists carry three policies:</strong> professional liability for the clinical work, general liability for everything else, and commercial auto for driving between patients.
              </p>
              <p className="text-lg text-gray-900 leading-relaxed">
                Workers&apos; compensation is added once you have employees. There is no single national requirement &mdash; in practice the facilities and labs you work with set the bar.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/add-provider"
                className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
              >
                List Your Mobile Phlebotomy Business Free
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">Last updated: September 2026</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Coverage table */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Four Types, and What Each One Actually Does</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-6 py-4 text-left">Coverage</th>
                    <th className="px-6 py-4 text-left">What it responds to</th>
                    <th className="px-6 py-4 text-left">Typical limits</th>
                  </tr>
                </thead>
                <tbody>
                  {coverageTypes.map((c, i) => (
                    <tr key={c.name} className={`border-b border-gray-200 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 align-top">
                        <div className="font-semibold text-gray-900">{c.name}</div>
                        {c.also && <div className="text-xs text-gray-500 mt-1">also called: {c.also}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-700 align-top">
                        {c.protects}
                        <div className="text-sm text-gray-500 mt-2">{c.note}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 align-top whitespace-nowrap">{c.typical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mt-6">
              Institutional clients &mdash; facilities, labs, hospice agencies, research sites &mdash; typically require a certificate of insurance naming them as an additional insured before you can start work.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              This page is general information, not insurance advice. Limits and requirements vary by carrier, by state and by contract &mdash; talk to a broker who writes allied health policies.
            </p>
          </section>

          {/* Professional vs general */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Professional Versus General Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These get confused constantly, and carrying one is not the same as carrying both. The clearest way to separate them: <strong>professional liability responds to what you did as a phlebotomist</strong> &mdash; the stick itself, the labelling, the identification steps. <strong>General liability responds to what happened while you were there</strong> &mdash; a patient tripping over your case, a spill on someone&apos;s carpet, a fall in a facility corridor.
            </p>
            <p className="text-gray-700 leading-relaxed">
              A claim about a hematoma is professional. A claim about a broken vase is general. Facilities usually ask for both, and a bundled allied-health package is generally cheaper than two standalone policies.
            </p>
          </section>

          {/* Why clients ask */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Institutional and Research Clients Insist On It</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For individual patients, insurance rarely comes up. For everyone else it is the first question, and it decides whether the work happens at all.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              A senior living community, hospice agency, occupational health programme or clinical research site is allowing an outside person to perform an invasive procedure on their premises or their participants. Their own insurer typically requires them to verify that any contractor carries coverage &mdash; so before you set foot on site, someone in their compliance office will ask for a certificate of insurance, usually naming them as an additional insured.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This is worth knowing in advance because it is the difference between winning recurring contract work and losing it on paperwork. Providers who can produce a certificate the same day tend to get the call again. Research and facility contracts are also where the money is: they are recurring and priced by the day rather than the draw.
            </p>
          </section>

          {/* Practical notes */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Practical Notes</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-primary-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Check the auto policy first</h3>
                <p className="text-gray-700 leading-relaxed">
                  It is the most common gap. Personal auto policies generally exclude business use, and a route between patients is business use. If you do nothing else after reading this page, call your carrier and ask.
                </p>
              </div>
              <div className="border-l-4 border-primary-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ask about additional insured before you need it</h3>
                <p className="text-gray-700 leading-relaxed">
                  Adding a client as an additional insured is routine and usually quick, but not instant. Knowing your carrier&apos;s turnaround means you can answer a facility honestly when they ask how soon you can start.
                </p>
              </div>
              <div className="border-l-4 border-primary-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Employee versus contractor changes what you need</h3>
                <p className="text-gray-700 leading-relaxed">
                  Bringing on a second collector usually triggers workers&apos; compensation obligations and may change your liability structure. Rules differ by state, and this is the point at which a conversation with a broker stops being optional.
                </p>
              </div>
            </div>
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
            <h2 className="text-2xl font-bold mb-4">List Your Mobile Phlebotomy Business Free</h2>
            <p className="text-green-100 mb-6 text-lg">
              Patients searching for a mobile draw in your area find providers through this directory. Listing costs nothing, and you choose how far you travel.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/add-provider"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Add Your Listing
              </Link>
              <Link
                href="/mobile-phlebotomy-insurance-coverage"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              >
                Patient Insurance Guide
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
