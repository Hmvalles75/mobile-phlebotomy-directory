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
            <Link href="/#browse-by-state" className="text-gray-600 hover:text-primary-600 transition-colors">
              Find Providers
            </Link>
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