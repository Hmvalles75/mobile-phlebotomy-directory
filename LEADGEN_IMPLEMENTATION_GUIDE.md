# Lead-Gen System Implementation Guide

This document outlines the complete lead-generation system implementation for Mobile Phlebotomy.

## ✅ Completed Components

### 1. Database Schema (Prisma)
- ✅ Extended `Provider` model with lead-gen fields
- ✅ Added `Lead` model with routing and status tracking
- ✅ Added `CallLog` model for Twilio call tracking
- ✅ Added `CityNumber` model for city-specific tracking numbers
- ✅ Added enums: `ProviderStatus`, `FeaturedTier`, `LeadStatus`, `Urgency`

### 2. Backend APIs
- ✅ `/api/lead/submit` - Lead submission endpoint
- ✅ `/api/telephony/voice` - Twilio voice webhook
- ✅ `/api/telephony/status` - Twilio status callback
- ✅ `/api/providers/claim` - Provider claim endpoint
- ✅ `/api/providers/verify` - Email verification endpoint
- ✅ `/api/providers/purchase-credits` - Stripe checkout for lead credits
- ✅ `/api/providers/subscribe-featured` - Stripe checkout for featured tiers
- ✅ `/api/stripe/webhook` - Stripe webhook handler

### 3. Utilities
- ✅ `lib/prisma.ts` - Prisma client singleton
- ✅ `lib/leadPricing.ts` - Lead pricing logic
- ✅ `lib/routing.ts` - Lead routing to providers
- ✅ `lib/notifyProvider.ts` - Twilio + SendGrid notifications
- ✅ `lib/ga4.ts` - Google Analytics 4 event tracking

### 4. UI Components
- ✅ `LeadFormModal.tsx` - Lead submission form
- ✅ `StickyMobileCTA.tsx` - Mobile sticky CTA bar

### 5. Configuration
- ✅ `.env.example` - Environment variables template

## 🔨 Remaining Tasks

### 1. Update Provider Detail Pages

**File:** `app/provider/[slug]/page.tsx`

**Changes needed:**
1. Remove email display from public view
2. Add provider status badges:
   - ✅ Verified Provider (if status === 'VERIFIED')
   - ⚠️ Unverified Listing (if status === 'UNVERIFIED')
3. Show phone with disclaimer for unverified providers
4. Add CTAs:
   - "Request a Home Blood Draw" button → opens LeadFormModal
   - "Call Now" button → dials tracking number
   - "Claim this listing" (if unverified) → opens claim modal
5. Add compliance text for unverified listings

**Example code:**
```tsx
'use client'

import { useState } from 'react'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { ga4 } from '@/lib/ga4'

export default function ProviderPage({ provider }: { provider: any }) {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)

  return (
    <div>
      {/* Status Badge */}
      {provider.status === 'VERIFIED' && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          ✅ Verified Provider
        </span>
      )}
      {provider.status === 'UNVERIFIED' && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
          <p className="text-sm text-amber-800">
            ⚠️ <strong>Unverified Listing</strong> — Information may be outdated.
            If this is your business, <button onClick={() => setIsClaimModalOpen(true)} className="underline">claim it</button> to verify details and receive patient referrals.
          </p>
        </div>
      )}

      {/* Phone with disclaimer for unverified */}
      {provider.phonePublic && provider.status === 'UNVERIFIED' && (
        <p className="text-sm text-gray-500">
          Phone: {provider.phonePublic} (Unverified - please confirm with provider)
        </p>
      )}

      {/* CTAs */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            ga4.leadFormOpen()
            setIsLeadFormOpen(true)
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
        >
          Request a Home Blood Draw
        </button>

        <button
          onClick={() => {
            ga4.callClick()
            window.location.href = `tel:${provider.twilioNumber || process.env.NEXT_PUBLIC_DEFAULT_PHONE}`
          }}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
        >
          Call Now
        </button>
      </div>

      <LeadFormModal
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
      />
    </div>
  )
}
```

### 2. Update Homepage

**File:** `app/page.tsx`

**Changes needed:**
1. Replace hero with lead-gen focused copy:
   - Headline: "Mobile Phlebotomy — Done at Your Home"
   - Subheadline: "Same-day and next-day draws across the U.S. Licensed & background-checked providers."
   - Primary CTA: "Request a Home Blood Draw"
   - Secondary CTA: "Call Now"

