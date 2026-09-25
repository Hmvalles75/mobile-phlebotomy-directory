import { Suspense } from 'react'
import SearchContent from './SearchContent'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Mobile Phlebotomy Providers',
  description: 'Search for mobile phlebotomy providers by location, service type, and more.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* The fallback is the server HTML (SearchContent suspends on useSearchParams), so the H1 lives here too. */}
          <h1 className="text-3xl font-bold mb-6">Find Mobile Phlebotomy Providers</h1>
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading search...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}