import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How to Get Patients as a Mobile Phlebotomist — 7 Proven Methods (2026)',
  description: 'Get more mobile phlebotomy patients with these 7 proven strategies: Google Business Profile, physician partnerships, online directories, social media, and more. Real tactics from working phlebotomists.',
  keywords: 'how to get patients mobile phlebotomy, mobile phlebotomy marketing, get clients phlebotomy business, mobile phlebotomy advertising, grow phlebotomy business, mobile phlebotomist patients',
  openGraph: {
    title: 'How to Get Patients as a Mobile Phlebotomist — 7 Proven Methods',
    description: '7 proven strategies to get consistent patients for your mobile phlebotomy business. Real tactics, not theory.',
    type: 'article',
  }
}

export default function GetPatientsPage() {
  const today = new Date().toISOString().split('T')[0]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How to Get Patients as a Mobile Phlebotomist — 7 Proven Methods',
    description: 'Proven strategies for mobile phlebotomists to get consistent patient referrals and grow their business.',
    author: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    publisher: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    datePublished: '2025-06-01',
    dateModified: today,
    mainEntityOfPage: 'https://www.mobilephlebotomy.org/how-to-get-patients-as-a-mobile-phlebotomist'
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do mobile phlebotomists find patients?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mobile phlebotomists find patients through a combination of physician office partnerships, Google Business Profile optimization, online directories like MobilePhlebotomy.org, social media marketing, nursing home contracts, and word-of-mouth referrals. The most successful phlebotomists use 3-4 channels simultaneously rather than relying on one source.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is the best way to market a mobile phlebotomy business?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The most effective marketing for mobile phlebotomy is building relationships with physician offices and home health agencies that need draws done. Digital marketing through Google Business Profile and directories provides a steady stream of direct-to-patient requests. Cold calling doctor offices with a one-page leave-behind is still the single most effective tactic for new businesses.'
        }
      },
      {
        '@type': 'Question',
        name: 'How long does it take to build a mobile phlebotomy client base?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most mobile phlebotomists report getting their first consistent patients within 2-4 weeks of active outreach. Building a full schedule typically takes 3-6 months. The key is starting with physician office partnerships (which provide volume) while building your direct-to-patient pipeline through online presence.'
        }
      },
      {
        '@type': 'Question',
        name: 'Should I focus on private-pay patients or lab contracts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Both. Lab contracts provide steady volume and consistent income (typically $15-35 per draw), while private-pay patients pay more per draw ($60-150) but are less predictable. The ideal mix is lab contracts for your baseline income and private-pay patients for higher-margin work. Start with whichever you can land first.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need a website to get mobile phlebotomy patients?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A website helps but is not required to start. Your Google Business Profile is more important for local search visibility. Listing on directories like MobilePhlebotomy.org gives you immediate online presence without building a website. That said, a simple one-page website with your services, area, and contact info adds credibility and costs under $20/month.'
        }
      }
    ]
  }

  const methods = [
    {
      num: '1',
      title: 'Partner with Physician Offices',
      content: 'This is the #1 source of patients for most mobile phlebotomists. Visit doctor offices in your area with a one-page sheet explaining your services, turnaround time, and pricing. Offices that order blood work but don\'t have an in-house phlebotomist will send you patients every week. Start with family medicine, internal medicine, and geriatric practices — they order the most draws.',
      tip: 'Bring donuts on your first visit. Seriously. You\'re competing with established labs, and the office staff decides who gets recommended. Be the friendly, reliable person they think of first.'
    },
    {
      num: '2',
      title: 'Optimize Your Google Business Profile',
      content: 'When someone searches "mobile phlebotomy near me," Google shows the local map pack first. Your Google Business Profile (formerly Google My Business) is what appears there. Claim your profile, add photos of your kit and vehicle, list all your services, and ask every patient for a review. More reviews = higher ranking = more calls.',
      tip: 'Add your service area as a list of cities you cover, not just your home address. Set your category to "Phlebotomy Service" or "Medical Laboratory." Post weekly updates — Google rewards active profiles.'
    },
    {
      num: '3',
      title: 'Get Listed on Mobile Phlebotomy Directories',
      content: 'Directories like MobilePhlebotomy.org rank on the first page of Google for high-intent searches. When a patient finds your listing, they\'re already looking for exactly what you offer. Most directories are free to list on and send you the patient\'s contact information directly so you can call and book them.',
    },
    {
      num: '4',
      title: 'Build Nursing Home & Assisted Living Relationships',
      content: 'Skilled nursing facilities, assisted living communities, and memory care homes need regular blood draws for their residents. One facility contract can mean 5-20 draws per week on a predictable schedule. Approach the Director of Nursing with your credentials, insurance, and pricing. Offer a trial week at a reduced rate to prove your reliability.',
      tip: 'Facilities care most about reliability, not price. Show up on time every time and you\'ll keep the contract. The phlebotomist who doesn\'t show up is the one you\'re replacing.'
    },
    {
      num: '5',
      title: 'Connect with Home Health Agencies',
      content: 'Home health agencies serve homebound patients who need regular lab work but can\'t get to a lab. These agencies need phlebotomists they can dispatch. Contact every home health agency in your area and offer your services. They typically pay per draw ($15-30) and can send you multiple patients per day in the same geographic area.',
    },
    {
      num: '6',
      title: 'Use Social Media (Correctly)',
      content: 'Facebook and Instagram work for mobile phlebotomy, but not the way you might think. Don\'t post stock photos of needles — that scares people. Instead, share your story: why you started, the convenience you provide, patient testimonials (with permission), and health tips related to blood work. Join local community Facebook groups and offer your services when someone asks about lab work.',
      tip: 'The single best social media post for a mobile phlebotomist: "I come to YOUR home for blood draws so you don\'t have to wait at the lab. [Your city] and surrounding areas. Call/text [number]." Pin it to your profile.'
    },
    {
      num: '7',
      title: 'Ask for Referrals (Every Time)',
      content: 'After every successful draw, ask: "Do you know anyone else who could use this service?" Happy patients refer friends, family members, and neighbors. Elderly patients in particular tend to know other elderly patients who are also homebound. One patient can easily turn into three. Leave a few business cards and ask them to share.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero Answer Block */}
      <section className="bg-primary-700 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-sm text-primary-200 mb-2">Last updated: March 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            How to Get Patients as a Mobile Phlebotomist
          </h1>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
            <p className="text-lg leading-relaxed">
              The fastest way to get mobile phlebotomy patients is to <strong>partner with physician offices</strong> that order blood work but don&apos;t have in-house phlebotomists. Combine that with a <strong>Google Business Profile</strong>, a listing on <strong>directories like MobilePhlebotomy.org</strong>, and nursing home relationships — and most phlebotomists fill their schedule within 3-6 months.
            </p>
          </div>
        </div>
      </section>

      <article className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">

          {methods.map((method) => (
            <div key={method.num} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {method.num}. {method.title}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">{method.content}</p>
              {method.tip && (
                <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-lg">
                  <p className="text-primary-900"><strong>Pro tip:</strong> {method.tip}</p>
                </div>
              )}
            </div>
          ))}

          <h2 className="text-2xl font-bold text-gray-900 mb-4">What NOT to Do</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
            <li><strong>Don&apos;t wait for patients to find you.</strong> You have to do outreach, especially in the first 6 months.</li>
            <li><strong>Don&apos;t spend $500/month on Google Ads</strong> before you&apos;ve exhausted free channels like directories and Google Business Profile.</li>
            <li><strong>Don&apos;t undercut on price.</strong> Charging $40 when the market rate is $100 doesn&apos;t get you more patients — it gets you unsustainable ones.</li>
            <li><strong>Don&apos;t ignore your online reviews.</strong> A mobile phlebotomist with 20 five-star reviews will get 10x more calls than one with zero.</li>
          </ul>

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
              <li><Link href="/best-website-builders-mobile-phlebotomy" className="text-primary-600 hover:underline">Best Website Builders for Mobile Phlebotomy →</Link></li>
              <li><Link href="/can-mobile-phlebotomists-bill-medicare" className="text-primary-600 hover:underline">Can Mobile Phlebotomists Bill Medicare? →</Link></li>
            </ul>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get Patients Sent to You — Free</h2>
            <p className="text-gray-600 mb-6">List your business on MobilePhlebotomy.org and start receiving patient referrals. No fees, no commission — we send you the patient&apos;s contact info and you book the appointment.</p>
            <Link href="/add-provider" className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors">
              Get Listed Free
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
