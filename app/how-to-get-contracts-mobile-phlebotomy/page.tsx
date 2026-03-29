import { Metadata } from 'next'
import Link from 'next/link'
import DrawReportCTA from '@/components/DrawReportCTA'

export const metadata: Metadata = {
  title: 'How to Get Contracts for Mobile Phlebotomy — Step-by-Step Guide (2026)',
  description: 'Land mobile phlebotomy contracts with nursing homes, home health agencies, labs, and insurance companies. Includes what to charge, what to include in your proposal, and who to contact.',
  keywords: 'mobile phlebotomy contracts, how to get phlebotomy contracts, nursing home phlebotomy contract, mobile phlebotomy proposal, lab contracts phlebotomy, home health phlebotomy contract',
  openGraph: {
    title: 'How to Get Contracts for Mobile Phlebotomy — Step-by-Step Guide',
    description: 'Step-by-step guide to landing phlebotomy contracts with nursing homes, home health agencies, labs, and insurance companies.',
    type: 'article',
  }
}

export default function GetContractsPage() {
  const today = new Date().toISOString().split('T')[0]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How to Get Contracts for Mobile Phlebotomy',
    description: 'Step-by-step guide to landing mobile phlebotomy contracts with nursing homes, home health agencies, labs, and insurance companies.',
    author: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    publisher: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    datePublished: '2025-06-01',
    dateModified: today,
    mainEntityOfPage: 'https://www.mobilephlebotomy.org/how-to-get-contracts-mobile-phlebotomy'
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much should I charge for a mobile phlebotomy contract?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Contract rates vary by client type. Nursing homes typically pay $10-20 per draw (with volume making up for the lower rate). Home health agencies pay $15-30 per draw. Reference labs pay $12-25 per draw plus mileage. Private physician offices pay $15-35 per draw. For high-volume contracts (20+ draws per week), you can offer a slight discount while still maintaining profitability.'
        }
      },
      {
        '@type': 'Question',
        name: 'What should I include in a mobile phlebotomy contract proposal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Your proposal should include: your credentials and certifications, proof of liability insurance ($1M/$3M minimum), CLIA waiver if applicable, pricing per draw with volume discounts, turnaround time guarantees, specimen handling and transport procedures, days and hours of availability, backup phlebotomist coverage plan, and references from current clients.'
        }
      },
      {
        '@type': 'Question',
        name: 'Who do I contact at a nursing home to get a phlebotomy contract?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Contact the Director of Nursing (DON) first. They make the clinical decisions about who draws blood for their residents. If the DON is interested, they will typically involve the facility administrator for the business terms. Call the front desk, ask for the DON by name, and request a 10-minute meeting to discuss your phlebotomy services.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need insurance to get mobile phlebotomy contracts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Professional liability insurance (malpractice) is required by virtually every facility and agency you will contract with. The standard minimum is $1,000,000 per occurrence / $3,000,000 aggregate. General liability insurance is also recommended. Expect to pay $300-800 per year for phlebotomy-specific professional liability coverage.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I find home health agencies that need phlebotomists?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Search Medicare.gov\'s Home Health Compare tool for agencies in your area. You can also search Google for "home health agency [your city]" and call each one. Ask to speak with the clinical coordinator or Director of Patient Services. Many agencies struggle to find reliable phlebotomists, so your call is often welcome rather than a cold sales pitch.'
        }
      }
    ]
  }

  const contractTypes = [
    {
      type: 'Nursing Homes & Assisted Living',
      pay: '$10-20 per draw',
      volume: '5-20 draws/week',
      pros: 'Predictable schedule, multiple draws per visit, long-term relationships',
      cons: 'Lower per-draw rate, early morning schedules, paperwork',
      contact: 'Director of Nursing (DON)',
    },
    {
      type: 'Home Health Agencies',
      pay: '$15-30 per draw',
      volume: '3-15 draws/week',
      pros: 'Good pay per draw, flexible scheduling, growing market',
      cons: 'Driving between individual homes, variable volume',
      contact: 'Clinical Coordinator',
    },
    {
      type: 'Reference Laboratories',
      pay: '$12-25 per draw + mileage',
      volume: '10-40 draws/week',
      pros: 'High volume, steady work, lab handles billing',
      cons: 'Lower rates, strict protocols, specimens must be processed quickly',
      contact: 'Client Services Manager',
    },
    {
      type: 'Physician Offices',
      pay: '$15-35 per draw',
      volume: '2-10 draws/week',
      pros: 'Simple draws, consistent referrals, relationship-based',
      cons: 'Lower volume per office, need multiple offices',
      contact: 'Office Manager',
    },
    {
      type: 'Clinical Trials / Research',
      pay: '$25-75 per draw',
      volume: 'Variable',
      pros: 'Highest pay per draw, interesting work',
      cons: 'Strict protocols, inconsistent availability, requires training',
      contact: 'Clinical Research Coordinator',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="bg-primary-700 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-sm text-primary-200 mb-2">Last updated: March 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            How to Get Contracts for Mobile Phlebotomy
          </h1>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
            <p className="text-lg leading-relaxed">
              The most reliable mobile phlebotomy contracts come from <strong>nursing homes, home health agencies, and reference laboratories</strong>. Start by calling the Director of Nursing at every skilled nursing facility within 30 miles of you. One nursing home contract can mean 10-20 draws per week on a predictable schedule — enough to anchor your business while you build other revenue streams.
            </p>
          </div>
        </div>
      </section>

      <article className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contract Types Compared</h2>
          <div className="overflow-x-auto mb-12">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 border-b-2 border-gray-200 font-semibold">Contract Type</th>
                  <th className="text-left p-4 border-b-2 border-gray-200 font-semibold">Pay Rate</th>
                  <th className="text-left p-4 border-b-2 border-gray-200 font-semibold">Volume</th>
                  <th className="text-left p-4 border-b-2 border-gray-200 font-semibold">Who to Contact</th>
                </tr>
              </thead>
              <tbody>
                {contractTypes.map((c, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{c.type}</td>
                    <td className="p-4 text-gray-700">{c.pay}</td>
                    <td className="p-4 text-gray-700">{c.volume}</td>
                    <td className="p-4 text-gray-700">{c.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: Get Your Credentials in Order</h2>
          <p className="text-gray-700 leading-relaxed mb-4">Before approaching any facility, make sure you have:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
            <li><strong>Professional liability insurance</strong> — $1M/$3M minimum. Get a certificate of insurance (COI) ready to email.</li>
            <li><strong>Phlebotomy certification</strong> — ASCP, AMT, NHA, or your state&apos;s required credential.</li>
            <li><strong>CLIA waiver</strong> (if you&apos;re processing or handling specimens)</li>
            <li><strong>Background check</strong> — Most facilities require a recent one. Get it done proactively.</li>
            <li><strong>CPR certification</strong> — Required by many facilities, easy to maintain.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 2: Build Your One-Page Proposal</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Nobody reads a 10-page proposal. Create a single page with:
          </p>
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <ul className="space-y-3 text-gray-700">
              <li><strong>Your name and business name</strong></li>
              <li><strong>Certifications and years of experience</strong></li>
              <li><strong>Services offered</strong> (venipuncture, capillary draws, urine collection, wound cultures, etc.)</li>
              <li><strong>Pricing</strong> — per draw rate, volume discounts if applicable</li>
              <li><strong>Availability</strong> — days, hours, how quickly you can respond to requests</li>
              <li><strong>Insurance</strong> — "Fully insured with $1M/$3M professional liability"</li>
              <li><strong>Your phone number and email</strong></li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 3: Start Calling</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The best contract opportunities come from direct outreach. Here&apos;s a simple phone script:
          </p>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-8 italic text-gray-800">
            &ldquo;Hi, my name is [Name] and I run a mobile phlebotomy service in the [City] area. I&apos;m reaching out to see if your facility currently uses an outside phlebotomist for blood draws, or if that&apos;s something you&apos;d be interested in discussing. Could I speak with the Director of Nursing?&rdquo;
          </div>
          <p className="text-gray-700 leading-relaxed mb-8">
            Expect to make 20-30 calls to land your first contract. That&apos;s normal. Facilities switch phlebotomists when their current one becomes unreliable — your timing just has to be right.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 4: Win on Reliability, Not Price</h2>
          <p className="text-gray-700 leading-relaxed mb-8">
            Facilities don&apos;t switch phlebotomists because someone offered $2 less per draw. They switch because the current phlebotomist didn&apos;t show up, was rude to patients, or had specimen handling issues. Your competitive advantage is being <strong>on time, every time</strong>, with clean technique and a friendly demeanor. That&apos;s it. Price is rarely the deciding factor.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 5: Get It in Writing</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Even for small contracts, get a simple agreement that covers:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
            <li>Rate per draw and payment terms (net 15, net 30)</li>
            <li>Expected volume and schedule</li>
            <li>Specimen handling and transport requirements</li>
            <li>Cancellation terms (30 days notice is standard)</li>
            <li>Insurance requirements</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          {faqSchema.mainEntity.map((faq, i) => (
            <div key={i} className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.name}</h3>
              <p className="text-gray-700 leading-relaxed">{faq.acceptedAnswer.text}</p>
            </div>
          ))}

          <div className="bg-gray-50 rounded-xl p-6 mt-12 mb-8">
            <h3 className="font-bold text-gray-900 mb-4">Related Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/how-to-get-patients-as-a-mobile-phlebotomist" className="text-primary-600 hover:underline">How to Get Patients as a Mobile Phlebotomist →</Link></li>
              <li><Link href="/can-mobile-phlebotomists-bill-medicare" className="text-primary-600 hover:underline">Can Mobile Phlebotomists Bill Medicare? →</Link></li>
              <li><Link href="/mobile-phlebotomy-1099-contractor" className="text-primary-600 hover:underline">Mobile Phlebotomy as a 1099 Contractor →</Link></li>
            </ul>
          </div>

          <DrawReportCTA />

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 text-center mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get Patient Referrals While You Build Contracts</h2>
            <p className="text-gray-600 mb-6">List your business on MobilePhlebotomy.org for free. We send you private-pay patient leads while you build your contract pipeline — no fees, no commission.</p>
            <Link href="/add-provider" className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors">
              Get Listed Free
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
