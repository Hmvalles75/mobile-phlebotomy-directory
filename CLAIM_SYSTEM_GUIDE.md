# Business Claim & 3-Tier Badge System Guide

## Overview

The system now has a 3-tier provider classification with badges to indicate engagement level:

### 🎯 The Three Tiers

**TIER 1: Basic Listing** (No badge)
- Who: Providers you added from research without their knowledge
- Status: Listed but not engaged
- Badge: None
- Example: Providers scraped from Google Maps

**TIER 2: Registered Provider** (✓ Registered badge)
- Who: Providers who submitted the add-provider form OR claimed their listing
- Status: Actively engaged, verified ownership
- Badge: Green "✓ Registered" badge
- Benefits: Shows legitimacy, confirmed ownership

**TIER 3: Featured Provider** (⭐ Featured badge)
- Who: Paying customers ($100/month suggested)
- Status: Premium placement
- Badge: Gold "⭐ Featured Provider" badge
- Benefits: Top placement, highlighted in listings, premium SEO

## Files Created

### Core System Files

1. **lib/business-claims.ts**
   - Manages business claim submissions
   - Tracks verification status (pending/verified/rejected)
   - Stores in `data/business-claims.json`

2. **lib/provider-tiers.ts**
   - Manages provider tier assignments
   - Functions: `getProviderTier()`, `markProviderAsRegistered()`, `markProviderAsFeatured()`
   - Stores in `data/provider-tiers.json`

3. **components/ui/ClaimBusinessForm.tsx**
   - Form component for providers to claim their listing
   - Fields: name, email, phone, requested updates, owner confirmation

4. **app/api/claim-business/route.ts**
   - API endpoint for claim submissions
   - Sends email to admin + verification email to claimant
   - Saves claim to database

5. **app/admin/claims/page.tsx**
   - Admin interface to manage claims
   - View pending/verified/rejected claims
   - Verify or reject claims with notes

6. **app/api/admin/claims/route.ts** & **app/api/admin/claims/[id]/route.ts**
   - API endpoints for admin claim management
   - Handles verification, rejection, deletion

## How It Works

### Provider Claims Their Business

1. Provider visits their listing page
2. Clicks "Claim This Business" button (TODO: Add to provider pages)
3. Fills out claim form:
   - Business name (pre-filled)
   - Their name
   - Their email (business email preferred)
   - Phone number
   - What they want to update
   - Confirms they're the owner

4. **Automatic actions:**
   - Claim saved to `data/business-claims.json`
   - Email sent to admin (`hector@mobilephlebotomy.org`)
   - Verification email sent to claimant

### Admin Verifies Claim

1. Admin receives email notification
2. Goes to `/admin/claims`
3. Reviews claim details:
   - Provider name
   - Claimant info
   - Requested updates
   - IP address for fraud prevention

4. Sends verification email manually or waits for claimant reply
5. Once confirmed, clicks "✓ Verify Claim"

6. **Automatic actions:**
   - Claim marked as "verified"
   - Provider tier upgraded to "registered" (Tier 2)
   - Provider gets "✓ Registered" badge on all listings

### Provider Upgrades to Featured (Future)

1. Provider pays $100/month subscription
2. Admin goes to `/admin/claims` or provider management
3. Clicks "Make Featured" (TODO: Add this button)
4. Sets duration (default 1 month, auto-renews)

5. **Automatic actions:**
   - Provider tier upgraded to "featured" (Tier 3)
   - Gets "⭐ Featured Provider" badge
   - Listed first in search results (TODO: Implement sorting)
   - Highlighted with special styling (TODO: Add styles)

## TODO: Complete the Implementation

### 1. Add Claim Button to Provider Pages

Edit `app/provider/[slug]/page.tsx`:

```tsx
import { ClaimBusinessForm } from '@/components/ui/ClaimBusinessForm'
import { useState } from 'react'

// In the component:
const [showClaimForm, setShowClaimForm] = useState(false)

// Add button somewhere on the page:
<button
  onClick={() => setShowClaimForm(true)}
  className="text-sm text-primary-600 hover:text-primary-700"
>
  Are you the owner? Claim this business →
</button>

// Add modal/dialog:
{showClaimForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <ClaimBusinessForm
      providerId={provider.id}
      providerName={provider.name}
      onClose={() => setShowClaimForm(false)}
    />
  </div>
)}
```

### 2. Display Badges on Listings

Edit provider card components to show badges:

```tsx
import { getProviderBadge } from '@/lib/provider-tiers'

// In the component:
const badge = getProviderBadge(provider.id)

{badge && (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
    {badge.icon} {badge.text}
  </span>
)}
```

