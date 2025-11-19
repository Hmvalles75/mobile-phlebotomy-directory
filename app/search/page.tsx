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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}