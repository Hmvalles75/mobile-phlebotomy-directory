#!/usr/bin/env node

/**
 * Post-Build Deployment Checklist
 * Runs after build to verify environment configuration
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'SENDGRID_API_KEY',
  'LEAD_EMAIL_FROM',
  'ADMIN_EMAIL',
  'NEXT_PUBLIC_SITE_URL'
]

const optionalEnvVars = [
  'STRIPE_PRICE_FEATURED_SMALL',
  'STRIPE_PRICE_FEATURED_MED',
  'STRIPE_PRICE_FEATURED_LARGE',
  'TWILIO_MESSAGING_SERVICE_SID',
  'SILENT_MODE',
  'CRON_SECRET',
  'ADMIN_SECRET'
]

const webhookEndpoints = [
  '/api/webhooks/stripe',
  '/api/telephony/voice',
  '/api/telephony/status'
]

const policyRoutes = [
  '/privacy',
  '/terms'
]

console.log('\n========================================')
console.log('  DEPLOYMENT CHECKLIST')
console.log('========================================\n')

// Check environment variables
console.log('📋 Checking Environment Variables...\n')

const missing: string[] = []
const present: string[] = []

requiredEnvVars.forEach((envVar) => {
  if (process.env[envVar]) {
    present.push(envVar)
    console.log(`✅ ${envVar}`)
  } else {
    missing.push(envVar)
    console.log(`❌ ${envVar} - MISSING!`)
  }
})

console.log('\n📦 Optional Environment Variables:\n')

optionalEnvVars.forEach((envVar) => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}`)
  } else {
    console.log(`⚠️  ${envVar} - Not set (optional)`)
  }
})

// Check SILENT_MODE
console.log('\n🔇 Mode Configuration:\n')
const silentMode = process.env.SILENT_MODE
if (silentMode === 'true') {
  console.log('⚠️  SILENT_MODE: ENABLED - Leads will NOT be auto-routed')
  console.log('   → Admin will receive notifications only')
  console.log('   → Set SILENT_MODE=false when ready for live routing')
} else if (silentMode === 'false') {
  console.log('✅ SILENT_MODE: DISABLED - Live routing active')
  console.log('   → Leads will route to verified providers with credits')
} else {
  console.log('⚠️  SILENT_MODE: Not set (defaults to false)')
}

// Check webhook endpoints exist
console.log('\n🔗 Webhook Endpoints:\n')
console.log('Configure these URLs in your integrations:')
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

webhookEndpoints.forEach((endpoint) => {
  console.log(`   ${siteUrl}${endpoint}`)
})

// Check GA4
console.log('\n📊 Analytics:\n')
if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
  console.log(`✅ GA4 Measurement ID: ${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`)
} else {
  console.log('❌ GA4 not configured')
}

// Check policy routes
console.log('\n📄 Policy Pages:\n')
policyRoutes.forEach((route) => {
  console.log(`   ${siteUrl}${route}`)
})

// Stripe webhook secret check
console.log('\n💳 Stripe Configuration:\n')
if (process.env.STRIPE_WEBHOOK_SECRET) {
  const webhookPrefix = process.env.STRIPE_WEBHOOK_SECRET.substring(0, 12)
  console.log(`✅ Webhook Secret: ${webhookPrefix}...`)
  console.log(`   Configure in Stripe Dashboard:`)
  console.log(`   → ${siteUrl}/api/webhooks/stripe`)
} else {
  console.log('❌ Stripe webhook secret not set')
}

// Featured tier prices
if (process.env.STRIPE_PRICE_FEATURED_SMALL) {
  console.log(`✅ Featured SMALL tier price configured`)
}
if (process.env.STRIPE_PRICE_FEATURED_MED) {
  console.log(`✅ Featured MEDIUM tier price configured`)
}
if (process.env.STRIPE_PRICE_FEATURED_LARGE) {
  console.log(`✅ Featured LARGE tier price configured`)
}

// Twilio configuration
console.log('\n📞 Twilio Configuration:\n')
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  console.log(`✅ Twilio credentials configured`)
  console.log(`   Configure webhooks in Twilio Console:`)
  console.log(`   Voice: ${siteUrl}/api/telephony/voice`)
  console.log(`   Status: ${siteUrl}/api/telephony/status`)
} else {
  console.log('⚠️  Twilio not fully configured')
}

// Final summary
console.log('\n========================================')
console.log('  SUMMARY')
console.log('========================================\n')

if (missing.length === 0) {
  console.log('✅ All required environment variables are set!')
} else {
  console.log(`❌ Missing ${missing.length} required environment variable(s):`)
  missing.forEach((envVar) => console.log(`   - ${envVar}`))
  console.log('\n⚠️  BUILD WARNING: Application may not function correctly')
}

console.log('\n📋 Next Steps:\n')
console.log('1. Verify all env vars in your deployment platform')
console.log('2. Configure Stripe webhook endpoint')
console.log('3. Configure Twilio webhook endpoints')
console.log('4. Test end-to-end lead flow')
console.log('5. Set SILENT_MODE=false when ready for live routing')
console.log('\n========================================\n')

// Exit with error code if missing required vars
if (missing.length > 0) {
  process.exit(1)
}
