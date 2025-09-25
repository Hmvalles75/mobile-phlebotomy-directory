import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-32">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-new.png"
              alt="MobilePhlebotomy.org"
              width={800}
              height={200}
              className="h-28 w-auto max-w-2xl"
              priority
              unoptimized
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {/* @ts-ignore - Next.js typedRoutes compatibility */}
            <Link href="/search" className="text-gray-600 hover:text-primary-600 transition-colors">
              Find Providers
            </Link>
            {/* @ts-ignore - Next.js typedRoutes compatibility */}
            <Link href="/metros" className="text-gray-600 hover:text-primary-600 transition-colors">
              Metro Areas
            </Link>
            <div className="relative group">
              <button className="text-gray-600 hover:text-primary-600 transition-colors flex items-center">
                Resources
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2">
                  <Link href="/at-home-blood-draw-services" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                    At-Home Blood Draw Guide
                  </Link>
                  <Link href="/mobile-phlebotomy-cost" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                    Pricing & Costs
                  </Link>
                  <Link href="/mobile-blood-draw-near-me" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                    Find Services Near Me
                  </Link>
                  <Link href="/mobile-phlebotomy-insurance-coverage" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                    Insurance Coverage
                  </Link>
                </div>
              </div>
            </div>
            {/* @ts-ignore - Next.js typedRoutes compatibility */}
            <Link href="/about" className="text-gray-600 hover:text-primary-600 transition-colors">
              About
            </Link>
            {/* @ts-ignore - Next.js typedRoutes compatibility */}
            <Link href="/contact" className="text-gray-600 hover:text-primary-600 transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              // @ts-ignore - Next.js typedRoutes compatibility
              href="/add-provider"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Add your Business
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}