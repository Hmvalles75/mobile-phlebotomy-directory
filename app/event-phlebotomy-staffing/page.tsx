import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo'
import { EventStaffingForm } from './EventStaffingForm'

/**
 * /event-phlebotomy-staffing
 *
 * One page that answers, in plain language, exactly what an event buyer asks
 * in their first email: do you staff events, how is it priced, what is the
 * minimum, how many phlebotomists, COI, supplies and disposal, and what the
 * client provides. Written to be quotable by a search engine or an AI
 * assistant: short declarative sentences, one question per heading, real
 * numbers.
 *
 * Why it exists: 21 patient requests arrived from ChatGPT referrals before
 * this page did, including two institutional ones, with nothing on the site
 * that said "event phlebotomy staffing" in a citeable way. See
 * docs/findings/lead-diagnostic-2026-09-04.md and lib/institutionalIntake.ts.
 *
 * Pricing figures come from PRICING-RATE-CARD.md ("Quote this").
 */

const TITLE = 'Event Phlebotomy Staffing: On-Site Blood Draws for 20 to 500 People'
const DESCRIPTION = 'Certified phlebotomists for wellness events, biometric screenings, research days and corporate health fairs, nationwide. Priced per phlebotomist per block with a 4-hour minimum. COI, supplies and disposal included. Written proposal within one business day.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'event phlebotomy staffing, on-site blood draw event, mobile phlebotomist for event, biometric screening phlebotomist, corporate health fair blood draw, wellness event blood testing, hire phlebotomists for event, phlebotomy staffing agency',
  alternates: { canonical: `${SITE_URL}/event-phlebotomy-staffing` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: `${SITE_URL}/event-phlebotomy-staffing`,
  },
}

const faqs = [
  {
    q: 'Do you provide phlebotomists for events?',
    a: 'Yes. We staff on-site blood draws for one-day and multi-day events anywhere in the United States: employee wellness days, biometric screenings, longevity and wellness brand events, research recruitment days, health fairs, and clinic overflow. We coordinate the crew from our network of certified mobile phlebotomists, so you deal with one company, one proposal, and one invoice.',
  },
  {
    q: 'How is event phlebotomy staffing priced?',
    a: 'Per phlebotomist, per block of time, not per draw. A full day is $700 to $850 per phlebotomist depending on metro and specimen handling; half-day blocks are available. Travel inside the metro is included. You receive a flat written total before the event, and the number does not change if fewer people show up than planned.',
  },
  {
    q: 'What is the minimum booking?',
    a: 'Four hours per phlebotomist. A four-hour block is enough for most events of 50 to 60 attendees with two to three phlebotomists. There is no minimum number of draws.',
  },
  {
    q: 'How many phlebotomists do I need?',
    a: 'Plan on about 12 to 15 draws per phlebotomist per hour when kits are prepared in advance and attendees arrive in waves. For roughly 50 attendees over a three to four hour window, that is two to three phlebotomists. For 100 to 150, plan on four to five. We recommend the count in the proposal based on your headcount and hours, and we always include a small buffer for no-shows and late arrivals in the schedule rather than the invoice.',
  },
  {
    q: 'Can you provide a certificate of insurance?',
    a: 'Yes. A certificate of insurance covering general and professional liability is provided before the event, and it can name your company or the venue as additional insured if they require it. Tell us on the request form and it is included with the proposal.',
  },
  {
    q: 'Who provides supplies and handles biohazard disposal?',
    a: 'We do. Standard draw supplies come with the crew: needles, tube holders, tourniquets, alcohol prep, gauze, bandages, gloves, and sharps containers. Biohazard waste and sharps are removed and disposed of by us at the end of the event. Nothing is left at your venue.',
  },
  {
    q: 'What do we provide as the client?',
    a: 'Three things. The collection kits and lab processing, if you are using your own lab, which is the usual arrangement for wellness brands and research programs; if you need us to arrange the lab as well, say so and we will quote it. A private or semi-private space with a table, two chairs per station, and access to power and hand sanitizer. And a point of contact on the day who can direct attendees and answer badge or parking questions.',
  },
  {
    q: 'How far in advance should we book?',
    a: 'Two weeks is comfortable for a crew of two to three in a major metro. We have staffed events on five days notice. If your date is inside the next ten days, say so in the request and it moves to the front.',
  },
  {
    q: 'Which cities do you cover?',
    a: 'All fifty states through our provider network, with the deepest bench in California, Florida, New York, Texas, the Mid-Atlantic and the Great Lakes metros. For an event outside a major metro we confirm crew availability before we send a proposal, so you never receive a quote we cannot staff.',
  },
]

