export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">About MobilePhlebotomy.org</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-600 mb-8">
                The nation&apos;s premier directory connecting patients with certified mobile phlebotomy services for convenient, at-home blood draws and lab collections.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 mb-6">
                We believe healthcare should be accessible, convenient, and stress-free. Our platform bridges the gap between patients who need blood work done and qualified mobile phlebotomists who can provide these services in the comfort of their homes.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">For Patients</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Search for providers in your area</li>
                    <li>• Compare services and reviews</li>
                    <li>• Contact providers directly</li>
                    <li>• Schedule convenient appointments</li>
                    <li>• Get blood drawn at home</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">For Providers</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• List your services for free</li>
                    <li>• Reach more patients</li>
                    <li>• Manage your business profile</li>
                    <li>• Build your reputation</li>
                    <li>• Grow your practice</li>
                  </ul>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Mobile Phlebotomy?</h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl mb-3">🏠</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Convenience</h3>
                  <p className="text-gray-600 text-sm">No need to travel to labs or wait in crowded waiting rooms</p>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-3">👨‍⚕️</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Professional</h3>
                  <p className="text-gray-600 text-sm">Licensed, insured, and experienced phlebotomists</p>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-3">⏰</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Flexible</h3>
                  <p className="text-gray-600 text-sm">Schedule appointments that work with your schedule</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quality Standards</h2>
              <p className="text-gray-600 mb-4">
                All providers in our directory must meet strict quality standards:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8">
                <li>Current phlebotomy certification or nursing license</li>
                <li>Professional liability insurance</li>
                <li>Background checks and verification</li>
                <li>Ongoing education and training</li>
                <li>Positive patient reviews and ratings</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Services</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <ul className="space-y-1 text-gray-600">
                  <li>• Routine blood draws</li>
                  <li>• Lab specimen collection</li>
                  <li>• Wellness testing</li>
                  <li>• Annual health screenings</li>
                </ul>
                <ul className="space-y-1 text-gray-600">
                  <li>• Corporate health programs</li>
                  <li>• Insurance physicals</li>
                  <li>• Diagnostic testing</li>
                  <li>• IV therapy (where licensed)</li>
                </ul>
              </div>

              <div className="bg-primary-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Ready to Get Started?</h3>
                <p className="text-primary-800 mb-4">
                  Whether you&apos;re looking for mobile phlebotomy services or want to list your practice, we&apos;re here to help.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="/search" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                    Find a Provider
                  </a>
                  <a href="/add-provider" className="border border-primary-600 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors">
                    List Your Service
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}