Add to these files:
- `components/ui/ProviderCard.tsx`
- `app/us/[state]/page.tsx` (already has nationwide badge, add tier badge too)
- `app/us/[state]/[city]/page.tsx`
- `app/provider/[slug]/page.tsx`

### 3. Update CSV Conversion

Edit `convert_csv.py` to read tier data:

```python
import json

# Load tier data
with open('data/provider-tiers.json', 'r') as f:
    tiers = json.load(f)

# When converting each provider:
provider_id = str(index + 1)  # Or however you generate IDs
tier = tiers.get(provider_id, {}).get('tier', 'basic')

# Add to provider JSON:
'tier': tier,
'is_registered': tier in ['registered', 'featured'],
'is_featured': tier == 'featured',
```

### 4. Add "Make Featured" Button in Admin

Edit `app/admin/claims/page.tsx`:

```tsx
import { markProviderAsFeatured } from '@/lib/provider-tiers'

// Add button for verified claims:
{selectedClaim.status === 'verified' && (
  <button
    onClick={() => handleMakeFeatured(selectedClaim.providerId)}
    className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700"
  >
    ⭐ Make Featured Provider ($100/month)
  </button>
)}

const handleMakeFeatured = async (providerId: string) => {
  const months = prompt('How many months? (default 1)', '1')
  // Call API to mark as featured
  // Integrate with Stripe for payment
}
```

### 5. Add Featured Provider Sorting

Edit `app/api/providers/route.ts`:

```tsx
// After filtering, sort by tier:
filteredProviders.sort((a, b) => {
  const tierA = getProviderTier(a.id)
  const tierB = getProviderTier(b.id)

  const tierOrder = { featured: 0, registered: 1, basic: 2 }

  if (tierOrder[tierA] !== tierOrder[tierB]) {
    return tierOrder[tierA] - tierOrder[tierB]
  }

  // Then sort by rating
  return (b.rating || 0) - (a.rating || 0)
})
```

### 6. Email Setup

Add to `.env.local`:
```
RESEND_API_KEY=your_resend_api_key_here
```

Get key from: https://resend.com (free tier: 3,000 emails/month)

## Data Files

### data/business-claims.json
```json
[
  {
    "id": "claim_1234567890_abc123",
    "submittedAt": "2025-01-04T20:00:00.000Z",
    "status": "verified",
    "providerId": "123",
    "providerName": "Mobile Labs Pro",
    "claimantName": "Kara Terepka",
    "claimantEmail": "kterepka@mobilelabspro.com",
    "claimantPhone": "4403288125",
    "requestedUpdates": "Update phone number and services",
    "isOwnerConfirmed": true,
    "verifiedAt": "2025-01-05T10:00:00.000Z",
    "verificationMethod": "email_reply",
    "ipAddress": "162.158.152.138"
  }
]
```

### data/provider-tiers.json
```json
{
  "123": {
    "providerId": "123",
    "tier": "registered",
    "registeredAt": "2025-01-05T10:00:00.000Z"
  },
  "456": {
    "providerId": "456",
    "tier": "featured",
    "registeredAt": "2025-01-01T10:00:00.000Z",
    "featuredUntil": "2025-02-01T10:00:00.000Z"
  }
}
```

## Admin URLs

- `/admin` - Main dashboard (submissions)
- `/admin/claims` - Business claims management

## Testing

1. **Test claim submission:**
   - Go to any provider page
   - Click "Claim This Business"
   - Fill out form
   - Check email for verification

2. **Test admin verification:**
   - Login to `/admin/claims`
   - View pending claim
   - Click "✓ Verify Claim"
   - Check provider now has badge

3. **Test featured upgrade:**
   - Click "Make Featured" on verified claim
   - Set duration
   - Verify provider gets featured badge
   - Verify they appear first in listings

## Monetization Strategy

**Featured Provider Pricing:**
- $100/month per provider
- Benefits:
  - ⭐ Featured badge
  - Top placement in all listings
  - Highlighted with gold background
  - Priority in homepage carousel
  - Include in email newsletters
  - Analytics dashboard

**Implementation:**
1. Integrate Stripe for payments
2. Create subscription management
3. Auto-downgrade when subscription expires
4. Send reminder emails before expiration

## Security Notes

- All claims require admin verification
- IP addresses logged for fraud prevention
- Business email verification recommended
- Admin-only access to tier management
- Claims data gitignored (not in repository)

---

**Questions?** Contact: hector@mobilephlebotomy.org
