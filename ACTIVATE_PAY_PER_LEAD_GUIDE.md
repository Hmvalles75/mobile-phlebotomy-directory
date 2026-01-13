# Pay-Per-Lead Activation Guide

## Overview

This guide explains how to activate the pay-per-lead system when you're ready to start charging providers for leads.

**Current Status:** All leads are FREE (Beta mode)
**When Activated:** Providers will be charged per lead they claim

---

## Prerequisites

Before activating pay-per-lead:

1. ✅ Stripe account set up (Test or Live mode)
2. ✅ `STRIPE_SECRET_KEY` configured in Vercel environment variables
3. ⚠️ All providers must have payment methods saved
4. ⚠️ Lead prices configured in database

---

## Step 1: Set Lead Prices

### Understanding Lead Pricing

Leads have a `priceCents` field in the database (in cents, not dollars):
- **$25 lead** = 2500 cents
- **$50 lead** = 5000 cents
- **$75 lead** = 7500 cents

### Current Lead Prices

Check existing lead prices:
```bash
npx tsx -e "
import { prisma } from './lib/prisma.js';
const leads = await prisma.lead.findMany({
  where: { status: 'OPEN' },
  select: { id: true, city: true, state: true, urgency: true, priceCents: true }
});
console.log('Current Open Leads:');
leads.forEach(l => {
  console.log(\`- \${l.city}, \${l.state} (\${l.urgency}): $\${(l.priceCents / 100).toFixed(2)}\`);
});
await prisma.\$disconnect();
"
```

### Set Prices for Existing Leads

If leads don't have prices set, you can update them:

**Option A: Set all leads to $25:**
```bash
npx tsx -e "
import { prisma } from './lib/prisma.js';
await prisma.lead.updateMany({
  where: { status: 'OPEN' },
  data: { priceCents: 2500 }
});
console.log('✅ All OPEN leads set to $25.00');
await prisma.\$disconnect();
"
```

**Option B: Set prices by urgency:**
```bash
npx tsx -e "
import { prisma } from './lib/prisma.js';

// Standard leads: $25
await prisma.lead.updateMany({
  where: { status: 'OPEN', urgency: 'STANDARD' },
  data: { priceCents: 2500 }
});

// STAT leads: $50
await prisma.lead.updateMany({
  where: { status: 'OPEN', urgency: 'STAT' },
  data: { priceCents: 5000 }
});

console.log('✅ Prices set:');
console.log('   STANDARD leads: $25.00');
console.log('   STAT leads: $50.00');
await prisma.\$disconnect();
"
```

### Default Prices for New Leads

Update the lead creation endpoint to set default prices:

**File:** `app/api/lead/submit/route.ts` (or wherever leads are created)

```typescript
// Set price based on urgency
const priceCents = urgency === 'STAT' ? 5000 : 2500  // $50 for STAT, $25 for STANDARD

const lead = await prisma.lead.create({
  data: {
    // ... other fields
    priceCents: priceCents,
    // ...
  }
})
```

---

## Step 2: Ensure Providers Have Payment Methods

### Check Provider Payment Status

```bash
npx tsx scripts/check-provider-payment-status.ts
```

Create this script:
```typescript
import { prisma } from '../lib/prisma'

async function checkPaymentStatus() {
  const providers = await prisma.provider.findMany({
    where: {
      claimVerifiedAt: { not: null } // Only onboarded providers
    },
    select: {
      name: true,
      claimEmail: true,
      stripeCustomerId: true,
      stripePaymentMethodId: true,
      eligibleForLeads: true
    }
  })

  console.log('Provider Payment Status:\n')

  let readyCount = 0
  let needsPaymentCount = 0

  providers.forEach(p => {
    const hasPayment = !!(p.stripeCustomerId && p.stripePaymentMethodId)
    const status = hasPayment ? '✅ Ready' : '❌ Needs Payment Method'

    console.log(`${status} - ${p.name}`)
    console.log(`   Email: ${p.claimEmail}`)
    console.log(`   Customer: ${p.stripeCustomerId || 'Not set'}`)
    console.log(`   Payment Method: ${p.stripePaymentMethodId || 'Not set'}`)
    console.log()

    if (hasPayment) readyCount++
    else needsPaymentCount++
  })

  console.log('\nSummary:')
  console.log(`✅ Ready for pay-per-lead: ${readyCount}`)
  console.log(`❌ Need payment method: ${needsPaymentCount}`)

  if (needsPaymentCount > 0) {
    console.log('\n⚠️  Warning: Some providers cannot claim leads until they add payment methods!')
  }

  await prisma.$disconnect()
}

checkPaymentStatus()
```

