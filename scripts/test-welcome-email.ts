import { emailProviderApproved } from '../lib/providerEmails'

async function main() {
  console.log('🧪 Testing Provider Welcome Email\n')

  // Test data
  const testEmail = 'Hmvalles75@yahoo.com' // Your email for testing
  const testBusinessName = 'Test Mobile Phlebotomy Services'
  const testContactName = 'Hector Valles'

  console.log('Test Data:')
  console.log('  To:', testEmail)
  console.log('  Business:', testBusinessName)
  console.log('  Contact:', testContactName)
  console.log()

  // Check if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not configured')
    console.log('\nPlease set SENDGRID_API_KEY in your .env file')
    return
  }

  if (!process.env.LEAD_EMAIL_FROM) {
    console.error('❌ LEAD_EMAIL_FROM not configured')
    console.log('\nPlease set LEAD_EMAIL_FROM in your .env file')
    return
  }

  console.log('✅ SendGrid configured')
  console.log('✅ From email:', process.env.LEAD_EMAIL_FROM)
  console.log()

  // Send test email
  console.log('📧 Sending test welcome email...\n')

  try {
    await emailProviderApproved(testEmail, testBusinessName, testContactName)

    console.log('✅ Test email sent successfully!')
    console.log()
    console.log('📬 Check your inbox at:', testEmail)
    console.log()
    console.log('Expected email content:')
    console.log('  Subject: Your MobilePhlebotomy.org listing is live')
    console.log('  Greeting: Hi Hector,')
    console.log('  Mentions:', testBusinessName)
    console.log('  Includes: Onboarding link (https://www.mobilephlebotomy.org/onboard)')
    console.log()

  } catch (error: any) {
    console.error('❌ Failed to send test email')
    console.error('Error:', error.message)
    console.error()
    console.error('Response:', error.response?.body || 'No response details')
  }
}

main().catch(error => {
  console.error('Script error:', error)
  process.exit(1)
})
