import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'For Draw Networks & Labs — Find Mobile Phlebotomists by Geography',
  description: 'Need mobile phlebotomists in specific markets? MobilePhlebotomy.org connects draw networks, laboratories, and healthcare organizations with verified phlebotomists in 40+ states.',
  keywords: 'mobile phlebotomy network, draw network phlebotomists, find phlebotomists by geography, lab phlebotomy staffing, mobile phlebotomy coverage, phlebotomy partner network',
  openGraph: {
    title: 'For Draw Networks & Labs — Find Mobile Phlebotomists by Geography',
    description: 'Connect with verified mobile phlebotomists in 40+ states. Custom coverage, quality-checked providers, one integration.',
    type: 'website',
  }
}

export default function ForNetworksPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'MobilePhlebotomy.org Draw Network Partnership',
    description: 'Connect draw networks, laboratories, and healthcare organizations with verified mobile phlebotomists nationwide.',
    provider: {
      '@type': 'Organization',
      name: 'MobilePhlebotomy.org',
      url: 'https://www.mobilephlebotomy.org',
    },
    areaServed: { '@type': 'Country', name: 'United States' },
    serviceType: 'Mobile Phlebotomy Network',
  }

  const stats = [
    { num: '500+', label: 'Verified Providers' },
    { num: '40+', label: 'States Covered' },
    { num: '100+', label: 'Metro Areas' },
    { num: '24hrs', label: 'Avg. Response Time' },
  ]

  const useCases = [
    {
      title: 'Draw Networks',
      desc: 'Expand your geographic coverage without recruiting, credentialing, or managing individual phlebotomists. We provide verified providers in markets where you need coverage — on demand or on contract.',
    },
    {
      title: 'Reference Laboratories',
      desc: 'Need specimen collection in new markets? We connect you with local mobile phlebotomists who can collect, handle, and transport specimens to your designated drop-off points or courier services.',
    },
    {
      title: 'Home Health Agencies',
      desc: 'Your patients need blood work but your nurses are focused on clinical care. Our phlebotomists handle the draws so your team can focus on what they do best.',
    },
    {
      title: 'Insurance & Wellness Companies',
      desc: 'Running paramedical exams, biometric screenings, or wellness programs? We provide phlebotomists across the country who can meet your members wherever they are.',
    },
    {
      title: 'Clinical Trial Organizations',
      desc: 'Decentralized trials need local phlebotomists who follow protocol. We connect you with experienced providers in the geographies where your trial participants are located.',
    },
    {
      title: 'Telehealth Platforms',
      desc: 'Your physicians order blood work remotely — we fulfill the draw locally. Integrate mobile phlebotomy into your telehealth offering to provide a complete patient experience.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* Hero */}
      <section className="bg-gray-900 text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-sm text-gray-400 uppercase tracking-wide mb-4">For Draw Networks, Labs & Healthcare Organizations</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Mobile Phlebotomists<br />Where You Need Them
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Need coverage in specific geographies? We connect you with verified mobile phlebotomists in 40+ states. One partnership, nationwide reach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hector@mobilephlebotomy.org?subject=Draw Network Partnership Inquiry"
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              Contact Us to Partner
            </a>
            <Link
              href="/resources"
              className="inline-block bg-white/10 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              View Resources
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-bold text-primary-600">{s.num}</p>
                <p className="text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Tell Us Your Markets</h3>
              <p className="text-gray-600">Share the ZIP codes, cities, or states where you need mobile phlebotomy coverage.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">We Match Providers</h3>
              <p className="text-gray-600">We identify verified providers in your target geographies with the credentials and capacity you need.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Patients Get Served</h3>
              <p className="text-gray-600">Your patients get professional, in-home blood draws from local phlebotomists you can trust.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Who We Work With</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <div key={uc.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-lg mb-3">{uc.title}</h3>
                <p className="text-gray-600 leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Partner */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Why Partner With Us</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                <span className="text-green-600 font-bold">+</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Verified Providers</h3>
                <p className="text-gray-600">Every provider in our network is credentialed, insured, and reviewed. We don&apos;t list anyone who hasn&apos;t been vetted.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                <span className="text-green-600 font-bold">+</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Geographic Flexibility</h3>
                <p className="text-gray-600">Need 3 phlebotomists in rural Arkansas and 20 in metro Houston? We can match both. Our network covers urban, suburban, and rural markets.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                <span className="text-green-600 font-bold">+</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">No Recruitment Overhead</h3>
                <p className="text-gray-600">Skip the job postings, interviews, and credentialing. We&apos;ve already done it. You get a ready-to-deploy network.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                <span className="text-green-600 font-bold">+</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Scale When You Need To</h3>
                <p className="text-gray-600">Launching a new market? Running a seasonal wellness campaign? We can spin up coverage in new geographies within days, not months.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Let&apos;s Talk Coverage</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
            Tell us where you need mobile phlebotomists and we&apos;ll show you who we have. No commitment, no pressure — just a conversation about coverage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hector@mobilephlebotomy.org?subject=Draw Network Partnership Inquiry&body=Hi Hector,%0D%0A%0D%0AI'm interested in discussing mobile phlebotomy coverage for our organization.%0D%0A%0D%0AOrganization:%0D%0AMarkets needed:%0D%0AEstimated volume:%0D%0A%0D%0APlease let me know a good time to connect."
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              Email Us: hector@mobilephlebotomy.org
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            Or call directly: We typically respond within 24 hours.
          </p>
        </div>
      </section>
    </div>
  )
}
