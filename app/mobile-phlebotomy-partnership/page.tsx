import { Metadata } from 'next'
import Link from 'next/link'

// Targets the high-intent B2B queries "mobile phlebotomy partnership" (170/mo)
// and "mobile phlebotomy contract" — both flagged GOLD on the keyword tracker
// (clinical-trial / lab / institutional buyer intent, this is the NeuroAge-type
// search). Positions this page as the B2B umbrella that funnels to the existing
// specialized topic pages (/corporate-phlebotomy, /clinical-trials-mobile-phlebotomy,
// /for-networks) and ultimately to /request-coverage where they convert.
export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Partnership & Contract Services (2026)',
  description: 'Partner with vetted mobile phlebotomists nationwide for clinical research, senior living, corporate wellness, and lab routing. Single point of contact for multi-state coverage — request a written proposal in one business day.',
  keywords: 'mobile phlebotomy partnership, mobile phlebotomy contract, mobile phlebotomy services for research, b2b mobile phlebotomy, clinical trial phlebotomy partner, senior living phlebotomy contract, mobile lab routing partnership',
  alternates: {
    canonical: 'https://mobilephlebotomy.org/mobile-phlebotomy-partnership',
  },
  openGraph: {
    title: 'Mobile Phlebotomy Partnership & Contract Services (2026)',
    description: 'Partner with vetted mobile phlebotomists nationwide. Coordinated coverage for research, facilities, corporate wellness, and labs across the U.S.',
    type: 'website',
  },
}

