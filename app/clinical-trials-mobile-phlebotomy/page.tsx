import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Clinical Trial Mobile Phlebotomy Services | MobilePhlebotomy.org',
  description: 'Nationwide coordination of certified mobile phlebotomists for clinical research studies, decentralized trials, and protocol-driven blood draws.',
  alternates: {
    canonical: `${SITE_URL}/clinical-trials-mobile-phlebotomy`,
  },
  openGraph: {
    title: 'Clinical Trial Mobile Phlebotomy Services',
    description: 'Nationwide coordination of certified mobile phlebotomists for clinical research studies.',
    url: `${SITE_URL}/clinical-trials-mobile-phlebotomy`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clinical Trial Mobile Phlebotomy Services',
    description: 'Nationwide coordination of certified mobile phlebotomists for clinical research studies.',
  },
}

const supportedStudyTypes = [
  'Phase I–IV clinical trials',
  'Decentralized and hybrid trial models',
  'Home-based participant blood draws',
  'Skilled nursing and assisted-living study collections',
  'Site overflow or short-notice staffing gaps',
  'Recurring study visit schedules'
]

const clinicalFeatures = [
  'Certified mobile phlebotomists with facility and research experience',
  'Protocol-driven specimen collection and labeling',
  'HIPAA-conscious handling of participant information',
  'Coordination with sponsor-provided lab kits and shipping labels',
  'Support for recurring or multi-site study schedules',
  'Metro-area coverage across the United States'
]

const engagementModels = [
  'Single-visit or short-term studies',
  'Multi-week or multi-month recurring programs',
  'Pilot programs and study launches',
  'Scaling support as enrollment increases'
]

const clientTypes = [
  'Clinical research organizations (CROs)',
  'Research sponsors',
  'Universities and research institutions',
  'Healthcare systems conducting clinical studies',
  'Decentralized trial operators'
]

const faqs = [
  {
    question: 'Do you employ the phlebotomists directly?',
    answer: 'No. We coordinate certified, insured independent mobile phlebotomy providers with experience in facility and research-based collections.'
  },
  {
    question: 'Can you support multi-site or nationwide studies?',
    answer: 'Yes. We work with a nationwide provider network focused on major metropolitan areas. Availability varies by location.'
  },
  {
    question: 'Do you provide lab kits or shipping?',
    answer: 'We typically coordinate services using sponsor-provided lab kits and shipping labels, but can assist with logistics coordination when needed.'
  },
  {
    question: 'How quickly can coverage be arranged?',
    answer: 'Timing depends on location, scope, and provider availability. In many metros, coordination may be possible within days to 1–2 weeks. Early planning is recommended.'
  },
  {
    question: 'Can you support recurring or longitudinal studies?',
    answer: 'Yes. We regularly coordinate recurring draws and ongoing study schedules.'
  }
]

export default function ClinicalTrialsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Minimal, Professional */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Clinical Trial Mobile Phlebotomy Services
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Nationwide coordination of certified mobile phlebotomists for clinical research studies.
          </p>
          <a
            href="#request-form"
            className="inline-block bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            Request Coordination Review
          </a>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              MobilePhlebotomy.org coordinates experienced, certified mobile phlebotomists to support clinical trials, decentralized studies, and research programs across major U.S. metropolitan areas.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We help research teams secure reliable phlebotomy coverage for protocol-driven blood draws, recurring study visits, and participant home collections—without the overhead of building local staffing in every market.
            </p>
          </div>
        </div>
      </section>

      {/* What We Support */}
      <section className="py-16 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            What We Support
          </h2>
          <p className="text-gray-700 mb-6">
            We coordinate mobile phlebotomy services for:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportedStudyTypes.map((type, index) => (
              <div key={index} className="flex items-start bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-blue-600 mr-3 mt-1">→</span>
                <span className="text-gray-800">{type}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-6 italic">
            Coverage is coordinated through vetted independent mobile phlebotomy providers with experience in research and facility-based collections.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">
            How It Works
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-900 font-bold text-lg">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Submit a coordination request
                </h3>
                <p className="text-gray-700">
                  Share study details, locations, estimated volume, and timing.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-900 font-bold text-lg">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Provider matching & availability review
                </h3>
                <p className="text-gray-700">
                  We identify available, qualified mobile phlebotomists in the required metro areas.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-900 font-bold text-lg">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Scheduling & logistics coordination
                </h3>
                <p className="text-gray-700">
                  We help coordinate scheduling, provider communication, and logistics based on your protocol requirements.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-900 font-bold text-lg">4</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ongoing support for recurring studies
                </h3>
                <p className="text-gray-700">
                  For multi-visit or ongoing studies, we help maintain consistent coverage and provider continuity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical-Ready Coordination */}
      <section className="py-16 bg-blue-50 border-b border-blue-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Clinical-Ready Coordination
          </h2>
          <p className="text-gray-700 mb-8">
            Our coordination model is designed to support research workflows, including:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinicalFeatures.map((feature, index) => (
              <div key={index} className="flex items-start bg-white p-4 rounded-lg border border-blue-200">
                <span className="text-blue-600 mr-3">✓</span>
                <span className="text-gray-800">{feature}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-700 mt-8 font-medium">
            We currently coordinate mobile phlebotomy coverage for research and facility-based programs in multiple U.S. metros.
          </p>
        </div>
      </section>

      {/* Flexible Engagement Models */}
      <section className="py-16 border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Flexible Engagement Models
          </h2>
          <p className="text-gray-700 mb-6">
            We support a range of study structures, including:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {engagementModels.map((model, index) => (
              <div key={index} className="flex items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <span className="text-blue-600 mr-3">→</span>
                <span className="text-gray-800">{model}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 italic">
            Pricing and coordination models vary based on scope, location, volume, and scheduling requirements.
          </p>
        </div>
      </section>

      {/* Who We Work With */}
      <section className="py-16 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Who We Work With
          </h2>
          <div className="space-y-3">
            {clientTypes.map((type, index) => (
              <div key={index} className="flex items-center">
                <span className="text-blue-600 mr-3">•</span>
                <span className="text-gray-800 text-lg">{type}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-700 mt-8">
            If you're evaluating mobile phlebotomy as part of your study design, we can help assess feasibility and coverage options.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-900 to-slate-900 text-white" id="request-form">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">
            Request a Clinical Phlebotomy Coordination Review
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Tell us about your study requirements and locations.<br />
            We'll review availability and follow up with next steps.
          </p>
          <Link
            href="/corporate-phlebotomy#quote-form"
            className="inline-block bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg text-lg"
          >
            Request Coordination Review
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-gray-600 mb-4">
            Looking for individual mobile phlebotomy services?
          </p>
          <Link
            href="/search"
            className="text-blue-600 hover:text-blue-700 font-medium text-lg"
          >
            Find a mobile phlebotomist near you →
          </Link>
        </div>
      </section>
    </div>
  )
}
