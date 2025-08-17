import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MobilePhlebotomy</span>
            </Link>
            <p className="text-gray-600 mb-4 max-w-md">
              The nation's largest directory of mobile phlebotomy services. Find certified, 
              insured providers for at-home blood draws and lab collections near you.
            </p>
            <div className="flex space-x-4">
              <span className="text-sm text-gray-500">© 2024 MobilePhlebotomy.org</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For Patients</h3>
            <ul className="space-y-2">
              {/* @ts-ignore - Next.js typedRoutes compatibility */}
              <li><Link href="/search" className="text-gray-600 hover:text-primary-600 transition-colors">Find Providers</Link></li>
              {/* @ts-ignore - Next.js typedRoutes compatibility */}
              <li><Link href="/about" className="text-gray-600 hover:text-primary-600 transition-colors">How It Works</Link></li>
              {/* @ts-ignore - Next.js typedRoutes compatibility */}
              <li><Link href="/contact" className="text-gray-600 hover:text-primary-600 transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For Providers</h3>
            <ul className="space-y-2">
              {/* @ts-ignore - Next.js typedRoutes compatibility */}
              <li><Link href="/add-provider" className="text-gray-600 hover:text-primary-600 transition-colors">Add Your Listing</Link></li>
              {/* @ts-ignore - Next.js typedRoutes compatibility */}
              <li><Link href="/terms" className="text-gray-600 hover:text-primary-600 transition-colors">Terms of Service</Link></li>
              {/* @ts-ignore - Next.js typedRoutes compatibility */}
              <li><Link href="/privacy" className="text-gray-600 hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}