export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            
            <div className="prose prose-lg max-w-none space-y-8">
              <p className="text-gray-600">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                <div className="text-gray-600">
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <p className="mb-4">We may collect personal information that you provide to us, including:</p>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Name and contact information</li>
                    <li>Location and address</li>
                    <li>Professional credentials (for providers)</li>
                    <li>Communication preferences</li>
                  </ul>

                  <h3 className="font-semibold mb-2">Usage Information</h3>
                  <p className="mb-4">We automatically collect information about how you use our service:</p>
                  <ul className="list-disc pl-6">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent</li>
                    <li>Search queries and interactions</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <div className="text-gray-600">
                  <p className="mb-2">We use the information we collect to:</p>
                  <ul className="list-disc pl-6">
                    <li>Provide and improve our directory service</li>
                    <li>Connect patients with healthcare providers</li>
                    <li>Verify provider credentials and qualifications</li>
                    <li>Communicate with users about our services</li>
                    <li>Analyze usage patterns and improve user experience</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
                <div className="text-gray-600">
                  <p className="mb-4">We do not sell, trade, or rent your personal information. We may share information in these situations:</p>
                  <ul className="list-disc pl-6">
                    <li>With healthcare providers when you contact them through our platform</li>
                    <li>With service providers who help us operate our platform</li>
                    <li>When required by law or to protect our rights</li>
                    <li>In connection with a business transfer or merger</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. HIPAA Compliance</h2>
                <p className="text-gray-600">
                  While MobilePhlebotomy.org is not a covered entity under HIPAA, we recognize the importance of protecting health information. We encourage all listed providers to maintain HIPAA compliance in their practices and communications with patients.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-600">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
                <div className="text-gray-600">
                  <p className="mb-4">We use cookies and similar technologies to:</p>
                  <ul className="list-disc pl-6">
                    <li>Remember your preferences and settings</li>
                    <li>Analyze website traffic and usage patterns</li>
                    <li>Improve our services and user experience</li>
                    <li>Provide personalized content and recommendations</li>
                  </ul>
                  <p className="mt-4">You can control cookie settings through your browser preferences.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
                <div className="text-gray-600">
                  <p className="mb-2">You have the right to:</p>
                  <ul className="list-disc pl-6">
                    <li>Access, update, or delete your personal information</li>
                    <li>Opt out of marketing communications</li>
                    <li>Request information about how we use your data</li>
                    <li>Withdraw consent where applicable</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, please contact us at{' '}
                    <a href="mailto:hector@mobilephlebotomy.org" className="text-primary-600 hover:underline">
                      hector@mobilephlebotomy.org
                    </a>
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
                <p className="text-gray-600">
                  Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Links</h2>
                <p className="text-gray-600">
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Data Retention</h2>
                <p className="text-gray-600">
                  We retain personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When information is no longer needed, we securely delete or anonymize it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. International Data Transfers</h2>
                <p className="text-gray-600">
                  Your information may be processed and stored in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Privacy Policy</h2>
                <p className="text-gray-600">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page with a new effective date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
                <div className="text-gray-600">
                  <p className="mb-2">If you have any questions about this Privacy Policy, please contact us:</p>
                  <ul className="list-none space-y-1">
                    <li>Email: <a href="mailto:hector@mobilephlebotomy.org" className="text-primary-600 hover:underline">hector@mobilephlebotomy.org</a></li>
                    <li>Phone: (909) 784-5734</li>
                  </ul>
                </div>
              </section>

              <div className="bg-gray-50 p-6 rounded-lg mt-8">
                <p className="text-sm text-gray-600">
                  By using MobilePhlebotomy.org, you consent to the collection and use of your information as described in this Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}