const steps = [
  { n: '1', title: 'Send the request', text: 'Five questions: date, hours, headcount, who supplies the kits, and whether you need a COI. Two minutes.' },
  { n: '2', title: 'Written proposal within one business day', text: 'Crew size, a flat total, what we bring and what you provide, and the COI if you asked for it. No calls unless you want one.' },
  { n: '3', title: 'Confirm and prepare', text: 'You approve in writing. We assign the crew, share a short run-of-show, and confirm the lab and kit logistics with you a few days before.' },
  { n: '4', title: 'Event day', text: 'The crew arrives 30 minutes early, sets up stations, draws, labels, packs specimens to your protocol, and clears all sharps and biohazard waste before leaving.' },
]

const useCases = [
  'Employee wellness days and biometric screenings',
  'Longevity, wellness and supplement brand events',
  'Research and clinical study recruitment days',
  'Corporate health fairs and benefits enrollment',
  'Senior living and community center screening days',
  'Athletic teams and pre-season baseline panels',
  'Clinic and practice overflow days',
  'Multi-day conferences with on-site testing',
]

export default function EventPhlebotomyStaffingPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Event Phlebotomy Staffing',
    serviceType: 'On-site phlebotomy staffing for events',
    areaServed: { '@type': 'Country', name: 'United States' },
    provider: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: SITE_URL },
    description: DESCRIPTION,
    offers: {
      '@type': 'Offer',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceCurrency: 'USD',
        minPrice: 700,
        maxPrice: 850,
        unitText: 'per phlebotomist per day',
      },
    },
    url: `${SITE_URL}/event-phlebotomy-staffing`,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-5">Event Phlebotomy Staffing</h1>
              <p className="text-xl text-primary-100 mb-4">
                Certified phlebotomists for on-site blood draws at wellness events, screenings, research days and health fairs. Anywhere in the United States.
              </p>
              <p className="text-lg text-primary-50 mb-6">
                Priced per phlebotomist per block with a four-hour minimum. Certificate of insurance, supplies and biohazard disposal included. One written proposal within one business day.
              </p>
              <a href="#event-request" className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg">
                Request a written proposal
              </a>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <h2 className="text-xl font-bold mb-5">The short answers</h2>
              <dl className="space-y-3 text-primary-50">
                <div><dt className="font-semibold text-white">Do you staff events?</dt><dd>Yes, one-day and multi-day, nationwide.</dd></div>
                <div><dt className="font-semibold text-white">Pricing</dt><dd>$700 to $850 per phlebotomist per day. Half-day blocks available. Flat total in writing.</dd></div>
                <div><dt className="font-semibold text-white">Minimum</dt><dd>Four hours per phlebotomist. No minimum draw count.</dd></div>
                <div><dt className="font-semibold text-white">How many phlebotomists</dt><dd>Two to three for about 50 attendees over three to four hours.</dd></div>
                <div><dt className="font-semibold text-white">COI</dt><dd>Provided before the event; can name you or the venue.</dd></div>
                <div><dt className="font-semibold text-white">Supplies and disposal</dt><dd>We bring draw supplies and sharps containers and remove all biohazard waste.</dd></div>
                <div><dt className="font-semibold text-white">You provide</dt><dd>Collection kits and lab processing if using your lab, a private space with tables and chairs, and a day-of contact.</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-600">From request to cleared venue, in four steps.</p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map(s => (
              <div key={s.n} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">{s.n}</span>
                  <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                </div>
                <p className="text-gray-700">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questions, in the order clients ask them */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">What event organizers ask us first</h2>
            <p className="text-gray-600 text-center mb-8">The questions below are, word for word, what we get asked in the first email. The answers are the same ones we put in the proposal.</p>
            <div className="space-y-6">
              {faqs.map(f => (
                <div key={f.q} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{f.q}</h3>
                  <p className="text-gray-700">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Events we staff</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {useCases.map(u => (
                <div key={u} className="bg-gray-50 rounded-lg px-6 py-4 border border-gray-200 flex items-center">
                  <span className="text-primary-600 mr-3">&rarr;</span>
                  <span className="text-gray-800 font-medium">{u}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Request form */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <EventStaffingForm />
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="py-10 bg-blue-50 border-t border-blue-100">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-3">
          <p className="text-gray-700">
            Running a clinical trial or research study rather than a one-day event?{' '}
            <Link href="/clinical-trials-mobile-phlebotomy" className="text-blue-700 hover:text-blue-800 underline font-medium">See research and clinical trial coordination</Link>
          </p>
          <p className="text-gray-700">
            Recurring visits to a facility or senior living community?{' '}
            <Link href="/corporate-phlebotomy" className="text-blue-700 hover:text-blue-800 underline font-medium">See facilities and group services</Link>
          </p>
          <p className="text-gray-700">
            Need a single at-home blood draw for yourself or a family member?{' '}
            <Link href="/mobile-phlebotomy-near-me" className="text-blue-700 hover:text-blue-800 underline font-medium">Find a mobile phlebotomist near you</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
