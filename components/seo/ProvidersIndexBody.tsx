import Link from 'next/link'
import type { IndexedProvider } from '@/lib/seo/providersIndex'

interface Props {
  providers: IndexedProvider[]
  pageNum: number
  totalPages: number
  totalCount: number
}

function pageHref(n: number): string {
  return n === 1 ? '/providers' : `/providers/page/${n}`
}

export default function ProvidersIndexBody({ providers, pageNum, totalPages, totalCount }: Props) {
  const start = (pageNum - 1) * 50 + 1
  const end = Math.min(pageNum * 50, totalCount)

  // Build a compact pagination list — first, last, neighbors of current page.
  const pagesToShow = new Set<number>([1, totalPages, pageNum - 1, pageNum, pageNum + 1])
  const numberedPages = Array.from(pagesToShow).filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">All Mobile Phlebotomy Providers</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            All Mobile Phlebotomy Providers
          </h1>
          <p className="text-gray-600">
            Browse every verified mobile phlebotomy provider in our network. Showing {start}–{end} of {totalCount}.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <nav aria-label="All providers" className="bg-white rounded-lg shadow-md p-6">
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => {
              const summary = (p.description || '')
                .replace(/\*\*/g, '')
                .split(/\n+/)[0]
                .trim()
                .slice(0, 110)
              return (
                <li key={p.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <Link
                    href={`/provider/${p.slug}`}
                    className="font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                  >
                    {p.name}
                  </Link>
                  {(p.primaryCity || p.primaryState) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[p.primaryCity, p.primaryState].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {summary && (
                    <p className="text-sm text-gray-600 mt-2 leading-snug">{summary}</p>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex justify-center items-center gap-2 flex-wrap">
            {pageNum > 1 && (
              <Link
                href={pageHref(pageNum - 1)}
                rel="prev"
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                ← Previous
              </Link>
            )}
            {numberedPages.map((n, i) => {
              const prev = numberedPages[i - 1]
              const showGap = prev !== undefined && n - prev > 1
              return (
                <span key={n} className="contents">
                  {showGap && <span className="px-2 text-gray-400">…</span>}
                  {n === pageNum ? (
                    <span className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold">{n}</span>
                  ) : (
                    <Link
                      href={pageHref(n)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {n}
                    </Link>
                  )}
                </span>
              )
            })}
            {pageNum < totalPages && (
              <Link
                href={pageHref(pageNum + 1)}
                rel="next"
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  )
}
