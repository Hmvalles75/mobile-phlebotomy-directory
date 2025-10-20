import Link from 'next/link'
import { AutocompleteSearchBar } from '@/components/ui/AutocompleteSearchBar'

export default function MobilePhlebotomistPage() {
  const topStates = [
    { name: 'California', slug: 'california' },
    { name: 'Texas', slug: 'texas' },
    { name: 'Florida', slug: 'florida' },
    { name: 'New York', slug: 'new-york' },
    { name: 'Pennsylvania', slug: 'pennsylvania' },
    { name: 'Illinois', slug: 'illinois' },
    { name: 'Ohio', slug: 'ohio' },
    { name: 'Georgia', slug: 'georgia' },
    { name: 'North Carolina', slug: 'north-carolina' },
    { name: 'Michigan', slug: 'michigan' }
  ]

  const topMetros = [
    { name: 'Los Angeles', slug: 'los-angeles-metro' },
    { name: 'New York City', slug: 'new-york-metro' },
    { name: 'Chicago', slug: 'chicago-metro' },
    { name: 'Houston', slug: 'houston-metro' },
    { name: 'Phoenix', slug: 'phoenix-metro' },
    { name: 'Philadelphia', slug: 'philadelphia-metro' },
    { name: 'San Antonio', slug: 'san-antonio-metro' },
    { name: 'San Diego', slug: 'san-diego-metro' }
  ]

  return (
    <>
      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero-bg.jpg')"
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        <div className="relative container py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Mobile Phlebotomist Services
            </h1>
            <p className="text-xl text-gray-100 mb-8 max-w-3xl mx-auto">
              Find certified mobile phlebotomists who come to your home, office, or preferred location.
              Professional at-home blood draw services available 7 days a week across the United States.
            </p>

            <AutocompleteSearchBar
              placeholder="Enter your ZIP code or city to find mobile phlebotomists..."
              className="mb-6"
              enableZipCodeRouting={true}
            />

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Licensed & Certified
              </span>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ HIPAA Compliant
              </span>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Insured Providers
              </span>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Same-Day Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What is a Mobile Phlebotomist?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              A mobile phlebotomist is a certified healthcare professional who travels to your location to perform
              blood draws and collect laboratory specimens. Unlike traditional phlebotomy services that require you
              to visit a hospital, clinic, or lab, mobile phlebotomy brings these essential services directly to your
              home, office, or any location convenient for you. This service is ideal for patients with mobility issues,
              busy professionals, elderly individuals, and anyone who values the convenience of at-home blood test services.
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              Mobile phlebotomists are trained and certified professionals who maintain the same rigorous standards as
              hospital-based phlebotomists. They arrive equipped with all necessary supplies, including sterile needles,
              collection tubes, and proper transport containers to ensure your samples reach the laboratory safely.
              Whether you need routine blood work, diagnostic testing, or specialized lab collections, a mobile blood draw
              service can accommodate most standard laboratory procedures in the comfort of your own home.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              The mobile phlebotomy industry has grown significantly in recent years, driven by increased demand for
              convenient healthcare services and the recognition that at-home blood draws can improve patient compliance
              with medical testing. Many mobile phlebotomy services accept insurance including Medicare and Medicaid,
              making professional at-home blood collection accessible and affordable for most patients.
            </p>
          </div>

          {/* CTA Button */}
          <div className="text-center mb-12">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Find a Mobile Phlebotomist Near You
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Benefits of Mobile Phlebotomy Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover why thousands of patients choose mobile blood draw services for their laboratory testing needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Ultimate Convenience
              </h3>
              <p className="text-gray-600">
                No need to travel to a lab or wait in crowded waiting rooms. Get your blood drawn at home, work,
                or anywhere that&apos;s convenient for you.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⏰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Flexible Scheduling
              </h3>
              <p className="text-gray-600">
                Choose appointment times that work with your schedule, including early mornings, evenings,
                and weekends. Many providers offer same-day service.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">👴</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Ideal for Special Needs
              </h3>
              <p className="text-gray-600">
                Perfect for elderly patients, those with mobility issues, chronic conditions, or anyone who
                prefers the comfort and privacy of their own environment.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Reduced Exposure
              </h3>
              <p className="text-gray-600">
                Minimize exposure to germs and illnesses by avoiding busy medical facilities. Particularly
                important for immunocompromised individuals.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Cost-Effective
              </h3>
              <p className="text-gray-600">
                Most insurance plans cover mobile phlebotomy when medically necessary. Save on transportation
                costs and time off work.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Professional & Certified
              </h3>
              <p className="text-gray-600">
                All mobile phlebotomists are licensed, certified, and insured professionals who follow
                strict safety and quality standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Mobile Phlebotomy Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting your blood drawn at home is simple and convenient. Here&apos;s how it works:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Search & Select
              </h3>
              <p className="text-gray-600">
                Browse certified mobile phlebotomists in your area. Compare services, prices,
                availability, and patient reviews.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Schedule Appointment
              </h3>
              <p className="text-gray-600">
                Contact your chosen provider to schedule an appointment. Provide your doctor&apos;s orders
                and preferred time.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                At-Home Visit
              </h3>
              <p className="text-gray-600">
                The phlebotomist arrives at your location with all necessary equipment and safely
                collects your blood samples.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Get Results
              </h3>
              <p className="text-gray-600">
                Samples are delivered to the lab for testing. Results are typically sent to your
                doctor within 24-48 hours.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg"
            >
              Get Started Now
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Browse by State Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Find Mobile Phlebotomists by State
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse certified mobile phlebotomy services in top states across the United States
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {topStates.map((state) => (
              <Link
                key={state.slug}
                href={`/us/${state.slug}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition-all text-center group"
              >
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary-600">
                  {state.name}
                </h3>
                <span className="text-xs text-primary-600 group-hover:underline">
                  View Providers →
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/search"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Browse All 50 States + DC →
            </Link>
          </div>
        </div>
      </section>

      {/* Top Metro Areas Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Mobile Phlebotomy in Top Metro Areas
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find at-home blood draw services in major metropolitan areas nationwide
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {topMetros.map((metro) => (
              <Link
                key={metro.slug}
                href={`/us/metro/${metro.slug}`}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition-all group"
              >
                <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-primary-600">
                  {metro.name}
                </h3>
                <span className="text-xs text-primary-600 group-hover:underline">
                  Find Providers →
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/metros"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              View All Metro Areas
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Additional Resources Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Mobile Phlebotomy Resources
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Learn more about mobile blood draw services and at-home lab collection
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/at-home-blood-draw-services"
              className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md hover:border-primary-300 transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                At-Home Blood Draw Services
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Complete guide to at-home blood collection services, what to expect, and how to prepare
              </p>
              <span className="text-primary-600 text-sm font-medium">
                Learn More →
              </span>
            </Link>

            <Link
              href="/mobile-phlebotomy-cost"
              className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md hover:border-primary-300 transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mobile Phlebotomy Cost
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Pricing information, insurance coverage, and what affects the cost of mobile blood draws
              </p>
              <span className="text-primary-600 text-sm font-medium">
                Learn More →
              </span>
            </Link>

            <Link
              href="/mobile-phlebotomy-insurance-coverage"
              className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md hover:border-primary-300 transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Insurance Coverage
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Understanding insurance coverage for mobile phlebotomy including Medicare and Medicaid
              </p>
              <span className="text-primary-600 text-sm font-medium">
                Learn More →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Find Your Mobile Phlebotomist?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Browse our directory of certified mobile phlebotomy providers. Compare services,
            read reviews, and schedule your at-home blood draw today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/search"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg"
            >
              Search Providers
            </Link>
            <Link
              href="/add-provider"
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg"
            >
              Add Your Business
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
