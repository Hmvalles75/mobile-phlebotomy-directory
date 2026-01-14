import { emailFeaturedProviderWelcome } from '../lib/providerEmails'

async function main() {
  console.log('📧 Sending Featured Provider Welcome Email to Ponce\n')

  const email = 'info@poncemobilephlebotomy.com'
  const providerName = 'Ponce Mobile Phlebotomy'
  const contactName = 'Ponce' // You may want to update this with the actual contact name
  const metros = [
    'Los Angeles, CA',
    'California (statewide)'
  ]

  console.log('Sending to:', email)
  console.log('Provider:', providerName)
  console.log('Coverage:', metros.join(', '))
  console.log()

  // Check if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not configured')
    return
  }

  if (!process.env.LEAD_EMAIL_FROM) {
    console.error('❌ LEAD_EMAIL_FROM not configured')
    return
  }

  try {
    await emailFeaturedProviderWelcome(
      email,
      providerName,
      contactName,
      metros
    )

    console.log('✅ Featured Provider welcome email sent successfully!')
    console.log()
    console.log('📬 Ponce should receive an email explaining:')
    console.log('  ✓ Premium placement benefits')
    console.log('  ✓ Real-time lead notifications')
    console.log('  ✓ Free leads during beta')
    console.log('  ✓ Coverage areas (LA metro + CA statewide)')
    console.log('  ✓ Next steps and dashboard access')

  } catch (error: any) {
    console.error('❌ Failed to send email')
    console.error('Error:', error.message)
    console.error('Response:', error.response?.body || 'No response details')
  }
}

main().catch(error => {
  console.error('Script error:', error)
  process.exit(1)
})