2. Add trust indicators below hero:
   - ✅ Licensed professionals
   - ✅ Most insurance accepted
   - ✅ Homebound patients welcome
   - ✅ No waiting rooms

3. Add "How It Works" section (3 steps)
4. Move ZIP search below hero (secondary)
5. Move Featured Providers section lower
6. Add sticky mobile CTA component

**Example structure:**
```tsx
'use client'

import { useState } from 'react'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA'
import { ga4 } from '@/lib/ga4'

export default function HomePage() {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false)

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-blue-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Mobile Phlebotomy — Done at Your Home
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Same-day and next-day draws across the U.S. Licensed & background-checked providers.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                ga4.heroCTAClick({ cta_type: 'request' })
                ga4.leadFormOpen()
                setIsLeadFormOpen(true)
              }}
              className="bg-blue-600 text-white px-8 py-4 rounded-md text-lg font-semibold hover:bg-blue-700"
            >
              Request a Home Blood Draw
            </button>

            <button
              onClick={() => {
                ga4.heroCTAClick({ cta_type: 'call' })
                ga4.callClick()
                window.location.href = `tel:${process.env.NEXT_PUBLIC_DEFAULT_PHONE}`
              }}
              className="bg-green-600 text-white px-8 py-4 rounded-md text-lg font-semibold hover:bg-green-700"
            >
              Call Now
            </button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold">Licensed professionals</p>
            </div>
            <div>
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold">Most insurance accepted</p>
            </div>
            <div>
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold">Homebound patients welcome</p>
            </div>
            <div>
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold">No waiting rooms</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Request Service</h3>
              <p className="text-gray-600">Fill out our quick form or call to schedule your blood draw</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Get Matched</h3>
              <p className="text-gray-600">We connect you with a licensed phlebotomist in your area</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Done at Home</h3>
              <p className="text-gray-600">Your phlebotomist comes to you - safe, quick, and convenient</p>
            </div>
          </div>
        </div>
      </section>

      {/* ZIP Search (Secondary) */}
      {/* ... existing ZIP search ... */}

      {/* Featured Providers (Lower on page) */}
      {/* ... existing featured providers section ... */}

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA />

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
      />
    </>
  )
}
```

### 3. Create Provider Dashboard

**File:** `app/dashboard/page.tsx`

**Create a provider dashboard showing:**
- Lead credits balance
- Recent delivered leads (last 30 days)
- Call logs
- Featured subscription status
- Actions:
  - Buy lead credits (10, 25, 50 packs)
  - Subscribe to featured tier
  - Update service ZIP codes
  - Set primary phone for lead SMS

**Example:**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { ga4 } from '@/lib/ga4'

