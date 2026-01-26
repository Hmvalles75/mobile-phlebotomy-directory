# SMS Onboarding Reply Tracking

## The Problem

Your SMS blast tool sends permission-first messages like:
```
"Hi — I run MobilePhlebotomy.org. We're getting patient requests near Los Angeles.
Do you want free leads by text? Reply YES or NO. Reply STOP to opt out."
```

But your current webhook (`/api/webhooks/sms-reply`) only handles **lead-related replies** (CLAIMED, BOOKED, etc.), not **onboarding YES/NO replies**.

## What You Need

A way to capture and track:
- **YES** → Mark provider "Confirmed/Active" + send follow-up
- **NO** → Mark "Do Not Contact"
- **STOP** → Twilio handles automatically

## Two Options

### Option 1: Manual Processing (Quick Start)

1. Check Twilio console for incoming messages
2. Manually update provider status in admin panel
3. Send follow-up SMS manually to YES replies

**Pros:**
- No code changes needed
- You see exactly what providers say
- Good for first 10-20 blasts

**Cons:**
- Time-consuming at scale
- Easy to miss replies

### Option 2: Automated Webhook (Scalable)

Add to `/api/webhooks/sms-reply/route.ts`:

```typescript
// NEW: Handle onboarding YES/NO replies (before lead reply logic)
if (!lead) {
  // No recent lead found - might be an onboarding reply

  if (normalizedMessage.includes('YES') || normalizedMessage === 'Y') {
    // Mark provider as interested in leads
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        eligibleForLeads: true,
        smsOptInAt: new Date()
      }
    })

    // Send follow-up asking for coverage details
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Great! Confirm your coverage area (cities/ZIPs or radius) and best email for lead details. You can also update here: https://mobilephlebotomy.org/dashboard</Message></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  if (normalizedMessage.includes('NO') || normalizedMessage === 'N') {
    // Mark as not interested
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        smsOptOutAt: new Date(),
        smsOptOutReason: 'User replied NO to onboarding'
      }
    })

    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Understood. You won\'t receive lead notifications. Reply RESTART if you change your mind.</Message></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }
}
```

**Pros:**
- Fully automated
- Instant follow-up to YES replies
- Scales to hundreds of providers

**Cons:**
- Requires schema changes (add `smsOptInAt`, `smsOptOutAt` fields)
- Need to test thoroughly

## Recommended Approach for This Week

**Start with Option 1** (manual) for your first LA/NYC/Detroit blasts:

1. Run dry-run:
   ```bash
   npx tsx scripts/send-targeted-sms.ts --city "Los Angeles" --state CA --dry-run
   ```

2. Send to 10-20 providers:
   ```bash
   npx tsx scripts/send-targeted-sms.ts --city "Los Angeles" --state CA --message "Hi — I run MobilePhlebotomy.org. We're getting patient requests near Los Angeles. Do you want free leads by text? Reply YES or NO. Reply STOP to opt out."
   ```

3. Check Twilio console for replies

4. Manually respond to YES replies with coverage follow-up

5. Mark providers in your admin panel:
   - YES → Set `eligibleForLeads = true`
   - NO → Make note (don't contact again)

**After you validate the process** and see good response rates, implement Option 2 for automation.

## Database Fields You'll Need (Future)

```prisma
model Provider {
  // ... existing fields

  smsOptInAt       DateTime?  // When they said YES
  smsOptOutAt      DateTime?  // When they said NO or STOP
  smsOptOutReason  String?    // Why they opted out
  lastSMSSentAt    DateTime?  // Track when you last contacted them
}
```

This prevents you from:
- Texting someone who said NO
- Double-texting the same provider
- Losing track of who's active

## Next Steps

1. ✅ Use the script to send your first permission-first blasts (manual tracking)
2. After 50+ replies, add the opt-in/opt-out fields to your schema
3. Implement automated webhook handling
4. Build admin view to see all YES/NO replies in one place
