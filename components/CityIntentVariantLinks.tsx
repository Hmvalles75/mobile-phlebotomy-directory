import Link from 'next/link'

interface Props {
  citySlug: string                    // e.g., 'boston-ma'
  cityName: string                    // e.g., 'Boston, MA'
  current: 'mobile-phlebotomy' | 'in-home-blood-draw' | 'blood-draw-at-home'
}

const ALL_VARIANTS = [
  { slug: 'mobile-phlebotomy', label: 'Mobile Phlebotomy' },
  { slug: 'in-home-blood-draw', label: 'In-Home Blood Draw Services' },
  { slug: 'blood-draw-at-home', label: 'Blood Draw at Home' },
] as const

/**
 * Internal-link block shown at the bottom of every city service page.
 * Points to the other 2 intent variants for the same city, giving each
 * variant inbound links from its siblings (helps SEO authority flow).
 */
export default function CityIntentVariantLinks({ citySlug, cityName, current }: Props) {
  const others = ALL_VARIANTS.filter(v => v.slug !== current)

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold mb-4">Related Services in {cityName}</h2>
      <p className="text-gray-600 mb-6">
        Looking for a different way to describe what you need? We cover the full range of in-home phlebotomy services in {cityName}:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {others.map(v => (
          <Link
            key={v.slug}
            href={`/${citySlug}/${v.slug}`}
            className="block bg-primary-50 rounded-lg p-5 border-2 border-primary-200 hover:bg-primary-100 hover:border-primary-300 transition-all"
          >
            <span className="font-bold text-primary-900">{v.label} in {cityName} &rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
