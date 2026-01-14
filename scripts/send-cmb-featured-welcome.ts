import { emailFeaturedProviderWelcome } from '../lib/providerEmails'

async function main() {
  console.log('📧 Sending Featured Provider Welcome Email to CMB Group\n')

  const email = 'info@cmbgroupny.com'
  const providerName = 'CMB Group Consulting & Advisory Firm'
  const contactName = 'CMB Group'
  const metros = [
    'New York City metro (all 5 boroughs)',
    'Nassau County, NY',
    'Northern New Jersey',
    'New York (statewide)',
    'New Jersey (statewide)'
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
    console.log('📬 CMB Group should receive an email explaining:')
    console.log('  ✓ Premium placement benefits')
    console.log('  ✓ Real-time lead notifications')
    console.log('  ✓ Free leads during beta')
    console.log('  ✓ Coverage areas (NYC metro + NY/NJ statewide)')
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
