import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Best Website Builders for Mobile Phlebotomy Businesses (2026)',
  description: 'Compare the best website builders for mobile phlebotomists: Wix, Squarespace, GoDaddy, and WordPress. What to include on your site, SEO basics, and which platform gives the best value.',
  keywords: 'best website builder mobile phlebotomy, phlebotomy business website, mobile phlebotomist website, phlebotomy website template, how to build phlebotomy website',
  openGraph: {
    title: 'Best Website Builders for Mobile Phlebotomy Businesses (2026)',
    description: 'Compare website builders for phlebotomy businesses. What to include, SEO basics, and which platform is worth the money.',
    type: 'article',
  }
}

export default function WebsiteBuildersPage() {
  const today = new Date().toISOString().split('T')[0]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Best Website Builders for Mobile Phlebotomy Businesses',
    description: 'Compare website builders for mobile phlebotomists including Wix, Squarespace, GoDaddy, and WordPress.',
    author: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    publisher: { '@type': 'Organization', name: 'MobilePhlebotomy.org', url: 'https://www.mobilephlebotomy.org' },
    datePublished: '2025-06-01',
    dateModified: today,
    mainEntityOfPage: 'https://www.mobilephlebotomy.org/best-website-builders-mobile-phlebotomy'
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do I need a website for my mobile phlebotomy business?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A website is not required to start getting patients, but it significantly boosts credibility and SEO visibility. Your Google Business Profile is more important initially. However, a simple one-page website with your services, service area, and contact info costs under $20/month and helps you appear in local search results. Listing on directories like MobilePhlebotomy.org can provide immediate online presence while you build your own site.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is the best website builder for a phlebotomy business?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For most mobile phlebotomists, Wix or Squarespace offers the best balance of ease of use, professional design, and price. Wix is the easiest to learn with drag-and-drop editing and a free tier. Squarespace has the best-looking templates. GoDaddy Website Builder is the cheapest option. WordPress.org offers the most flexibility but requires more technical skill.'
        }
      },
      {
        '@type': 'Question',
        name: 'What should a mobile phlebotomy website include?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'At minimum: your business name and logo, services offered (blood draws, specimen collection, etc.), service area with specific cities listed, your phone number and email prominently displayed, hours of availability, credentials and certifications, a brief bio or about section, and a call-to-action button for booking. Optional but helpful: patient testimonials, pricing, insurance information, and an online booking system.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much does a mobile phlebotomy website cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A basic website costs $0-30 per month depending on the platform. Wix has a free tier (with Wix branding). Paid plans run $14-23/month and remove the branding and include a custom domain. Squarespace costs $16-23/month. GoDaddy Website Builder starts at $10/month. A custom domain name (.com) costs $10-15 per year. You do not need to hire a web designer — all modern builders are drag-and-drop.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I make my phlebotomy website show up on Google?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Three things matter most: First, claim and optimize your Google Business Profile and link it to your website. Second, include your city and state name on every page (e.g., "Mobile Phlebotomy in Dallas, TX"). Third, get listed on directories like MobilePhlebotomy.org, Yelp, and the Better Business Bureau — these backlinks tell Google your business is legitimate. Consistent NAP (Name, Address, Phone) across all listings is critical.'
        }
      }
    ]
  }

  const platforms = [
    {
      name: 'Wix',
      price: 'Free – $23/mo',
      ease: 'Easiest',
      bestFor: 'Beginners who want to get online fast',
      pros: ['Free tier available', 'Drag-and-drop editor', 'Lots of templates', 'Built-in booking'],
      cons: ['Free tier shows Wix branding', 'Can feel cluttered with options'],
    },
    {
      name: 'Squarespace',
      price: '$16 – $23/mo',
      ease: 'Easy',
      bestFor: 'Best-looking sites without design skills',
      pros: ['Beautiful templates', 'Clean, professional look', 'Built-in analytics', 'Good mobile design'],
      cons: ['No free tier', 'Less flexible than Wix', 'Slightly higher learning curve'],
    },
    {
      name: 'GoDaddy Website Builder',
      price: '$10 – $15/mo',
      ease: 'Easiest',
      bestFor: 'Cheapest option for a basic site',
      pros: ['Cheapest paid option', 'Very simple setup', 'Includes domain', 'AI-assisted builder'],
      cons: ['Limited design options', 'Basic templates', 'Less SEO control'],
    },
    {
      name: 'WordPress.org',
      price: '$5 – $30/mo (hosting)',
      ease: 'Moderate',
      bestFor: 'Maximum flexibility and SEO control',
      pros: ['Most SEO-friendly', 'Thousands of plugins', 'Full customization', 'You own everything'],
      cons: ['Steeper learning curve', 'Need to find hosting separately', 'Plugin management required'],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="bg-primary-700 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-sm text-primary-200 mb-2">Last updated: March 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Best Website Builders for Mobile Phlebotomy Businesses
          </h1>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
            <p className="text-lg leading-relaxed">
              The best website builder for most mobile phlebotomists is <strong>Wix</strong> (free tier available, easiest to use) or <strong>Squarespace</strong> (best-looking templates, $16/mo). You don&apos;t need a fancy site — a clean one-page site with your services, service area, phone number, and a booking button is all it takes to look professional and rank on Google.
            </p>
          </div>
        </div>
      </section>

      <article className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Comparison</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {platforms.map((p) => (
              <div key={p.name} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                  <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">{p.price}</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Ease of use: <strong>{p.ease}</strong></p>
                <p className="text-primary-600 font-medium mb-4">{p.bestFor}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase mb-2">Pros</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {p.pros.map((pro, i) => <li key={i}>+ {pro}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase mb-2">Cons</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {p.cons.map((con, i) => <li key={i}>- {con}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Your Website Must Include</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Don&apos;t overthink this. Your site needs these elements — nothing more to start:
          </p>
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <ol className="space-y-3 text-gray-700">
              <li><strong>1. Your business name and logo</strong> — even a simple text logo works</li>
              <li><strong>2. Services you offer</strong> — blood draws, specimen collection, drug testing, etc.</li>
              <li><strong>3. Service area</strong> — list every city you cover by name (this helps Google SEO)</li>
              <li><strong>4. Phone number</strong> — big, visible, clickable on mobile</li>
              <li><strong>5. Hours of availability</strong> — including if you offer weekends or early mornings</li>
              <li><strong>6. About section</strong> — your credentials, certifications, years of experience</li>
              <li><strong>7. Call-to-action</strong> — "Call Now" or "Book Appointment" button</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick SEO Wins for Your Site</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            You don&apos;t need to be an SEO expert. These five things will get you 80% of the way there:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-3 mb-8">
            <li><strong>Page title:</strong> &ldquo;Mobile Phlebotomy in [Your City], [State] | [Business Name]&rdquo;</li>
            <li><strong>Include your city name</strong> in your page headings and body text naturally</li>
            <li><strong>Claim your Google Business Profile</strong> and link it to your website</li>
            <li><strong>Get listed on directories</strong> — <Link href="/add-provider" className="text-primary-600 underline">MobilePhlebotomy.org</Link>, Yelp, BBB, and your state phlebotomy association</li>
            <li><strong>Keep your NAP consistent</strong> — your Name, Address, and Phone number should be identical across all listings</li>
          </ul>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-yellow-800 mb-2">Before You Build: Get Listed First</h3>
            <p className="text-yellow-800">
              While building your own website is valuable long-term, you can get online presence <strong>today</strong> by listing on <Link href="/add-provider" className="text-yellow-900 underline font-semibold">MobilePhlebotomy.org</Link>. Your listing goes live immediately and appears in Google search results. Many phlebotomists get their first online patients through directories before their own website even ranks.
            </p>
          </div>

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
              <li><Link href="/how-to-get-patients-as-a-mobile-phlebotomist" className="text-primary-600 hover:underline">How to Get Patients as a Mobile Phlebotomist →</Link></li>
              <li><Link href="/mobile-phlebotomy-1099-contractor" className="text-primary-600 hover:underline">Mobile Phlebotomy as a 1099 Contractor →</Link></li>
              <li><Link href="/how-to-get-contracts-mobile-phlebotomy" className="text-primary-600 hover:underline">How to Get Contracts for Mobile Phlebotomy →</Link></li>
            </ul>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Skip the Website — Get Patients Now</h2>
            <p className="text-gray-600 mb-6">List your business on MobilePhlebotomy.org for free and start getting patient referrals today. No website required — we handle the online presence, you handle the draws.</p>
            <Link href="/add-provider" className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors">
              Get Listed Free
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