### Notify Providers

Before activating, email providers to:
1. Add a payment method via their dashboard
2. Explain the new pricing structure
3. Give them a heads-up about when it starts

---

## Step 3: Activate Pay-Per-Lead

### Enable Payment Code

**File:** `app/api/lead/claim/route.ts`

**Line 66-72:** Uncomment payment eligibility checks:
```typescript
// BEFORE (commented out):
// if (!provider.eligibleForLeads) {
//   throw new Error('Provider is not eligible to claim leads. Please add a payment method.')
// }

// AFTER (uncommented):
if (!provider.eligibleForLeads) {
  throw new Error('Provider is not eligible to claim leads. Please add a payment method.')
}

// BEFORE (commented out):
// if (!provider.stripeCustomerId || !provider.stripePaymentMethodId) {
//   throw new Error('Provider must have a payment method saved')
// }

// AFTER (uncommented):
if (!provider.stripeCustomerId || !provider.stripePaymentMethodId) {
  throw new Error('Provider must have a payment method saved')
}
```

**Lines 80-99:** Uncomment charge amount logic:
```typescript
// BEFORE:
// PAYMENT DISABLED: Always charge $0 until pay-per-lead is activated
let chargeAmount = 0  // Force free
let isTrial = true    // Treat everything as free trial

// AFTER: Delete the above lines and uncomment:
let chargeAmount = lead.priceCents
let isTrial = false

// Check if trial is still active
if (provider.trialStatus === 'ACTIVE' && provider.trialExpiresAt) {
  const now = new Date()
  if (provider.trialExpiresAt > now) {
    // Trial is active - charge $0
    chargeAmount = 0
    isTrial = true
  } else {
    // Trial expired - update status
    await tx.provider.update({
      where: { id: providerId },
      data: { trialStatus: 'EXPIRED' }
    })
  }
}
```

---

## Step 4: Update Dashboard Copy

**File:** `app/dashboard/page.tsx`

### Remove Beta References

**Lines 374-380:** Change from Beta to Active:
```typescript
// BEFORE:
<span className="text-3xl font-bold text-gray-900">
  $0
</span>
// ...
<p className="text-xs text-gray-500 mt-1">
  FREE during beta
</p>

// AFTER:
<span className="text-3xl font-bold text-gray-900">
  ${stats.totalSpent.toFixed(0)}
</span>
// ...
<p className="text-xs text-gray-500 mt-1">
  On leads
</p>
```

**Lines 387-393:** Update account status:
```typescript
// BEFORE:
<span className="text-2xl font-bold text-gray-900">
  BETA
</span>
// ...
<p className="text-xs text-gray-500 mt-1">
  Beta - Free leads
</p>

// AFTER:
<span className="text-2xl font-bold text-gray-900">
  ACTIVE
</span>
// ...
<p className="text-xs text-gray-500 mt-1">
  Pay per lead
</p>
```

### Update Lead Pricing Display

Find the leads table where prices are shown (around line 633):
```typescript
// BEFORE:
{true ? (
  <span className="text-green-600">
    FREE <span className="line-through text-gray-400 ml-1">${(lead.priceCents / 100).toFixed(2)}</span>
  </span>
) : (
  `$${(lead.priceCents / 100).toFixed(2)}`
)}

// AFTER:
{isTrialActive ? (
  <span className="text-green-600">
    FREE <span className="line-through text-gray-400 ml-1">${(lead.priceCents / 100).toFixed(2)}</span>
  </span>
) : (
  `$${(lead.priceCents / 100).toFixed(2)}`
)}
```

---

## Step 5: Test in Stripe Test Mode

Before going live, test with Stripe test mode:

