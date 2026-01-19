import { Metadata } from 'next'
import Link from 'next/link'
import { topMetroAreas } from '@/data/top-metros'

export const metadata: Metadata = {
  title: 'At-Home Blood Draw Services: Complete Guide to Mobile Phlebotomy (2026)',
  description: '✓ Skip the lab wait! Get professional at-home blood draws from certified phlebotomists. Compare prices, check insurance coverage, and book same-day appointments. 500+ providers nationwide.',
  keywords: 'at-home blood draw services, mobile blood draw, home phlebotomy services, at home blood work, mobile lab services, home blood collection, traveling phlebotomist, mobile blood testing, in-home blood draw',
  openGraph: {
    title: 'At-Home Blood Draw Services: Complete Guide to Mobile Phlebotomy (2026)',
    description: '✓ Skip the lab wait! Get professional at-home blood draws from certified phlebotomists. Compare prices, check insurance coverage, and book same-day appointments. 500+ providers nationwide.',
    type: 'article',
    publishedTime: '2024-01-01',
    modifiedTime: new Date().toISOString(),
  }
}

export default function AtHomeBloodDrawServicesPage() {
  const featuredMetros = topMetroAreas.slice(0, 12)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'At-Home Blood Draw Services: Complete Guide to Mobile Phlebotomy',
    description: 'Comprehensive guide to at-home blood draw services including costs, benefits, safety, and how to find certified mobile phlebotomists.',
    author: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org'
    },
    publisher: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
      }
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/at-home-blood-draw-services`
    }
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is mobile phlebotomy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mobile phlebotomy is a healthcare service where certified phlebotomists travel to patients&apos; homes, offices, or preferred locations to collect blood samples for laboratory testing. This convenient alternative to traditional lab visits eliminates wait times and provides a comfortable, familiar environment for blood draws.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much do at-home blood draw services cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'At-home blood draw services typically cost between $60-150 per visit, depending on location, services requested, and provider. Many insurance plans cover mobile phlebotomy when medically necessary. Medicare and Medicaid often provide coverage for homebound patients.'
        }
      },
      {
        '@type': 'Question',
        name: 'Are at-home blood draws safe?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, at-home blood draws are safe when performed by certified professionals. Mobile phlebotomists maintain the same licensing, certification, and infection control standards as hospital-based phlebotomists. They use sterile equipment and follow strict safety protocols.'
        }
      },
      {
        '@type': 'Question',
        name: 'What types of blood tests can be done at home?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most routine blood tests can be performed at home including: complete blood count (CBC), metabolic panels, lipid panels, thyroid tests, diabetes monitoring (A1C), vitamin levels, hormone testing, fertility tests, and many specialized diagnostic tests ordered by your healthcare provider.'
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              At-Home Blood Draw Services: Your Complete Guide
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Everything you need to know about mobile phlebotomy services, from finding certified providers
              to understanding costs and insurance coverage.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/search"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Find Providers Near You
              </Link>
              <Link
                href="/mobile-phlebotomy-cost"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                View Pricing Guide
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">In This Guide</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <a href="#what-is-mobile-phlebotomy" className="block text-primary-600 hover:text-primary-700">
                  → What is Mobile Phlebotomy?
                </a>
                <a href="#benefits" className="block text-primary-600 hover:text-primary-700">
                  → Benefits of At-Home Blood Draws
                </a>
                <a href="#how-it-works" className="block text-primary-600 hover:text-primary-700">
                  → How Mobile Phlebotomy Works
                </a>
                <a href="#cost" className="block text-primary-600 hover:text-primary-700">
                  → Costs & Insurance Coverage
                </a>
              </div>
              <div className="space-y-2">
                <a href="#safety" className="block text-primary-600 hover:text-primary-700">
                  → Safety & Certification
                </a>
                <a href="#types-of-tests" className="block text-primary-600 hover:text-primary-700">
                  → Types of Blood Tests Available
                </a>
                <a href="#find-provider" className="block text-primary-600 hover:text-primary-700">
                  → How to Find a Provider
                </a>
                <a href="#frequently-asked-questions" className="block text-primary-600 hover:text-primary-700">
                  → Frequently Asked Questions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* What is Mobile Phlebotomy */}
          <section id="what-is-mobile-phlebotomy" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What is Mobile Phlebotomy?</h2>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                <strong>Mobile phlebotomy</strong> is a healthcare service where certified phlebotomists travel to patients&apos;
                homes, offices, or preferred locations to collect blood samples for laboratory testing. This convenient
                alternative to traditional lab visits eliminates wait times and provides a comfortable, familiar environment
                for blood draws.
              </p>
              <p className="text-gray-700 mb-4">
                Also known as at-home blood draw services, mobile blood collection, or traveling phlebotomy,
                this service has grown in popularity as patients seek more convenient healthcare options. Mobile
                phlebotomists bring all necessary equipment and maintain the same professional standards as
                hospital-based blood collection services.
              </p>
            </div>
          </section>

          {/* Benefits */}
          <section id="benefits" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Benefits of At-Home Blood Draws</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-primary-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Convenience & Comfort</h3>
                    <p className="text-gray-600">No travel time, parking fees, or waiting rooms. Blood draws happen in your familiar environment.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-primary-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Savings</h3>
                    <p className="text-gray-600">Appointments typically take 15-30 minutes with no wait time. Perfect for busy schedules.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-primary-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Reduced Exposure</h3>
                    <p className="text-gray-600">Avoid crowded medical facilities, especially important for immunocompromised patients.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-primary-600 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Better for Special Populations</h3>
                    <p className="text-gray-600">Ideal for elderly patients, children, disabled individuals, or those with mobility limitations.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-primary-600 font-bold">5</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Service</h3>
                    <p className="text-gray-600">One-on-one attention from certified professionals in a private setting.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-primary-600 font-bold">6</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
                    <p className="text-gray-600">Many providers offer early morning, evening, and weekend appointments.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How it Works */}
          <section id="how-it-works" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How Mobile Phlebotomy Works</h2>
            <div className="bg-gray-50 rounded-lg p-8 mb-8">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📞</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Book Appointment</h3>
                  <p className="text-sm text-gray-600">Schedule online or by phone with a certified mobile phlebotomist</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🚗</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. Phlebotomist Arrives</h3>
                  <p className="text-sm text-gray-600">Professional arrives at your location with all necessary equipment</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🩸</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Blood Collection</h3>
                  <p className="text-sm text-gray-600">Quick, professional blood draw using sterile equipment</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">4. Lab Processing</h3>
                  <p className="text-sm text-gray-600">Samples transported to lab; results sent to your doctor</p>
                </div>
              </div>
            </div>
            <p className="text-gray-700">
              The entire process typically takes 15-30 minutes from arrival to departure. Most providers
              offer same-day or next-day scheduling, with some offering emergency services for urgent
              testing needs.
            </p>
          </section>

          {/* Cost Section */}
          <section id="cost" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Costs & Insurance Coverage</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-3">Typical Pricing</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-blue-800">Basic Blood Draw</div>
                  <div className="text-blue-700">$60 - $85</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-800">Multiple Vials</div>
                  <div className="text-blue-700">$85 - $120</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-800">Specialty Tests</div>
                  <div className="text-blue-700">$100 - $150</div>
                </div>
              </div>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                <strong>Insurance Coverage:</strong> Many insurance plans cover mobile phlebotomy when medically necessary.
                This includes Medicare, Medicaid, and most private insurance plans. Coverage is typically available for:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
                <li>Homebound patients</li>
                <li>Elderly individuals with mobility limitations</li>
                <li>Patients with chronic conditions requiring frequent monitoring</li>
                <li>Individuals unable to travel to traditional labs</li>
              </ul>
              <p className="text-gray-700">
                <Link href="/mobile-phlebotomy-cost" className="text-primary-600 hover:text-primary-700 font-semibold">
                  View our detailed pricing guide →
                </Link>
              </p>
            </div>
          </section>

          {/* Safety Section */}
          <section id="safety" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Safety & Certification</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Requirements</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>State licensing and certification (ASCP, NCA, or AMT)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Continuing education requirements</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Background checks and professional liability insurance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>HIPAA compliance and patient privacy protection</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Safety Protocols</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Single-use, sterile equipment for every patient</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Proper specimen handling and chain of custody</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Infection control and universal precautions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Emergency preparedness and first aid certification</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Types of Tests */}
          <section id="types-of-tests" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Types of Blood Tests Available</h2>
            <p className="text-gray-700 mb-6">
              Most routine and specialized blood tests can be performed through mobile phlebotomy services:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Routine Tests</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Complete Blood Count (CBC)</li>
                  <li>• Basic Metabolic Panel</li>
                  <li>• Comprehensive Metabolic Panel</li>
                  <li>• Lipid Panel</li>
                  <li>• Liver Function Tests</li>
                  <li>• Kidney Function Tests</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Specialized Tests</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Thyroid Function (TSH, T3, T4)</li>
                  <li>• Hemoglobin A1C (Diabetes)</li>
                  <li>• Vitamin Levels (B12, D, etc.)</li>
                  <li>• Hormone Testing</li>
                  <li>• Cardiac Markers</li>
                  <li>• Inflammatory Markers</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Monitoring Tests</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• INR/PT/PTT (Blood Thinners)</li>
                  <li>• Drug Level Monitoring</li>
                  <li>• Fertility Testing</li>
                  <li>• Pregnancy Testing</li>
                  <li>• Allergy Testing</li>
                  <li>• Cancer Markers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Find Provider Section */}
          <section id="find-provider" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to Find a Mobile Phlebotomy Provider</h2>
            <div className="bg-primary-50 rounded-lg p-8 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Start Your Search</h3>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/mobile-blood-draw-near-me"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Find Providers Near Me
                </Link>
                <Link
                  href="/search"
                  className="border border-primary-600 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-600 hover:text-white transition-colors"
                >
                  Search by Services
                </Link>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Popular Service Areas</h3>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {featuredMetros.map((metro) => (
                <Link
                  key={metro.slug}
                  href={`/us/metro/${metro.slug}`}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  {metro.city}, {metro.stateAbbr} →
                </Link>
              ))}
            </div>

            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What to Look For</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Proper Certification:</strong> Verify the phlebotomist is certified by ASCP, NCA, or AMT</li>
                <li><strong>Insurance:</strong> Ensure they carry professional liability insurance</li>
                <li><strong>Experience:</strong> Look for providers with experience in mobile services</li>
                <li><strong>Reviews:</strong> Check patient reviews and ratings</li>
                <li><strong>Services:</strong> Confirm they offer the specific tests you need</li>
                <li><strong>Availability:</strong> Check their scheduling options and coverage area</li>
              </ul>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="frequently-asked-questions" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How accurate are mobile blood draw results?</h3>
                <p className="text-gray-700">
                  Mobile blood draw results are just as accurate as traditional lab draws. The same laboratory
                  processes the samples, and mobile phlebotomists use identical equipment and procedures. The
                  only difference is the location of collection.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I prepare for an at-home blood draw?</h3>
                <p className="text-gray-700">
                  Preparation depends on your specific tests. Some require fasting, others don&apos;t. Your provider
                  will give you specific instructions when scheduling. Generally, drink plenty of water unless
                  told otherwise, and wear loose-fitting sleeves for easy access.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Can children have mobile blood draws?</h3>
                <p className="text-gray-700">
                  Yes, many mobile phlebotomists specialize in pediatric blood draws. The familiar home environment
                  often makes the experience less stressful for children. Look for providers with
                  <Link href="/search?services=Pediatric" className="text-primary-600 hover:text-primary-700 ml-1">
                    pediatric experience
                  </Link>.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How long does it take to get results?</h3>
                <p className="text-gray-700">
                  Results timing depends on the specific tests ordered, typically 24-48 hours for routine tests
                  and 3-7 days for specialized testing. Results are sent directly to your healthcare provider,
                  who will contact you with the findings.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Book Your At-Home Blood Draw?</h2>
            <p className="text-primary-100 mb-6">
              Find certified mobile phlebotomists in your area and schedule your convenient at-home appointment today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/search"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Find Providers
              </Link>
              <Link
                href="/mobile-blood-draw-near-me"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                Search Near Me
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}