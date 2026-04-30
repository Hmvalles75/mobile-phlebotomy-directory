import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo'
import {
  getIndexedProviders,
  paginate,
  totalProviderPages,
} from '@/lib/seo/providersIndex'
import ProvidersIndexBody from '@/components/seo/ProvidersIndexBody'

export const revalidate = 3600

interface PageProps {
  params: { n: string }
}

export async function generateStaticParams() {
  const all = await getIndexedProviders()
  const totalPages = totalProviderPages(all.length)
  // Page 1 is served by /providers; only generate 2..N here.
  const out: Array<{ n: string }> = []
  for (let i = 2; i <= totalPages; i++) out.push({ n: String(i) })
  return out
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const n = parseInt(params.n, 10)
  return {
    title: `All Mobile Phlebotomy Providers — Page ${n} | Verified Directory`,
    description: `Page ${n} of the verified mobile phlebotomy provider directory. Browse at-home blood draw services across the US.`,
    alternates: { canonical: `${SITE_URL}/providers/page/${n}` },
    robots: { index: true, follow: true },
  }
}

export default async function ProvidersIndexPaginatedPage({ params }: PageProps) {
  const pageNum = parseInt(params.n, 10)
  if (!Number.isFinite(pageNum) || pageNum < 1) notFound()

  const all = await getIndexedProviders()
  const totalPages = totalProviderPages(all.length)
  if (pageNum > totalPages || pageNum < 2) notFound()

  const providers = paginate(all, pageNum)
  return (
    <ProvidersIndexBody
      providers={providers}
      pageNum={pageNum}
      totalPages={totalPages}
      totalCount={all.length}
    />
  )
}
