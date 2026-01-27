import { Metadata } from 'next'
import Link from 'next/link'
import { CorporateQuoteForm } from './CorporateQuoteForm'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Facilities & Group Mobile Phlebotomy Services | MobilePhlebotomy.org',
  description: 'Coordination of certified mobile phlebotomists for facilities, organizations, and group blood draw needs. Nationwide provider network with metro-area coverage.',
  alternates: {
    canonical: `${SITE_URL}/corporate-phlebotomy`,
  },
  openGraph: {
    title: 'Facilities & Group Mobile Phlebotomy Services',
    description: 'Coordination of certified mobile phlebotomists for facilities, organizations, and group blood draw needs.',
    url: `${SITE_URL}/corporate-phlebotomy`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Facilities & Group Mobile Phlebotomy Services',
    description: 'Coordination of certified mobile phlebotomists for facilities, organizations, and group blood draw needs.',
  },
}

const benefits = [
  {
    title: 'Certified, Experienced Mobile Phlebotomists',
    description: 'We coordinate vetted, certified technicians experienced in mobile and facility-based blood draws.'
  },
  {
    title: 'Coordination for 1–50+ Technicians',
    description: 'From small facility needs to large events, we help coordinate staffing at scale.'
  },
  {
    title: 'Nationwide Provider Network',
    description: 'We coordinate certified mobile phlebotomists in major metros across the United States.'
  },
  {
    title: 'On-Site Collection & Labeling',
    description: 'Coordination of professional specimen collection, labeling, and handling following protocols.'
  },
  {
    title: 'Packaging & Shipping Support',
    description: 'We help coordinate packaging and shipping logistics to your designated lab.'
  },
  {
    title: 'Kit-Based or Standard Lab Draws',
    description: 'Coordination for work with your lab kits and collection materials, or help sourcing supplies.'
  },
  {
    title: 'HIPAA-Conscious Workflows',
    description: 'All coordinated phlebotomists follow HIPAA-compliant practices for handling information and specimens.'
  },
  {
    title: 'Flexible Coverage',
    description: 'Single-day services, multi-day events, or recurring facility support programs.'
  }
]

const audiences = [
  'Medical and clinical research studies',
  'Universities and research institutions',
  'Healthcare facilities & hospitals',
  'Assisted living & nursing homes',
  'Corporate wellness programs',
  'Health fairs and community events',
  'Conferences and trade shows',
  'Government agencies and schools'
]

const faqs = [
  {
    question: 'Do you supply the phlebotomists?',
    answer: 'We coordinate certified mobile phlebotomists who have experience with facility and event-based draws. All providers are vetted, certified, and insured independent professionals.'
  },
  {
    question: 'Can you coordinate supplies and shipping?',
    answer: 'Yes, in many cases we can help coordinate supplies and packaging logistics. We can also work with your lab kits and shipping labels if you have an existing lab partnership.'
  },
  {
    question: 'How quickly can you coordinate staffing?',
    answer: 'Response times vary by location and provider availability. In major metros, coordination may be possible within several days to 1-2 weeks depending on scope and timing. We recommend reaching out as early as possible.'
  },
  {
    question: 'Do you offer nationwide coverage?',
    answer: 'We work with a nationwide provider network focused on major metropolitan areas across the United States. Availability varies by location. Contact us to discuss coverage in your specific area.'
  },
  {
    question: 'Can you support recurring programs?',
    answer: 'Yes. We help coordinate recurring facility support, wellness programs, multi-visit screenings, and ongoing research draws. We work with you to establish consistent provider scheduling.'
  },
  {
    question: 'Are your providers HIPAA compliant?',
    answer: 'All coordinated phlebotomists follow HIPAA-compliant practices for handling patient information and specimens. We are currently coordinating mobile phlebotomy coverage for research and facility-based programs in multiple U.S. metros.'
  }
]

export default function CorporatePhlebotomyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Facilities & Group Mobile Phlebotomy Services
              </h1>
              <p className="text-xl text-primary-100 mb-4">
                Coordination of certified mobile phlebotomists for facilities, organizations, and group blood draw needs.
              </p>
              <p className="text-lg text-primary-50 mb-6">
                We coordinate certified phlebotomists for medical facilities, events, and recurring health programs through our nationwide provider network.
              </p>
              <p className="text-sm text-primary-100 mb-8 italic">
                Services are coordinated through vetted independent mobile phlebotomy providers. Availability and response times may vary by location.
              </p>
              <a
                href="#quote-form"
                className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg"
              >
                Request Coordination Review
              </a>
            </div>

            {/* Right Column - Key Points Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold mb-6">What We Coordinate:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>Certified mobile phlebotomists with facility/event experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>Coordination for 1 to 50+ technicians as needed</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>Nationwide provider network with metro-area coverage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>Support for specimen handling & logistics coordination</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>HIPAA-compliant provider workflows</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Coordinating phlebotomists for facilities and groups doesn&apos;t have to be complicated
            </h2>
            <p className="text-lg text-gray-600">
              We help coordinate logistics and provider communication so you can focus on your mission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Trial & Research Callout */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-y border-blue-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 border border-blue-200">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Clinical Trial & Research Phlebotomy Coordination
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                We coordinate mobile phlebotomy services for clinical research studies, decentralized trials, and multi-site data collection programs.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our network supports protocol-driven blood draws, recurring study visits, and site or in-home collections across major U.S. metros.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <p className="font-semibold text-gray-900 mb-3">Common use cases include:</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>Phase I–IV clinical trials</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>Decentralized and hybrid study models</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>Home-based participant collections</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>Skilled nursing and assisted-living research draws</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>Recurring study visit schedules</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Events and organizations we support
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audiences.map((audience, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg px-6 py-4 shadow-sm border border-gray-200 flex items-center"
                >
                  <span className="text-primary-600 mr-3">→</span>
                  <span className="text-gray-800 font-medium">{audience}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quote Request Form Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <CorporateQuoteForm />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-primary-50 rounded-lg p-8 border-2 border-primary-200 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Ready to coordinate your facility or group needs?
              </h3>
              <p className="text-gray-700 mb-6">
                Request a coordination review for your facility or group phlebotomy needs.
              </p>
              <a
                href="#quote-form"
                className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Request Coordination Review
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 bg-white border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-4">
            Looking for individual mobile phlebotomy services?
          </p>
          <Link
            href="/mobile-phlebotomy-near-me"
            className="text-primary-600 hover:text-primary-700 underline font-medium"
          >
            Find a mobile phlebotomist near you →
          </Link>
        </div>
      </section>
    </div>
  )
}
