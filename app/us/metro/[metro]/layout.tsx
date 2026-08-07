import { Metadata } from 'next'
import { getMetroBySlug } from '@/data/top-metros'
import { SITE_URL } from '@/lib/seo'
import { metroHref } from '@/lib/seo/metroCanonical'

interface MetroLayoutProps {
  children: React.ReactNode
  params: {
    metro: string
  }
}

export async function generateMetadata({ params }: { params: { metro: string } }): Promise<Metadata> {
  const metro = getMetroBySlug(params.metro)

  if (!metro) {
    return {
      title: 'Metro Area Not Found',
      description: 'The requested metro area was not found.'
    }
  }

  const title = `Mobile Phlebotomy ${metro.city}, ${metro.stateAbbr} | At-Home Blood Draw Services (2026)`
  const description = `Find certified mobile phlebotomists serving ${metro.city} and surrounding areas. At-home blood draws with same-day availability.`

  // Cross-canonical to the city page rather than self-canonical. These pages
  // previously inherited the root `canonical: '/'` and disclaimed themselves to
  // the homepage. Pointing at the city page consolidates the 46 metros that
  // have a twin immediately, without waiting for each redirect batch to ship —
  // metroHref returns the metro's own URL for New York City and Washington DC,
  // which have no city page, so those stay self-canonical.
  const canonical = `${SITE_URL}${metroHref(metro)}`

  return {
    title,
    description,
    keywords: `mobile phlebotomy ${metro.city}, at-home blood draw ${metro.city}, phlebotomist ${metro.city} ${metro.stateAbbr}, mobile lab services ${metro.city}, home blood test ${metro.city}`,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
    },
  }
}

export default function MetroLayout({ children }: MetroLayoutProps) {
  return children
}