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
            {/* Left/Center Navigation */}
            {/* @ts-ignore - Next.js typedRoutes compatibility */}
            <Link href="/search" className="text-gray-600 hover:text-primary-600 transition-colors">
              Find a Phlebotomist
            </Link>
            {/* @ts-ignore - Next.js typedRoutes compatibility */}
            <Link href="/corporate-phlebotomy" className="text-gray-600 hover:text-primary-600 transition-colors whitespace-nowrap">
              Facilities & Clinical Services
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Right Navigation - For Providers Dropdown */}
            <div className="relative group">
              <button className="text-gray-600 hover:text-primary-600 transition-colors flex items-center">
                For Providers
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2">
                  <Link href="/add-provider" className="block px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded">
                    Add Your Business
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}