import { Metadata } from 'next'
import Link from 'next/link'

// Targets the informational top-of-funnel query "what is a mobile phlebotomist"
// (170 searches/mo, growing 54% YoY per KWFinder 2026-06). Strategy: direct
// definition in the hero (AI Overview extraction), then funnel readers down to
// /search and /mobile-phlebotomy-cost where they can take action. Title under
// 60 chars to avoid SERP truncation.
export const metadata: Metadata = {
  title: 'What Is a Mobile Phlebotomist? Definition + Cost (2026)',
  description: 'A mobile phlebotomist is a certified blood-draw technician who travels to your home, office, or facility. Learn what they do, what they cost ($75–$150), and how to find one near you in 2026.',
  keywords: 'what is a mobile phlebotomist, mobile phlebotomist definition, mobile phlebotomist meaning, what does a mobile phlebotomist do, mobile blood draw technician, traveling phlebotomist',
  alternates: {
    canonical: 'https://mobilephlebotomy.org/what-is-a-mobile-phlebotomist',
  },
  openGraph: {
    title: 'What Is a Mobile Phlebotomist? Definition + Cost (2026)',
    description: 'A mobile phlebotomist is a certified blood-draw technician who travels to your home, office, or facility. Learn what they do, what they cost, and how to find one near you.',
    type: 'article',
  },
}

export default function WhatIsAMobilePhlebotomistPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'What Is a Mobile Phlebotomist? Definition, Services, and Cost (2026)',
    description: 'Complete guide to what mobile phlebotomists do, who uses them, what they cost, and how they differ from traditional lab-based phlebotomists.',
    author: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      url: 'https://mobilephlebotomy.org',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      url: 'https://mobilephlebotomy.org',
    },
    datePublished: '2026-06-18',
    dateModified: '2026-06-18',
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does a mobile phlebotomist do?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A mobile phlebotomist is a certified blood-draw technician who travels to a patient\'s home, office, or care facility to perform venipuncture and specimen collection. They bring sterile collection supplies, follow lab-specific tube and packaging requirements, and deliver specimens to the patient\'s designated lab (LabCorp, Quest, hospital lab, or specialty lab) for processing. Most mobile phlebotomists hold a CPT (Certified Phlebotomy Technician) credential and carry liability insurance.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is a mobile phlebotomist different from a regular phlebotomist?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A regular phlebotomist works inside a hospital, lab, or doctor\'s office and patients come to them. A mobile phlebotomist travels to the patient — most commonly to homes, but also senior living facilities, corporate offices, research sites, and rural areas without nearby draw stations. Both hold the same core certifications, but mobile phlebotomists also need to manage scheduling, transportation, lab routing, and chain-of-custody for the specimens they collect.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who uses a mobile phlebotomist?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mobile phlebotomy is used by patients who are homebound, post-surgery, immunocompromised, anxious about clinical settings, or simply value the convenience of an at-home visit. Common users include: elderly patients in assisted living, parents coordinating draws for children, patients on frequent monitoring (anticoagulation, hormone therapy, fertility), corporate wellness programs, clinical research studies with remote participants, and concierge/functional medicine practices.',
        },
      },
      {
        '@type': 'Question',
        name: 'What credentials does a mobile phlebotomist need?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A qualified mobile phlebotomist typically holds a Certified Phlebotomy Technician (CPT) credential from an accredited body such as the National Healthcareer Association (NHA), American Society for Clinical Pathology (ASCP), or American Medical Technologists (AMT). State-specific requirements vary — California, Louisiana, Nevada, and Washington require formal state licensure, while most other states do not. Mobile phlebotomists should also carry professional liability insurance and be trained in HIPAA, OSHA bloodborne pathogen standards, and chain-of-custody protocols.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does a mobile phlebotomist cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mobile phlebotomy typically costs $75–$150 per visit for the phlebotomist\'s service fee, with lab processing billed separately. Independent mobile phlebotomists often charge $60–$100, while national services like Quest Mobile run around $79 and Getlabs starts at $35. Medicare and Medicaid patients usually pay $0–$25 when the draw is medically necessary and ordered by a physician. See our full mobile phlebotomy cost guide for state-by-state pricing.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I find a mobile phlebotomist near me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The fastest way to find a mobile phlebotomist near you is to search the MobilePhlebotomy.org directory, which lists certified independent providers across the United States by city and ZIP code. You can also ask your doctor\'s office for a referral, check with your insurance for in-network mobile providers, or contact national services like Quest Mobile and Getlabs. Compare providers on service area, pricing, credentials, and whether they accept your insurance before booking.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do mobile phlebotomists accept insurance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Many mobile phlebotomists accept insurance, especially for medically necessary draws ordered by a physician. Medicare Part B covers mobile phlebotomy for homebound patients ($0–$25 copay typical). Medicaid coverage varies by state but generally covers mobile services with little to no copay. Private insurance often requires pre-authorization. Independent providers may also accept HSA and FSA payments and offer competitive self-pay rates.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero Answer Block — direct definition for AI Overview extraction */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Is a Mobile Phlebotomist?
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <p className="text-lg text-gray-900 leading-relaxed mb-3">
                <strong>A mobile phlebotomist is a certified blood-draw technician who travels to a patient&apos;s home, office, or care facility</strong> to perform venipuncture and collect specimens for lab testing.
              </p>
              <p className="text-lg text-gray-900 leading-relaxed">
                They bring all collection supplies, follow lab-specific requirements, and deliver specimens to the patient&apos;s designated lab (LabCorp, Quest, or a specialty lab) for processing. The typical service fee is <strong>$75–$150 per visit</strong>.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
              >
                Find a Mobile Phlebotomist Near You
              </Link>
              <Link
                href="/mobile-phlebotomy-cost"
                className="inline-block bg-white border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-colors"
              >
                See 2026 Pricing
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">Last updated: June 2026</p>
          </div>
        </div>
      </div>

      {/* What does a mobile phlebotomist do */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What Does a Mobile Phlebotomist Do?</h2>
            <p className="text-gray-700 mb-4">
              A mobile phlebotomist&apos;s job is the same core procedure as any phlebotomist — drawing blood and collecting specimens — but performed at the patient&apos;s location rather than in a clinical setting. A typical visit includes:
            </p>
            <ul className="space-y-3 text-gray-700 ml-6">
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">→</span>
                <span><strong>Confirming the lab order</strong> — verifying the doctor&apos;s requisition, tube types required, and any special handling instructions (fasting, timed draws, cold-chain).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">→</span>
                <span><strong>Setting up a clean draw area</strong> — sterile supplies, alcohol prep, tourniquet, vacuum-collection tubes, butterfly or straight needle as appropriate.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">→</span>
                <span><strong>Performing venipuncture</strong> — finding a viable vein, drawing the required tubes, and managing patient comfort (especially important for pediatric, geriatric, and needle-anxious patients).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">→</span>
                <span><strong>Labeling and packaging</strong> — patient identifiers on every tube, biohazard packaging, and any temperature-controlled shipping for specialty kits.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">→</span>
                <span><strong>Transporting the specimen</strong> — dropping off at the designated lab (LabCorp, Quest, hospital lab, or research site) within the time and temperature windows required by the test.</span>
              </li>
            </ul>
          </section>

          {/* Difference from regular phlebotomist */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mobile Phlebotomist vs. Regular Phlebotomist</h2>
            <p className="text-gray-700 mb-6">
              Both hold the same core credentials, but the work setting and skill mix differ.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-6 py-4 text-left">&nbsp;</th>
                    <th className="px-6 py-4 text-left">Mobile Phlebotomist</th>
                    <th className="px-6 py-4 text-left">Regular Phlebotomist</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Work setting</td>
                    <td className="px-6 py-4 text-gray-700">Patient homes, offices, care facilities, research sites</td>
                    <td className="px-6 py-4 text-gray-700">Hospital lab, doctor&apos;s office, draw station</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">Patients seen per day</td>
                    <td className="px-6 py-4 text-gray-700">3–10 (limited by drive time)</td>
                    <td className="px-6 py-4 text-gray-700">30–80 (high-volume environment)</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Patient interaction</td>
                    <td className="px-6 py-4 text-gray-700">Longer, personalized; often elderly or anxious patients</td>
                    <td className="px-6 py-4 text-gray-700">Shorter, higher volume; mostly ambulatory patients</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">Specimen handling</td>
                    <td className="px-6 py-4 text-gray-700">Manages transport, chain-of-custody, time/temp windows</td>
                    <td className="px-6 py-4 text-gray-700">In-house processing, no transport responsibility</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900">Business structure</td>
                    <td className="px-6 py-4 text-gray-700">Often self-employed or works for a mobile service</td>
                    <td className="px-6 py-4 text-gray-700">Employed by hospital, lab, or clinic</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Who uses them */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Who Uses a Mobile Phlebotomist?</h2>
            <p className="text-gray-700 mb-6">
              Mobile phlebotomy serves patients and organizations for whom an in-person trip to a lab is impractical, uncomfortable, or impossible.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Homebound &amp; Mobility-Limited Patients</h3>
                <p className="text-gray-600">
                  Elderly patients in assisted living, post-surgical recovery, hospice care, or anyone with mobility limitations that make travel to a lab burdensome or risky.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Patients on Frequent Monitoring</h3>
                <p className="text-gray-600">
                  Anticoagulation (warfarin/INR), hormone therapy, fertility/IVF protocols, and chronic disease management where draws happen weekly or biweekly.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Anxious or Needle-Sensitive Patients</h3>
                <p className="text-gray-600">
                  Children, individuals with disabilities, patients with severe needle phobia, or anyone for whom a clinical environment increases distress.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Senior Living Facilities</h3>
                <p className="text-gray-600">
                  Assisted living and skilled nursing facilities use mobile phlebotomy for recurring resident draws — typically weekly or bi-weekly visits covering 5–40+ residents per round.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinical Research &amp; Trials</h3>
                <p className="text-gray-600">
                  Research organizations use mobile phlebotomists to collect samples from study participants who live outside the research site&apos;s metro, enabling broader and more diverse enrollment.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Corporate Wellness &amp; Concierge Care</h3>
                <p className="text-gray-600">
                  Employers offering biometric screenings, executive health programs, and concierge or functional medicine practices that bundle lab work with home visits.
                </p>
              </div>
            </div>
          </section>

          {/* Credentials */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What Credentials Should a Mobile Phlebotomist Have?</h2>
            <p className="text-gray-700 mb-6">
              Before booking, verify your mobile phlebotomist holds appropriate certification and insurance. Standards vary by state.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Certified Phlebotomy Technician (CPT)</h3>
                <p className="text-gray-700">
                  Issued by accredited bodies including the National Healthcareer Association (NHA), American Society for Clinical Pathology (ASCP), American Medical Technologists (AMT), and the National Center for Competency Testing (NCCT). Requires formal training plus a passing exam.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">State Licensure (Required in Some States)</h3>
                <p className="text-gray-700">
                  California, Louisiana, Nevada, and Washington require state-level phlebotomy licensure or certification. In other states, a national CPT credential plus an employer-issued scope of practice is the norm. Always check your state&apos;s requirements before booking.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Liability Insurance</h3>
                <p className="text-gray-700">
                  Reputable mobile phlebotomists carry professional liability insurance covering at-home procedures, with coverage typically in the $1M–$2M range. Ask before booking — uninsured providers shift the risk to you.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">HIPAA &amp; OSHA Training</h3>
                <p className="text-gray-700">
                  HIPAA training covers patient privacy and chain-of-custody. OSHA bloodborne pathogen training covers safe specimen handling and sharps disposal. Both should be current and documented.
                </p>
              </div>
            </div>
          </section>

          {/* Cost section — short, link to dedicated page */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How Much Does a Mobile Phlebotomist Cost?</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <p className="text-lg text-gray-900 mb-3">
                <strong>$75–$150 per visit</strong> is the typical mobile phlebotomy service fee in 2026. Lab processing fees are billed separately.
              </p>
              <p className="text-gray-700">
                Independent mobile phlebotomists usually charge $60–$100. National services like Quest Mobile run around $79 and Getlabs starts at $35. Medicare and Medicaid patients typically pay $0–$25 when the draw is medically necessary and ordered by a physician.
              </p>
            </div>
            <p className="text-gray-700">
              For a complete breakdown by service type, state, and specialty kit,{' '}
              <Link href="/mobile-phlebotomy-cost" className="text-green-600 hover:text-green-700 underline">
                see our full mobile phlebotomy cost guide
              </Link>
              .
            </p>
          </section>

          {/* How to find one */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to Find a Mobile Phlebotomist Near You</h2>
            <p className="text-gray-700 mb-4">
              The fastest path to finding a vetted mobile phlebotomist in your area:
            </p>
            <ol className="space-y-3 text-gray-700 ml-6 list-decimal list-inside">
              <li>
                <strong>Search the MobilePhlebotomy.org directory</strong> by city or ZIP code —{' '}
                <Link href="/search" className="text-green-600 hover:text-green-700 underline">
                  start your search here
                </Link>
                . Listings include service area, specialties, pricing notes, and contact info.
              </li>
              <li>
                <strong>Ask your doctor&apos;s office</strong> for a referral. Many practices already work with mobile phlebotomists for homebound patients.
              </li>
              <li>
                <strong>Check with your insurance</strong> for in-network mobile providers, especially if you have Medicare, Medicaid, or a chronic condition that qualifies for at-home services.
              </li>
              <li>
                <strong>Compare credentials, pricing, and coverage area</strong> before booking. Confirm CPT certification, insurance, and that they service your specific ZIP.
              </li>
            </ol>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mobile Phlebotomist FAQ</h2>
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
            <h2 className="text-2xl font-bold mb-4">Find a Mobile Phlebotomist in Your Area</h2>
            <p className="text-green-100 mb-6 text-lg">
              Search certified independent providers in our nationwide directory. Compare specialties, pricing, and reviews.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/search"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Search Providers Near You
              </Link>
              <Link
                href="/mobile-phlebotomy-cost"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              >
                See 2026 Pricing
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
