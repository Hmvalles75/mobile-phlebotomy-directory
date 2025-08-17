export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            
            <div className="prose prose-lg max-w-none space-y-8">
              <p className="text-gray-600">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600">
                  By accessing and using MobilePhlebotomy.org, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-600">
                  MobilePhlebotomy.org is a directory platform that connects patients with mobile phlebotomy service providers. We do not provide medical services directly but facilitate connections between users and healthcare providers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
                <div className="text-gray-600">
                  <h3 className="font-semibold mb-2">For Patients:</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Provide accurate information when contacting providers</li>
                    <li>Verify provider credentials and insurance before services</li>
                    <li>Follow all medical instructions and preparations</li>
                    <li>Pay for services as agreed with providers</li>
                  </ul>
                  
                  <h3 className="font-semibold mb-2">For Providers:</h3>
                  <ul className="list-disc pl-6">
                    <li>Maintain current licensing and certifications</li>
                    <li>Carry appropriate professional liability insurance</li>
                    <li>Provide accurate information in listings</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Maintain patient confidentiality and HIPAA compliance</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Disclaimer of Medical Advice</h2>
                <p className="text-gray-600">
                  MobilePhlebotomy.org does not provide medical advice, diagnosis, or treatment. All medical decisions should be made in consultation with qualified healthcare professionals. We are not responsible for the quality of care provided by listed providers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
                <p className="text-gray-600">
                  MobilePhlebotomy.org serves as a directory service only. We do not guarantee the availability, quality, or outcomes of services provided by listed providers. Users engage with providers at their own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
                <p className="text-gray-600">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
                <p className="text-gray-600">
                  All content on MobilePhlebotomy.org, including text, graphics, logos, and software, is owned by us or our licensors and is protected by copyright and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Prohibited Uses</h2>
                <div className="text-gray-600">
                  <p className="mb-2">You may not use our service to:</p>
                  <ul className="list-disc pl-6">
                    <li>Violate any laws or regulations</li>
                    <li>Impersonate others or provide false information</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Distribute spam or unsolicited communications</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
                <p className="text-gray-600">
                  We reserve the right to terminate or suspend access to our service immediately, without prior notice, for conduct that we believe violates these Terms of Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
                <p className="text-gray-600">
                  We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page with a new effective date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
                <p className="text-gray-600">
                  If you have any questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:legal@mobilephlebotomy.org" className="text-primary-600 hover:underline">
                    legal@mobilephlebotomy.org
                  </a>
                </p>
              </section>

              <div className="bg-gray-50 p-6 rounded-lg mt-8">
                <p className="text-sm text-gray-600">
                  By using MobilePhlebotomy.org, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}