export default function MobilePhlebotomyPartnershipPage() {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Mobile Phlebotomy Partnership Services',
    description:
      'Coordinated mobile phlebotomy coverage for institutional buyers including research organizations, senior living facilities, corporate wellness programs, clinical trials, and multi-site labs.',
    provider: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      url: 'https://mobilephlebotomy.org',
    },
    areaServed: { '@type': 'Country', name: 'United States' },
    serviceType: 'Mobile Phlebotomy Partnership',
    audience: {
      '@type': 'BusinessAudience',
      audienceType:
        'Clinical research organizations, senior living facilities, corporate wellness programs, hospital systems, specialty labs, concierge medical practices',
    },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does a mobile phlebotomy partnership work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A mobile phlebotomy partnership gives organizations a single point of contact for coordinated blood-draw coverage across one or many locations. MobilePhlebotomy.org sources vetted providers in each metro you need coverage in, negotiates per-draw or per-visit rates, handles scheduling and routing logistics, and ensures continuity of service. Partnership engagements typically run as one-shot projects (clinical study collection), recurring service contracts (weekly senior living visits), or on-demand coverage agreements (corporate wellness events).',
        },
      },
      {
        '@type': 'Question',
        name: 'What kinds of organizations use mobile phlebotomy partnerships?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The most common partnership buyers are: (1) clinical research organizations and pharmaceutical sponsors collecting samples from study participants outside their research sites, (2) senior living and assisted living facilities needing weekly or bi-weekly resident draws, (3) corporate wellness programs running biometric screenings or executive health events, (4) specialty labs and lab networks needing multi-metro collection coverage, and (5) concierge medicine and direct primary care practices bundling lab work with home visits.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does a mobile phlebotomy partnership cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Partnership pricing is structured per the engagement type. Senior living facilities typically pay $150–$250 per visit covering 5–20 residents. Clinical research collections usually run $50–$100 per encounter depending on geographic distribution and specimen handling requirements. Corporate wellness events price per participant, typically $50–$100. Multi-site lab routing engagements are usually priced per-stop with monthly minimums. We provide a written proposal within one business day of a coverage request — we do not quote without first understanding your volume, cadence, specimen type, payer mix, and timeline.',
        },
      },
      {
        '@type': 'Question',
        name: 'What geographic coverage do partnership services offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MobilePhlebotomy.org coordinates coverage across all 50 U.S. states through a vetted network of independent mobile phlebotomists and small mobile services. Coverage density varies by metro — major U.S. metropolitan areas typically have multiple available providers, while rural and underserved markets may require lead-time to source. For nationwide engagements with strict geographic requirements, we conduct provider sourcing in advance of contract execution to confirm capacity.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I start a mobile phlebotomy partnership?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Submit a coverage request describing your organization, the geographic markets you need coverage in, expected volume and cadence, specimen type, and timeline. We will respond within one business day with a written proposal including pricing, terms, provider qualifications, and a recommended engagement structure. Partnership agreements typically include a non-circumvention clause and a master services agreement governing the working relationship.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are mobile phlebotomy partnership providers vetted?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Providers brought into partnership engagements are independently confirmed for current CPT (Certified Phlebotomy Technician) credentials, state licensure where required (CA, LA, NV, WA), professional liability insurance, and HIPAA and OSHA bloodborne pathogen training. For research and specialty engagements requiring cold-chain handling, chain-of-custody, or specific kit-prep experience, providers are matched against those requirements before introduction.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero — direct value prop for B2B buyer */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-3">For Institutional Buyers</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Mobile Phlebotomy Partnership &amp; Contract Services
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <p className="text-lg text-gray-900 leading-relaxed mb-3">
                <strong>Coordinated mobile phlebotomy coverage across the U.S.</strong> for research organizations, senior living facilities, corporate wellness programs, clinical trials, and multi-site labs.
              </p>
              <p className="text-lg text-gray-900 leading-relaxed">
                One point of contact, one written proposal, vetted providers in every metro you need.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/request-coverage"
                className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
              >
                Request Coverage →
              </Link>
              <a
                href="mailto:hector@mobilephlebotomy.org?subject=Mobile%20Phlebotomy%20Partnership%20Inquiry"
                className="inline-block bg-white border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-colors"
              >
                Email Hector Directly
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">Response within one business day · Last updated: June 2026</p>
          </div>
        </div>
      </div>

      {/* Who we partner with */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Who We Partner With</h2>
            <p className="text-gray-700 mb-8">
              Partnership engagements are structured around the buyer&apos;s reference class. Each vertical has its own pricing logic, qualification requirements, and operational rhythm.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinical Research &amp; Trials</h3>
                <p className="text-gray-600 mb-3">
                  Sample collection from study participants outside research sites. Per-encounter or per-participant pricing, often with kit-based collection and cold-chain shipping.
                </p>
                <Link href="/clinical-trials-mobile-phlebotomy" className="text-green-600 hover:text-green-700 underline text-sm">
                  See clinical trial services →
                </Link>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Senior Living &amp; Skilled Nursing</h3>
                <p className="text-gray-600 mb-3">
                  Weekly or bi-weekly resident draws at assisted living, memory care, and skilled nursing communities. Per-visit pricing with 5–40+ residents per round.
                </p>
                <Link href="/request-coverage" className="text-green-600 hover:text-green-700 underline text-sm">
                  Request senior living coverage →
                </Link>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Corporate Wellness</h3>
                <p className="text-gray-600 mb-3">
                  Onsite biometric screenings, executive health programs, and recurring employee draws. Per-participant pricing, scalable across multiple corporate locations.
                </p>
                <Link href="/corporate-phlebotomy" className="text-green-600 hover:text-green-700 underline text-sm">
                  See corporate wellness services →
                </Link>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Labs &amp; Lab Networks</h3>
                <p className="text-gray-600 mb-3">
                  Multi-site specimen collection and routing for specialty labs, regional lab networks, and IDN systems extending their draw capacity into homes and facilities.
                </p>
                <Link href="/for-networks" className="text-green-600 hover:text-green-700 underline text-sm">
                  See network partner services →
                </Link>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Concierge Medicine &amp; DPC</h3>
                <p className="text-gray-600 mb-3">
                  Bundled lab collection for concierge, direct primary care, and functional medicine practices wanting to offer in-home draws as part of their patient experience.
                </p>
                <Link href="/request-coverage" className="text-green-600 hover:text-green-700 underline text-sm">
                  Request concierge coverage →
                </Link>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Specialty Programs</h3>
                <p className="text-gray-600 mb-3">
                  Pediatric, geriatric, fertility/IVF monitoring, and patients with developmental disabilities — engagements requiring specialty technique and longer encounter time.
                </p>
                <Link href="/request-coverage" className="text-green-600 hover:text-green-700 underline text-sm">
                  Request specialty coverage →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How partnership works */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How a Partnership Works</h2>
            <p className="text-gray-700 mb-8">
              Every partnership follows the same intake-to-execution rhythm. The depth and timeline of each step scale with engagement size.
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center">1</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Discovery</h3>
                  <p className="text-gray-700">
                    You submit a coverage request describing your organization, geographic markets, volume, cadence, specimen type, payer mix, and timeline. We ask qualifying questions to scope the engagement — we don&apos;t quote without context.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center">2</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Written Proposal</h3>
                  <p className="text-gray-700">
                    Within one business day, you receive a written proposal: per-visit or per-encounter pricing, provider qualifications, geographic coverage confirmation, timeline, and recommended engagement structure (one-shot, recurring contract, or on-demand).
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center">3</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Provider Sourcing</h3>
                  <p className="text-gray-700">
                    Once terms are agreed, providers are matched to each metro you need coverage in. Every assigned provider is independently confirmed for CPT credentials, state licensure (where required), liability insurance, and any specialty experience your engagement requires.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center">4</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Master Agreement &amp; Onboarding</h3>
                  <p className="text-gray-700">
                    Engagement is governed by a master services agreement with non-circumvention terms protecting both sides. Providers complete any client-specific training (protocol-specific kit prep, chain-of-custody requirements, scheduling system) before first appointment.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center">5</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Execution &amp; Reporting</h3>
                  <p className="text-gray-700">
                    Recurring engagements include weekly or monthly reporting on visits completed, specimens collected, and any service exceptions. Single point of contact at MobilePhlebotomy.org for issue resolution, schedule changes, and scope expansions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing by buyer class — replaces a cold quote with anchored ranges */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Pricing by Buyer Class</h2>
            <p className="text-gray-700 mb-6">
              Partnership pricing is anchored to the reference class for each buyer type — we don&apos;t quote cost-plus. Below are typical ranges; specific engagements are priced from a written proposal based on your volume, cadence, geography, and specimen requirements.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-6 py-4 text-left">Engagement Type</th>
                    <th className="px-6 py-4 text-left">Typical Pricing</th>
                    <th className="px-6 py-4 text-left">Structure</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Senior living &amp; SNF</td>
                    <td className="px-6 py-4 text-gray-900">$150–$250 per visit</td>
                    <td className="px-6 py-4 text-gray-600">5–40 residents per visit; weekly or bi-weekly recurring</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">Clinical research</td>
                    <td className="px-6 py-4 text-gray-900">$50–$100 per encounter</td>
                    <td className="px-6 py-4 text-gray-600">Per-participant; varies with geography &amp; specimen handling</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Corporate wellness</td>
                    <td className="px-6 py-4 text-gray-900">$50–$100 per participant</td>
                    <td className="px-6 py-4 text-gray-600">Often bundled with biometric screening; scales by participant count</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">Multi-site lab routing</td>
                    <td className="px-6 py-4 text-gray-900">Per stop, monthly minimums</td>
                    <td className="px-6 py-4 text-gray-600">Routing logic varies by lab and required turnaround</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900">Concierge / DPC bundled</td>
                    <td className="px-6 py-4 text-gray-900">$75–$150 per draw</td>
                    <td className="px-6 py-4 text-gray-600">Often included in practice membership; volume discounts available</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Specimen handling beyond standard venipuncture (cold-chain, chain-of-custody, specialty kits) may add to base pricing. Lab processing fees are charged separately by your designated lab.
            </p>
          </section>

          {/* Qualifications */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Provider Qualifications</h2>
            <p className="text-gray-700 mb-6">
              Every provider matched to a partnership engagement is independently confirmed against the following baseline qualifications.
            </p>
            <ul className="space-y-3 text-gray-700 ml-6">
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span><strong>CPT Certification</strong> from an accredited body (NHA, ASCP, AMT, or NCCT).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span><strong>State Licensure</strong> where required (California, Louisiana, Nevada, Washington).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span><strong>Professional Liability Insurance</strong> with current coverage documentation.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span><strong>HIPAA &amp; OSHA Training</strong> current within 12 months.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span><strong>Specialty experience matched to engagement</strong> — pediatric, geriatric, port draws, cold-chain shipping, chain-of-custody, or research protocols as required.</span>
              </li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Partnership FAQ</h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.name}</h3>
                  <p className="text-gray-700">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Start a Partnership</h2>
            <p className="text-green-100 mb-6 text-lg">
              Submit a coverage request and we&apos;ll respond with a written proposal within one business day.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/request-coverage"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Request Coverage →
              </Link>
              <a
                href="mailto:hector@mobilephlebotomy.org?subject=Mobile%20Phlebotomy%20Partnership%20Inquiry"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              >
                Email Hector Directly
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
