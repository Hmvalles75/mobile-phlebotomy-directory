import Link from 'next/link'
import { topMetroAreas } from '@/data/top-metros'

export default function MetrosPage() {
  const metrosByState = topMetroAreas.reduce((acc, metro) => {
    if (!acc[metro.state]) {
      acc[metro.state] = []
    }
    acc[metro.state].push(metro)
    return acc
  }, {} as Record<string, typeof topMetroAreas>)

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Mobile Phlebotomy Services - Top 50 US Metro Areas",
    "description": "Find mobile phlebotomy services in major US cities. Professional at-home blood draws available in 50+ metropolitan areas nationwide.",
    "url": `${process.env.NEXT_PUBLIC_SITE_URL}/metros`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": topMetroAreas.length,
      "itemListElement": topMetroAreas.map((metro, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${process.env.NEXT_PUBLIC_SITE_URL}/us/metro/${metro.slug}`,
        "name": `Mobile Phlebotomy in ${metro.city}, ${metro.state}`
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">
              Mobile Phlebotomy in Top 50 US Metro Areas
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Professional at-home blood draw services available in major cities nationwide.
              Find certified mobile phlebotomists in your metropolitan area.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">📍</span>
                <span>50 metro areas covered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">🏥</span>
                <span>1,000+ certified providers</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">⏱️</span>
                <span>Same-day to 48-hour appointments</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">💳</span>
                <span>Insurance accepted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Top 10 Metro Areas */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Top 10 Metro Areas by Population
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topMetroAreas.slice(0, 10).map((metro) => (
              <Link
                key={metro.slug}
                href={`/us/metro/${metro.slug}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {metro.city}, {metro.stateAbbr}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Rank #{metro.rank} • Pop: {(metro.population / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <span className="text-primary-600 text-2xl">→</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <div>💰 {metro.localInfo?.avgCost || 'Competitive pricing'}</div>
                  <div>⏱️ {metro.localInfo?.typicalWaitTime || '24-48 hour service'}</div>
                  {metro.neighborhoods && (
                    <div>📍 {metro.neighborhoods.length}+ neighborhoods served</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Metro Areas by State */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            All Metro Areas by State
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(metrosByState)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([state, metros]) => (
                <div key={state} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {state}
                  </h3>
                  <ul className="space-y-2">
                    {metros.map((metro) => (
                      <li key={metro.slug}>
                        <Link
                          href={`/us/metro/${metro.slug}`}
                          className="text-primary-600 hover:text-primary-700 hover:underline block"
                        >
                          {metro.city}
                          <span className="text-xs text-gray-500 ml-2">
                            (#{metro.rank})
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>

        {/* SEO Content */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Mobile Phlebotomy Services Across America
          </h2>
          <div className="prose max-w-none text-gray-600 space-y-4">
            <p>
              Our network of certified mobile phlebotomists serves the top 50 metropolitan areas across the United States,
              providing convenient at-home blood draw services to millions of Americans. From major cities like New York,
              Los Angeles, and Chicago to growing metros like Austin, Denver, and Nashville, professional phlebotomy
              services are just a click away.
            </p>
            <p>
              Each metro area page provides detailed information about local providers, including average costs
              (typically ranging from $60-180), appointment availability (same-day to 48 hours), and coverage areas
              including specific neighborhoods and zip codes. Whether you need routine lab work, specialized testing,
              or corporate wellness services, our providers are licensed, insured, and HIPAA compliant.
            </p>
            <p>
              Mobile phlebotomy eliminates the need to travel to traditional labs, wait in crowded waiting rooms,
              or take time off work. Our phlebotomists come to your home, office, or preferred location, making
              healthcare more accessible and convenient for busy professionals, elderly patients, parents with
              young children, and anyone who values their time and comfort.
            </p>
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              Services Available in All Metro Areas
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Routine blood draws for lab tests</li>
              <li>Pediatric and geriatric specialized services</li>
              <li>Corporate wellness and employee health screenings</li>
              <li>Fertility and IVF testing support</li>
              <li>Specimen pickup and delivery</li>
              <li>Direct lab partnerships for fast results</li>
              <li>Insurance billing and self-pay options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}