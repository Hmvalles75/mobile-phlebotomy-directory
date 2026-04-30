import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'
import {
  getIndexedProviders,
  paginate,
  totalProviderPages,
  PROVIDERS_PER_PAGE,
} from '@/lib/seo/providersIndex'
import ProvidersIndexBody from '@/components/seo/ProvidersIndexBody'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'All Mobile Phlebotomy Providers | Verified Directory',
  description:
    'Browse the full directory of verified mobile phlebotomy providers. Find at-home blood draw services across all 50 US states.',
  alternates: { canonical: `${SITE_URL}/providers` },
  robots: { index: true, follow: true },
}

export default async function ProvidersIndexPage() {
  const all = await getIndexedProviders()
  const totalPages = totalProviderPages(all.length)
  const providers = paginate(all, 1)
  return (
    <ProvidersIndexBody
      providers={providers}
      pageNum={1}
      totalPages={totalPages}
      totalCount={all.length}
    />
  )
}
