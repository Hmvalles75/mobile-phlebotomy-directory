import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import { STATE_DATA } from '@/data/states-full'

interface Props {
  citySlug: string   // e.g., 'boston-ma' (full slug used in URL)
  cityShort: string  // e.g., 'Boston' (display name without state)
  variant: 'mobile-phlebotomy' | 'in-home-blood-draw' | 'blood-draw-at-home'
}

const VARIANT_LABEL: Record<Props['variant'], string> = {
  'mobile-phlebotomy':   'Mobile Phlebotomy',
  'in-home-blood-draw':  'In-Home Blood Draw',
  'blood-draw-at-home':  'Blood Draw at Home',
}

const ABBR_TO_STATE: Record<string, { name: string; slug: string }> = {}
for (const [slug, info] of Object.entries(STATE_DATA)) {
  ABBR_TO_STATE[info.abbr] = { name: info.name, slug }
}

/**
 * Emits BreadcrumbList JSON-LD for /<city-state>/<variant> pages.
 *
 * Schema-only (no visible nav) — matches the existing /us/[state]/[city]
 * pattern and avoids disrupting the city page hero layout. Google still
 * picks up the breadcrumb trail in SERP from the JSON-LD.
 */
export default function CityBreadcrumb({ citySlug, cityShort, variant }: Props) {
  const stateAbbr = citySlug.split('-').pop()!.toUpperCase()
  const state = ABBR_TO_STATE[stateAbbr]
  if (!state) return null

  const citySlugClean = cityShort.toLowerCase().replace(/\s+/g, '-')

  const items = [
    { name: 'Home',                     url: '/' },
    { name: state.name,                 url: `/us/${state.slug}` },
    { name: cityShort,                  url: `/us/${state.slug}/${citySlugClean}` },
    { name: VARIANT_LABEL[variant],     url: `/${citySlug}/${variant}` },
  ]

  return <BreadcrumbSchema items={items} />
}
