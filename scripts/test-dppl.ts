/**
 * Test script for DPPL system
 * Run with: npx tsx scripts/test-dppl.ts
 */

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function testDPPL() {
  console.log('🧪 Testing DPPL System\n')

  // Test 1: Submit lead
  console.log('1️⃣ Submitting test lead...')
  const leadResponse = await fetch(`${API_BASE}/api/lead/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Patient',
      phone: '5555551234',
      email: 'patient@test.com',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90210',
      urgency: 'STANDARD',
      notes: 'DPPL system test'
    })
  })

  const leadResult = await leadResponse.json()
  console.log('Lead result:', leadResult)

  if (leadResult.ok && leadResult.status === 'routed') {
    console.log('✅ Lead successfully routed and provider charged!')
  } else if (leadResult.ok && leadResult.status === 'unserved') {
    console.log('⚠️ Lead created but no eligible provider found')
    console.log('   Make sure you have a provider with:')
    console.log('   - stripePaymentMethodId set')
    console.log('   - zipCodes includes "90210"')
  } else {
    console.log('❌ Lead submission failed:', leadResult.error)
  }

  console.log('\n✅ Test complete!')
  console.log('\nNext steps:')
  console.log('1. Check Stripe dashboard for payment: https://dashboard.stripe.com/test/payments')
  console.log('2. Check Vercel logs for routing details')
  console.log('3. Check email for lead notification')
}

testDPPL().catch(console.error)
