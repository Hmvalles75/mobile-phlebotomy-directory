import { Metadata } from 'next'
import Link from 'next/link'
import { CorporateQuoteForm } from './CorporateQuoteForm'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Corporate & Event Phlebotomy Staffing Services | MobilePhlebotomy.org',
  description: 'Professional mobile blood draw staffing for conferences, wellness fairs, clinical studies, and on-site employee screenings. Certified phlebotomists nationwide.',
  alternates: {
    canonical: `${SITE_URL}/corporate-phlebotomy`,
  },
  openGraph: {
    title: 'Corporate & Event Phlebotomy Staffing Services',
    description: 'Professional mobile blood draw staffing for conferences, wellness fairs, clinical studies, and on-site employee screenings.',
    url: `${SITE_URL}/corporate-phlebotomy`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Corporate & Event Phlebotomy Staffing Services',
    description: 'Professional mobile blood draw staffing for conferences, wellness fairs, clinical studies, and on-site employee screenings.',
  },
}

const benefits = [
  {
    title: 'Certified, Experienced Mobile Phlebotomists',
    description: 'All technicians are certified, background-checked, and experienced in mobile and event-based blood draws.'
  },
  {
    title: 'Coverage for 1–50+ Technicians',
    description: 'From small corporate screenings to large conference events, we scale to meet your staffing needs.'
  },
  {
    title: 'Nationwide Availability',
    description: 'We coordinate phlebotomists in major metros across the United States.'
  },
  {
    title: 'On-Site Collection & Labeling',
    description: 'Professional specimen collection, labeling, and handling following your protocol or lab requirements.'
  },
  {
    title: 'Packaging & Shipping Support',
    description: 'We can assist with packaging specimens and coordinating FedEx/UPS shipping to your designated lab.'
  },
  {
    title: 'Kit-Based or Standard Lab Draws',
    description: 'Work with your lab kits and collection materials, or we can help source supplies.'
  },
  {
    title: 'HIPAA-Conscious Workflows',
    description: 'All phlebotomists follow HIPAA-compliant practices for handling patient information and specimens.'
  },
  {
    title: 'Flexible Event Coverage',
    description: 'Single-day events, multi-day conventions, or recurring corporate health programs.'
  }
]

const audiences = [
  'Corporate wellness programs',
  'Employer health screenings',
  'Insurance exams',
  'Medical and clinical research studies',
  'Health fairs and community events',
  'Large conferences and trade shows',
  'Government agencies and schools',
  'Universities and research institutions'
]

const faqs = [
  {
    question: 'Do you supply the phlebotomists?',
    answer: 'Yes. We connect you with certified phlebotomists who have experience with mobile and event-based draws. All technicians are vetted, certified, and insured.'
  },
  {
    question: 'Can you provide supplies and shipping?',
    answer: 'Yes, in many cases we can assist with supplies and packaging. We can also work with your lab kits and shipping labels if you have an existing lab partnership.'
  },
  {
    question: 'How quickly can you staff an event?',
    answer: 'In many major metros we can coordinate staffing within 24–72 hours, depending on the size and timing of your event. For best results, we recommend reaching out 1-2 weeks in advance.'
  },
  {
    question: 'Do you offer nationwide coverage?',
    answer: 'We focus on major metropolitan areas across the United States and can often help with multi-location events. Contact us to confirm coverage in your specific area.'
  },
  {
    question: 'Can you support recurring programs?',
    answer: 'Yes. We can help with recurring corporate wellness programs, multi-visit screenings, and ongoing research draws. We\'ll work with you to establish a consistent staffing schedule.'
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
                Corporate & Event Phlebotomy Services
              </h1>
              <p className="text-xl text-primary-100 mb-4">
                Professional mobile blood draw staffing for conferences, wellness fairs, clinical studies, and on-site employee screenings.
              </p>
              <p className="text-lg text-primary-50 mb-8">
                We provide certified phlebotomists for one-day events, multi-day conventions, and recurring corporate health programs nationwide.
              </p>
              <a
                href="#quote-form"
                className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg"
              >
                Request Staffing Quote
              </a>
            </div>

            {/* Right Column - Key Points Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold mb-6">What We Provide:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>Certified phlebotomists with event experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>1 to 50+ technicians as needed</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>Nationwide coverage in major metros</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>Full specimen handling & logistics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-3 mt-1">✓</span>
                  <span>HIPAA-compliant workflows</span>
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
              Staffing phlebotomists for events doesn&apos;t have to be complicated
            </h2>
            <p className="text-lg text-gray-600">
              We handle the logistics so you can focus on your event.
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
                Ready to staff your event?
              </h3>
              <p className="text-gray-700 mb-6">
                Get a custom quote for your corporate or event phlebotomy needs.
              </p>
              <a
                href="#quote-form"
                className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Request Staffing Quote
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
