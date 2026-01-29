import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'CAREWITHLUVS LLC - Mobile Phlebotomy Services in Maryland | (240) 575-0041',
  description: 'Professional mobile phlebotomy, drug testing, and DNA testing services in Maryland. DOT/NON-DOT specimen collection, immigration DNA testing, and more. Evening and weekend availability. Call (240) 575-0041.',
  keywords: 'CAREWITHLUVS, mobile phlebotomy Maryland, blood draw Maryland, DOT drug testing Maryland, DNA testing Maryland, mobile specimen collection, 20785, Capitol Heights',
  openGraph: {
    title: 'CAREWITHLUVS LLC - Mobile Phlebotomy Services in Maryland',
    description: 'Professional mobile phlebotomy, drug testing, and DNA testing services in Maryland. Evening and weekend availability.',
    type: 'website',
  },
  alternates: {
    canonical: '/maryland/carewithluvs-mobile-phlebotomy'
  }
}

export default function CareWithLuvsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Column - Text Content */}
            <div>
              <div className="mb-4">
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
                  title="Founding Partners are early premium providers with prioritized visibility and direct lead access."
                >
                  <svg className="h-3.5 w-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  FOUNDING PARTNER
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                CAREWITHLUVS LLC
              </h1>

              <p className="text-xl text-primary-100 mb-6">
                Your Mobile Phlebotomy Agency<br />
                At Home • Nursing Home • Assisted Living
              </p>

              <p className="text-lg text-primary-50 mb-6">
                We come to you for all your lab work needs.<br />
                <span className="text-primary-100 font-semibold">Compassionate • Reliable • Convenient</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <a
                  href="tel:2405750041"
                  className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg text-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call (240) 575-0041
                </a>
                <a
                  href="mailto:carewithluvshealth@gmail.com"
                  className="inline-flex items-center px-8 py-4 bg-primary-800 text-white rounded-lg font-semibold hover:bg-primary-900 transition-colors border-2 border-white"
                >
                  Email Us
                </a>
              </div>

              <div className="mt-6 text-primary-100 text-sm">
                <p className="font-semibold">📍 Location:</p>
                <p>11140 Rockville Pike, Rockville, MD 20852</p>
              </div>
            </div>

            {/* Right Column - Flyer Image */}
            <div className="flex justify-center">
              <div className="bg-white rounded-lg shadow-2xl p-2 max-w-sm">
                <img
                  src="/images/carewithluvs-flyer.png"
                  alt="CAREWITHLUVS LLC - Your Mobile Phlebotomy Agency"
                  className="w-full h-auto rounded"
                  onError={(e) => {
                    // Fallback if image doesn't load - hide the container
                    const target = e.target as HTMLImageElement;
                    const container = target.closest('div.bg-white');
                    if (container) container.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Services</h2>

          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Carewithluvs LLC is a Maryland-based mobile healthcare service offering phlebotomy services, breath alcohol testing, nail and hair drug testing, DOT and NON-DOT specimen collection, immigration DNA testing, and early gender reveal DNA testing.
            We provide flexible scheduling, including <strong>evenings and weekends</strong>, to meet client needs quickly and efficiently.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🩸</span>
                Mobile Phlebotomy Services
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Professional blood draw at your location</li>
                <li>• Lab specimen collection</li>
                <li>• Flexible scheduling available</li>
              </ul>
            </div>

            <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🧪</span>
                Drug & Alcohol Testing
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>• DOT and NON-DOT specimen collection</li>
                <li>• Breath alcohol testing</li>
                <li>• Nail and hair drug testing</li>
              </ul>
            </div>

            <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🧬</span>
                DNA Testing Services
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Immigration DNA testing</li>
                <li>• Early gender reveal DNA testing</li>
                <li>• Professional specimen collection</li>
              </ul>
            </div>

            <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">⏰</span>
                Flexible Availability
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Evening appointments available</li>
                <li>• Weekend scheduling</li>
                <li>• Quick turnaround times</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose CAREWITHLUVS LLC?</h2>

          <div className="space-y-4">
            <div className="flex items-start bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Competitive Pricing</h3>
                <p className="text-gray-600">Often lower than traditional facilities while maintaining high-quality, compliant services.</p>
              </div>
            </div>

            <div className="flex items-start bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Professional & Confidential</h3>
                <p className="text-gray-600">Committed to professionalism, confidentiality, and reliable service delivery for all clients.</p>
              </div>
            </div>

            <div className="flex items-start bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Flexible Scheduling</h3>
                <p className="text-gray-600">Evening and weekend appointments available to accommodate your busy schedule.</p>
              </div>
            </div>

            <div className="flex items-start bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">DOT Compliant</h3>
                <p className="text-gray-600">Fully compliant DOT and NON-DOT specimen collection for businesses and individuals.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Schedule Your Service?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Contact CAREWITHLUVS LLC today to discuss your mobile healthcare needs and explore partnership opportunities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:2405750041"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg text-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call (240) 575-0041
            </a>
            <a
              href="mailto:carewithluvshealth@gmail.com"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-800 text-white rounded-lg font-semibold hover:bg-primary-900 transition-colors border-2 border-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Us
            </a>
          </div>
        </div>
      </div>

      {/* Service Area */}
      <div className="py-12 bg-white border-t">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Serving Maryland</h3>
          <p className="text-gray-600 mb-4">
            Professional mobile healthcare services throughout the Maryland area
          </p>
          <Link
            href="/search?q=Maryland"
            className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
          >
            View all mobile phlebotomy providers in Maryland →
          </Link>
        </div>
      </div>

      {/* Footer Note */}
      <div className="py-8 bg-gray-100 border-t">
        <div className="container mx-auto px-4 max-w-4xl text-center text-sm text-gray-600">
          <p className="mb-2">
            <strong>CAREWITHLUVS LLC</strong> is a Founding Partner premium provider on MobilePhlebotomy.org
          </p>
          <p>
            Looking for mobile phlebotomy services in your area?
            <Link href="/search" className="text-primary-600 hover:underline ml-1">
              Search our directory
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