export default function ProviderDashboard() {
  const [provider, setProvider] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])

  const handlePurchaseCredits = async (pack: number) => {
    ga4.purchaseCreditsClick({ pack })

    const res = await fetch('/api/providers/purchase-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: provider.id, pack })
    })

    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const handleSubscribeFeatured = async (tier: string) => {
    ga4.subscribeFeaturedClick({ tier })

    const res = await fetch('/api/providers/subscribe-featured', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: provider.id, tier })
    })

    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Provider Dashboard</h1>

      {/* Credits Warning */}
      {provider?.leadCredit === 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="font-semibold text-red-800">
            You're out of credits! Buy more to receive leads instantly.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">Lead Credits</h3>
          <p className="text-3xl font-bold">{provider?.leadCredit || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">Leads This Month</h3>
          <p className="text-3xl font-bold">{leads.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">Featured Status</h3>
          <p className="text-lg font-semibold">
            {provider?.isFeatured ? `✅ ${provider.featuredTier}` : '❌ Not Featured'}
          </p>
        </div>
      </div>

      {/* Purchase Credits */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Purchase Lead Credits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => handlePurchaseCredits(10)}
            className="border-2 border-blue-600 text-blue-600 p-4 rounded-md hover:bg-blue-50"
          >
            <div className="text-2xl font-bold">10 Leads</div>
            <div className="text-gray-600">$200</div>
          </button>
          <button
            onClick={() => handlePurchaseCredits(25)}
            className="border-2 border-blue-600 bg-blue-50 text-blue-600 p-4 rounded-md hover:bg-blue-100"
          >
            <div className="text-2xl font-bold">25 Leads</div>
            <div className="text-gray-600">$475</div>
            <div className="text-xs text-green-600 mt-1">Save $25</div>
          </button>
          <button
            onClick={() => handlePurchaseCredits(50)}
            className="border-2 border-blue-600 bg-blue-50 text-blue-600 p-4 rounded-md hover:bg-blue-100"
          >
            <div className="text-2xl font-bold">50 Leads</div>
            <div className="text-gray-600">$900</div>
            <div className="text-xs text-green-600 mt-1">Save $100</div>
          </button>
        </div>
      </div>

      {/* Featured Subscription */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Become a Featured Provider</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => handleSubscribeFeatured('SMALL')}
            className="border p-4 rounded-md hover:border-amber-500"
          >
            <div className="font-bold">Small Cities</div>
            <div className="text-2xl text-amber-600">$99/mo</div>
          </button>
          <button
            onClick={() => handleSubscribeFeatured('MEDIUM')}
            className="border p-4 rounded-md hover:border-amber-500"
          >
            <div className="font-bold">Medium Cities</div>
            <div className="text-2xl text-amber-600">$249/mo</div>
          </button>
          <button
            onClick={() => handleSubscribeFeatured('LARGE')}
            className="border p-4 rounded-md hover:border-amber-500"
          >
            <div className="font-bold">Major Metros</div>
            <div className="text-2xl text-amber-600">$499/mo</div>
          </button>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Leads</h2>
        {/* Table of leads */}
      </div>
    </div>
  )
}
```

### 4. Add GA4 Script to Layout

**File:** `app/layout.tsx`

Add GA4 script tag in the `<head>`:

```tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## 📋 Setup Checklist

### Stripe Setup
1. Create Stripe account and get API keys
2. Create 3 recurring price products:
   - Small Featured ($99/month)
   - Medium Featured ($249/month)
   - Large Featured ($499/month)
3. Copy price IDs to `.env`
4. Set up webhook endpoint: `/api/stripe/webhook`
5. Copy webhook secret to `.env`

### Twilio Setup
1. Create Twilio account
2. Purchase phone numbers for tracking
3. Create Messaging Service
4. Set up webhooks:
   - Voice URL: `https://yourdomain.com/api/telephony/voice`
   - Status callback: `https://yourdomain.com/api/telephony/status`
5. Add phone numbers to `CityNumber` table

### SendGrid Setup
1. Create SendGrid account
2. Verify sender email
3. Create API key
4. Add to `.env`

### Environment Variables
Copy `.env.example` to `.env` and fill in all values

## 🧪 Test Plan

### 1. Lead Submission Flow
- [ ] Submit lead form with valid data
- [ ] Verify lead created in database
- [ ] Check lead routed to correct provider (by ZIP)
- [ ] Verify SMS sent to provider
- [ ] Verify email sent to provider
- [ ] Check provider credits decremented
- [ ] Test with provider having 0 credits
- [ ] Test with no provider covering ZIP
- [ ] Verify GA4 events fired

### 2. Provider Claim Flow
- [ ] Click "Claim this listing"
- [ ] Submit email
- [ ] Check verification email received
- [ ] Click verification link
- [ ] Verify provider status changed to VERIFIED
- [ ] Redirect to provider page with success message

### 3. Credit Purchase Flow
- [ ] Click "Buy 10 credits" from dashboard
- [ ] Complete Stripe checkout
- [ ] Verify webhook received
- [ ] Check credits added to provider
- [ ] Test with 25 and 50 credit packs

### 4. Featured Subscription Flow
- [ ] Click "Subscribe to Featured"
- [ ] Complete Stripe checkout
- [ ] Verify webhook received
- [ ] Check isFeatured flag set
- [ ] Check featuredTier set correctly
- [ ] Test subscription cancellation

### 5. Twilio Call Tracking
- [ ] Call a city tracking number
- [ ] Verify CallLog created
- [ ] Check call forwarded to provider
- [ ] Verify status callback received
- [ ] Check recording URL saved

## 🚀 Deployment

1. Push to GitHub
2. Vercel will auto-deploy
3. Add environment variables in Vercel dashboard
4. Set up Stripe webhook in production
5. Set up Twilio webhooks with production URLs
6. Test all flows in production

## 📊 Monitoring

- Monitor Stripe dashboard for payments
- Check Twilio console for call logs
- Review GA4 for conversion tracking
- Monitor admin email for unserved leads
- Check Vercel logs for errors

## 🔒 Security Notes

- Stripe webhook signature verification enabled
- Twilio webhook validation recommended
- Provider emails hidden from public view
- Lead form has rate limiting (via middleware)
- Sensitive data encrypted in transit (HTTPS)