### 1. Use Test Keys
Ensure Vercel has test keys:
```
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### 2. Add Test Payment Method
Use test card: `4242 4242 4242 4242`

### 3. Claim a Test Lead
- Should charge the test card successfully
- Check Stripe dashboard for the payment
- Verify provider sees the charge in their dashboard

### 4. Test Failure Scenarios
Try with a declining card: `4000 0000 0000 0002`
- Should show error message
- Lead should remain OPEN
- Provider should not be charged

---

## Step 6: Go Live

### 1. Switch to Live Mode
Update Vercel environment variables:
```
STRIPE_SECRET_KEY=sk_live_xxxxx
```

### 2. Clear Test Data
Remove test Stripe customer IDs:
```bash
npx tsx scripts/clear-test-stripe-data.ts
```

### 3. Deploy
```bash
git add .
git commit -m "Activate pay-per-lead system"
git push
```

### 4. Announce to Providers
Send email:
- Pay-per-lead is now active
- Pricing structure
- How to add payment method
- Support contact

---

## Pricing Recommendations

### Standard Pricing Structure

| Lead Type | Suggested Price | Notes |
|-----------|----------------|-------|
| STANDARD | $25 - $35 | Normal priority |
| STAT | $45 - $65 | Urgent/same-day |
| After Hours | $75 - $100 | Evening/weekend |
| Premium Markets | +$10 - $25 | High-density metros |

### Dynamic Pricing (Future Enhancement)

Consider implementing dynamic pricing based on:
- Time of day
- Day of week
- ZIP code density
- Provider competition in area
- Lead age (older leads = lower price)

---

## Monitoring After Launch

### Key Metrics to Track

1. **Provider Payment Success Rate**
   - How many claims succeed vs fail
   - Common decline reasons

2. **Average Lead Price**
   - By urgency type
   - By market

3. **Provider Adoption**
   - % of providers with payment methods
   - Claims per provider

4. **Revenue**
   - Daily/weekly/monthly totals
   - By provider
   - By market

### Create Monitoring Script

```typescript
import { prisma } from '../lib/prisma'

async function payPerLeadStats() {
  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)

  const claimedLeads = await prisma.lead.findMany({
    where: {
      status: 'CLAIMED',
      routedAt: { gte: last30Days }
    },
    select: {
      priceCents: true,
      routedAt: true,
      urgency: true
    }
  })

  const totalRevenue = claimedLeads.reduce((sum, l) => sum + l.priceCents, 0)
  const avgPrice = totalRevenue / claimedLeads.length

  console.log('📊 Last 30 Days Stats:')
  console.log(`Total Leads Claimed: ${claimedLeads.length}`)
  console.log(`Total Revenue: $${(totalRevenue / 100).toFixed(2)}`)
  console.log(`Average Lead Price: $${(avgPrice / 100).toFixed(2)}`)

  await prisma.$disconnect()
}

payPerLeadStats()
```

---

## Rollback Plan

If you need to disable pay-per-lead:

### Quick Disable
Re-comment the payment checks in `app/api/lead/claim/route.ts`:
```typescript
// Re-add these lines:
let chargeAmount = 0
let isTrial = true

// Re-comment these lines:
// if (!provider.eligibleForLeads) { ... }
// if (!provider.stripeCustomerId || !provider.stripePaymentMethodId) { ... }
```

### Full Rollback
```bash
git revert HEAD
git push
```

---

## Support & Troubleshooting

### Common Issues

**Issue:** Provider claims lead but payment fails
- Check Stripe dashboard for decline reason
- Verify provider's payment method is valid
- Lead should remain OPEN if payment fails

**Issue:** Provider says they were charged but lead isn't theirs
- Check `routedToId` field on lead
- Verify transaction in Stripe matches provider
- If error, refund via Stripe and reassign lead

**Issue:** Prices showing wrong amounts
- Check `priceCents` in database (must be in cents)
- Verify lead creation sets prices correctly
- Update existing leads if needed

### Getting Help

- Check Stripe dashboard for payment logs
- Review Vercel function logs for errors
- Test with Stripe test mode first
- Keep test keys handy for debugging

---

## Checklist Before Activation

- [ ] All lead prices are set in database
- [ ] Tested payment flow in Stripe test mode
- [ ] Providers notified about payment requirement
- [ ] Payment methods added by active providers
- [ ] Code changes committed and ready
- [ ] Dashboard copy updated
- [ ] Monitoring system in place
- [ ] Support plan ready
- [ ] Rollback plan documented
- [ ] Live Stripe keys configured in Vercel

---

*Document created: January 9, 2026*
*Ready to activate pay-per-lead when you are!*
