import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy as a 1099 Contractor — Taxes, Deductions & Structure (2026)',
  description: 'Everything mobile phlebotomists need to know about working as a 1099 independent contractor: tax obligations, quarterly payments, deductible expenses, and whether to form an LLC.',
  keywords: 'mobile phlebotomy 1099, phlebotomist independent contractor, mobile phlebotomy taxes, phlebotomy business deductions, 1099 phlebotomist, mobile phlebotomy LLC',
  openGraph: {
    title: 'Mobile Phlebotomy as a 1099 Contractor — Taxes, Deductions & Structure',
    description: 'Tax obligations, deductions, quarterly payments, and business structure for independent mobile phlebotomists.',
    type: 'article',
  }
}

export default function ContractorPage() {
  const today = new Date().toISOString().split('T')[0]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Mobile Phlebotomy as a 1099 Contractor — Taxes, Deductions & Structure',
    description: 'Complete guide to 1099 independent contractor status for mobile phlebotomists including taxes, deductions, quarterly payments, and business structure.',
    author: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    publisher: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    datePublished: '2025-06-01',
    dateModified: today,
    mainEntityOfPage: 'https://www.mobilephlebotomy.org/mobile-phlebotomy-1099-contractor'
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do mobile phlebotomists get a W-2 or 1099?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It depends on how you work. If you set your own schedule, use your own equipment, and work for multiple clients, you are an independent contractor and receive a 1099-NEC. If a lab or agency controls when, where, and how you work, you should be classified as a W-2 employee. Many mobile phlebotomists are 1099 contractors by choice because it allows them to set their own rates and work for multiple clients.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much should a 1099 mobile phlebotomist set aside for taxes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Set aside 25-30% of your gross income for taxes. This covers federal income tax (10-22% for most phlebotomists), self-employment tax (15.3% on net earnings), and state income tax (varies by state). The self-employment tax is the one that surprises most new 1099 workers — it covers both the employer and employee portions of Social Security and Medicare.'
        }
      },
      {
        '@type': 'Question',
        name: 'What can a mobile phlebotomist deduct on taxes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Common deductions include: vehicle mileage (67 cents per mile in 2024), phlebotomy supplies (needles, tubes, tourniquets, gloves), professional liability insurance, health insurance premiums, phone and internet (business-use percentage), continuing education and certification fees, scrubs and uniforms, specimen transport coolers and bags, and home office expenses if you have a dedicated workspace.'
        }
      },
      {
        '@type': 'Question',
        name: 'Should a mobile phlebotomist form an LLC?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'An LLC is recommended but not required. It separates your personal assets from business liabilities, looks more professional when bidding on contracts, and can provide tax flexibility if you elect S-corp status once your income exceeds $50-60K. Most states charge $50-500 to form an LLC. You can start as a sole proprietor and form an LLC later when your business grows.'
        }
      },
      {
        '@type': 'Question',
        name: 'When do I need to pay quarterly estimated taxes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Quarterly estimated taxes are due April 15, June 15, September 15, and January 15 of the following year. You must pay quarterly if you expect to owe more than $1,000 in taxes for the year. Use IRS Form 1040-ES to calculate and pay. Most phlebotomists use IRS Direct Pay or EFTPS to make payments online. Missing quarterly payments results in penalties.'
        }
      }
    ]
  }

  const deductions = [
    { item: 'Vehicle mileage', detail: '67 cents/mile (2024 rate) — track every mile', typical: '$4,000-10,000/year' },
    { item: 'Supplies', detail: 'Needles, tubes, tourniquets, gloves, alcohol prep', typical: '$500-2,000/year' },
    { item: 'Professional liability insurance', detail: '$1M/$3M malpractice coverage', typical: '$300-800/year' },
    { item: 'Health insurance premiums', detail: '100% deductible for self-employed', typical: '$3,000-8,000/year' },
    { item: 'Phone & internet', detail: 'Business-use percentage only', typical: '$600-1,200/year' },
    { item: 'Certifications & CE', detail: 'ASCP renewal, continuing education courses', typical: '$200-500/year' },
    { item: 'Scrubs & uniforms', detail: 'Work-specific clothing only', typical: '$200-400/year' },
    { item: 'Transport equipment', detail: 'Coolers, specimen bags, centrifuge', typical: '$100-500/year' },
    { item: 'Business software', detail: 'Scheduling, invoicing, accounting tools', typical: '$200-600/year' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-sm text-primary-200 mb-2">Last updated: March 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Mobile Phlebotomy as a 1099 Independent Contractor
          </h1>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
            <p className="text-lg leading-relaxed">
              Most mobile phlebotomists work as <strong>1099 independent contractors</strong>, meaning you set your own schedule, use your own equipment, and work for multiple clients. The tradeoff: <strong>you&apos;re responsible for your own taxes</strong> (set aside 25-30% of gross income), quarterly estimated payments, and business expenses. The upside is higher earning potential and full control of your business.
            </p>
          </div>
        </div>
      </section>

      <article className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">

          <h2 className="text-2xl font-bold text-gray-900 mb-4">1099 vs. W-2: What&apos;s the Difference?</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-bold text-green-800 text-lg mb-3">1099 Contractor</h3>
              <ul className="space-y-2 text-green-900">
                <li>Set your own schedule</li>
                <li>Work for multiple clients</li>
                <li>Use your own equipment</li>
                <li>Set your own rates</li>
                <li>Pay your own taxes</li>
                <li>No benefits provided</li>
                <li>Higher earning potential</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-800 text-lg mb-3">W-2 Employee</h3>
              <ul className="space-y-2 text-blue-900">
                <li>Fixed schedule set by employer</li>
                <li>Work for one company</li>
                <li>Company provides equipment</li>
                <li>Fixed hourly rate or salary</li>
                <li>Taxes withheld automatically</li>
                <li>May include benefits</li>
                <li>Predictable income</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">The Tax Reality: What You Owe</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            As a 1099 contractor, you pay <strong>self-employment tax</strong> (15.3%) on top of regular income tax. This is the #1 surprise for new independent phlebotomists. Here&apos;s the breakdown:
          </p>
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-gray-700">Federal income tax</span>
                <span className="font-bold text-gray-900">10-22%</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-gray-700">Self-employment tax (Social Security + Medicare)</span>
                <span className="font-bold text-gray-900">15.3%</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-gray-700">State income tax</span>
                <span className="font-bold text-gray-900">0-13%</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-900 font-bold">Total to set aside</span>
                <span className="font-bold text-red-600 text-xl">25-30%</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-yellow-800 mb-2">Open a Separate Bank Account</h3>
            <p className="text-yellow-800">
              Every time you get paid, transfer 30% to a separate savings account for taxes. Don&apos;t touch it. Quarterly tax payments are due April 15, June 15, September 15, and January 15. This is the single most important financial habit for 1099 phlebotomists.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Deductions That Reduce Your Tax Bill</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The good news: your actual tax rate is lower than it looks because you deduct business expenses from your gross income before calculating taxes. Here are the most common deductions:
          </p>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 border-b-2 border-gray-200 font-semibold">Deduction</th>
                  <th className="text-left p-4 border-b-2 border-gray-200 font-semibold">Details</th>
                  <th className="text-left p-4 border-b-2 border-gray-200 font-semibold">Typical Value</th>
                </tr>
              </thead>
              <tbody>
                {deductions.map((d, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900">{d.item}</td>
                    <td className="p-4 text-gray-700">{d.detail}</td>
                    <td className="p-4 text-gray-700">{d.typical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Should You Form an LLC?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            You can operate as a <strong>sole proprietor</strong> (simplest — no registration needed) or form an <strong>LLC</strong> (more protection). Here&apos;s when an LLC makes sense:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>You want liability protection</strong> — an LLC separates personal and business assets</li>
            <li><strong>You&apos;re bidding on facility contracts</strong> — facilities prefer contracting with an LLC over an individual</li>
            <li><strong>Your income exceeds $50-60K</strong> — you may benefit from S-corp election to reduce self-employment tax</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mb-8">
            If you&apos;re just starting out, a sole proprietorship is fine. Form the LLC when you have steady income and contracts. Most states charge $50-500 for LLC registration.
          </p>

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
              <li><Link href="/how-to-get-contracts-mobile-phlebotomy" className="text-primary-600 hover:underline">How to Get Contracts for Mobile Phlebotomy →</Link></li>
              <li><Link href="/can-mobile-phlebotomists-bill-medicare" className="text-primary-600 hover:underline">Can Mobile Phlebotomists Bill Medicare? →</Link></li>
              <li><Link href="/best-website-builders-mobile-phlebotomy" className="text-primary-600 hover:underline">Best Website Builders for Mobile Phlebotomy →</Link></li>
            </ul>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Build Your 1099 Business Faster</h2>
            <p className="text-gray-600 mb-6">Get listed on MobilePhlebotomy.org for free and start receiving private-pay patient referrals. More patients means more 1099 income — no fees, no commission.</p>
            <Link href="/add-provider" className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors">
              Get Listed Free
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
