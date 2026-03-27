import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Can Mobile Phlebotomists Bill Medicare? Yes — Here\'s How (2026)',
  description: 'Mobile phlebotomists can bill Medicare using CPT code 36415 with travel fee G0471 — but only for homebound patients. Learn the requirements, reimbursement rates, and how to get set up as a Medicare provider.',
  keywords: 'mobile phlebotomy medicare billing, can phlebotomists bill medicare, medicare mobile blood draw, CPT 36415, G0471 travel fee, medicare homebound phlebotomy, mobile phlebotomy reimbursement',
  openGraph: {
    title: 'Can Mobile Phlebotomists Bill Medicare? Yes — Here\'s How (2026)',
    description: 'Mobile phlebotomists can bill Medicare using CPT 36415 + G0471 for homebound patients. Full guide to requirements, rates, and enrollment.',
    type: 'article',
  }
}

export default function MedicareBillingPage() {
  const today = new Date().toISOString().split('T')[0]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Can Mobile Phlebotomists Bill Medicare? Yes — Here\'s How',
    description: 'Complete guide to Medicare billing for mobile phlebotomy services including CPT codes, homebound requirements, reimbursement rates, and provider enrollment.',
    author: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    publisher: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    datePublished: '2025-06-01',
    dateModified: today,
    mainEntityOfPage: 'https://www.mobilephlebotomy.org/can-mobile-phlebotomists-bill-medicare'
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can a mobile phlebotomist bill Medicare directly?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, but only if you are enrolled as a Medicare provider or work under a lab or physician that is enrolled. Individual phlebotomists typically bill through an enrolled laboratory or physician practice rather than billing Medicare directly.'
        }
      },
      {
        '@type': 'Question',
        name: 'What CPT codes do mobile phlebotomists use for Medicare?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The primary code is CPT 36415 (routine venipuncture) which reimburses approximately $3-5. The key code for mobile phlebotomists is G0471 (collection of venous blood by venipuncture from patient in a skilled nursing facility or by a laboratory on behalf of a home health agency) which adds a travel/collection fee of approximately $7-10.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does the patient need to be homebound for Medicare to cover mobile phlebotomy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For the travel fee (G0471) to apply, the patient generally needs to be in a skilled nursing facility or receiving home health services. For standard specimen collection, the patient does not need to be homebound, but the ordering physician must document medical necessity for the blood draw itself.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much does Medicare reimburse for mobile blood draws?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Medicare reimburses approximately $3-5 for the venipuncture (CPT 36415) plus $7-10 for the specimen collection fee (G0471) when applicable. The actual lab tests are billed separately. Total reimbursement for the draw itself is typically $10-15 per patient visit.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I enroll as a Medicare provider for mobile phlebotomy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You need to enroll through the CMS PECOS system (Provider Enrollment, Chain, and Ownership System). You will need a CLIA waiver or certificate, an NPI number, professional liability insurance, and your state phlebotomy license or certification. The process typically takes 60-90 days. Many mobile phlebotomists find it easier to contract with an already-enrolled laboratory.'
        }
      }
    ]
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero Answer Block */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-sm text-primary-200 mb-2">Last updated: March 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Can Mobile Phlebotomists Bill Medicare?
          </h1>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
            <p className="text-lg leading-relaxed">
              <strong>Yes, mobile phlebotomists can bill Medicare</strong> — but typically through an enrolled laboratory or physician practice, not as individual phlebotomists. The key codes are <strong>CPT 36415</strong> (venipuncture, ~$3-5) and <strong>G0471</strong> (specimen collection/travel fee, ~$7-10). The patient must have a physician order, and the travel fee applies primarily to skilled nursing facility patients or those receiving home health services.
            </p>
          </div>
        </div>
      </section>

      <article className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">

          <h2 className="text-2xl font-bold text-gray-900 mb-4">The Two CPT Codes You Need to Know</h2>
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-primary-700 text-lg mb-2">CPT 36415</h3>
                <p className="text-gray-600 mb-2">Routine venipuncture (blood draw)</p>
                <p className="text-2xl font-bold text-gray-900">~$3-5</p>
                <p className="text-sm text-gray-500">Medicare reimbursement</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-primary-700 text-lg mb-2">G0471</h3>
                <p className="text-gray-600 mb-2">Specimen collection fee (travel)</p>
                <p className="text-2xl font-bold text-gray-900">~$7-10</p>
                <p className="text-sm text-gray-500">Medicare reimbursement</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              The lab tests themselves (CBC, metabolic panel, etc.) are billed separately by the processing laboratory.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Who Can Bill Medicare?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Individual phlebotomists cannot bill Medicare on their own. You must either:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
            <li><strong>Work under an enrolled laboratory</strong> — The lab bills Medicare and pays you for the draw. This is the most common setup for mobile phlebotomists.</li>
            <li><strong>Enroll your own lab</strong> — If you operate your own CLIA-certified lab or have a CLIA waiver, you can enroll as a Medicare provider directly.</li>
            <li><strong>Contract with a physician practice</strong> — Some practices hire mobile phlebotomists as contractors and bill the draw under their practice NPI.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements for the Travel Fee (G0471)</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The G0471 code is where mobile phlebotomists make the draw worthwhile. Without it, the $3-5 for a basic venipuncture doesn&apos;t cover your gas. To bill G0471:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
            <li>Patient must be in a <strong>skilled nursing facility (SNF)</strong>, or</li>
            <li>Collection must be performed <strong>on behalf of a home health agency (HHA)</strong></li>
            <li>The ordering physician must document <strong>medical necessity</strong> for the blood work</li>
            <li>You must maintain documentation of the <strong>travel and collection</strong></li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Enroll as a Medicare Provider</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you want to bill Medicare directly (rather than through another lab), here&apos;s the process:
          </p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-3 mb-8">
            <li><strong>Get your NPI number</strong> — Apply at nppes.cms.hhs.gov (free, takes 1-2 weeks)</li>
            <li><strong>Obtain CLIA certification</strong> — Even a Certificate of Waiver is required. Apply through your state health department.</li>
            <li><strong>Get professional liability insurance</strong> — Most require $1M/$3M coverage minimum.</li>
            <li><strong>Enroll through PECOS</strong> — The CMS Provider Enrollment, Chain, and Ownership System. This is where you formally register as a Medicare provider.</li>
            <li><strong>Wait for approval</strong> — Typically 60-90 days. Do not bill Medicare before your effective date.</li>
          </ol>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-yellow-800 mb-2">Reality Check</h3>
            <p className="text-yellow-800">
              Most independent mobile phlebotomists don&apos;t bill Medicare directly. The reimbursement per draw ($10-15) is low, the paperwork is heavy, and the enrollment process is slow. The more common — and often more profitable — path is contracting with labs that are already enrolled. They handle the billing, you handle the draws, and you get paid per draw without the administrative burden.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Medicaid vs. Medicare</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Medicaid is state-administered and rules vary. Some states allow phlebotomy-only providers to enroll, others require you to work under a licensed lab. Reimbursement rates are generally lower than Medicare. Check with your state&apos;s Medicaid office for specific requirements.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">The Better Alternative for Most Phlebotomists</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Instead of dealing with Medicare billing directly, many successful mobile phlebotomists focus on:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
            <li><strong>Private-pay patients</strong> who pay $60-150 per draw (much higher than Medicare rates)</li>
            <li><strong>Lab contracts</strong> that pay $15-35 per draw and handle all billing</li>
            <li><strong>Nursing home contracts</strong> where you draw multiple patients per visit</li>
            <li><strong>Getting listed on directories</strong> like <Link href="/add-provider" className="text-primary-600 underline hover:text-primary-800">MobilePhlebotomy.org</Link> to receive patient referrals</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          {faqSchema.mainEntity.map((faq, i) => (
            <div key={i} className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.name}</h3>
              <p className="text-gray-700 leading-relaxed">{faq.acceptedAnswer.text}</p>
            </div>
          ))}

          {/* Related Resources */}
          <div className="bg-gray-50 rounded-xl p-6 mt-12 mb-8">
            <h3 className="font-bold text-gray-900 mb-4">Related Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/how-to-get-contracts-mobile-phlebotomy" className="text-primary-600 hover:underline">How to Get Contracts for Mobile Phlebotomy →</Link></li>
              <li><Link href="/mobile-phlebotomy-1099-contractor" className="text-primary-600 hover:underline">Mobile Phlebotomy as a 1099 Contractor →</Link></li>
              <li><Link href="/how-to-get-patients-as-a-mobile-phlebotomist" className="text-primary-600 hover:underline">How to Get Patients as a Mobile Phlebotomist →</Link></li>
            </ul>
          </div>

          {/* CTA */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Start Getting Patient Referrals</h2>
            <p className="text-gray-600 mb-6">List your mobile phlebotomy business on MobilePhlebotomy.org — completely free. We send you patient leads with no fees and no commission.</p>
            <Link href="/add-provider" className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors">
              Get Listed Free
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
