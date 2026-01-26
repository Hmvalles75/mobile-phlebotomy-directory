# SMS Provider Outreach Setup - COMPLETE

## What Was Built

You now have a complete SMS outreach system for building provider coverage in key metros (LA, NYC, Detroit).

## Database Changes

Added SMS opt-in/opt-out tracking fields to the Provider model:

```typescript
smsOptInAt         DateTime?  // When provider replied YES to onboarding message
smsOptOutAt        DateTime?  // When provider replied NO or STOP
smsOptOutReason    String?    // Why they opted out
lastSMSSentAt      DateTime?  // Last time we sent them an SMS
```

**Status:** ✅ Applied to production database

## SMS Blast Tool

**Location:** `scripts/send-targeted-sms.ts`

**Features:**
- Target by state, city, ZIP, or specific provider IDs
- Dry-run mode for safe testing
- Permission-first message templates (NO emojis in cold messages)
- Automatic opt-out checking (won't text anyone who opted out)
- Automatic tracking of `lastSMSSentAt` after each message
- 1-second rate limiting between messages
- 5-second confirmation delay before sending

**Quick Start:**

```bash
# 1. Dry run first (ALWAYS!)
npx tsx scripts/send-targeted-sms.ts --city "Pasadena" --state CA --dry-run

# 2. Send to 10-20 providers (start small!)
npx tsx scripts/send-targeted-sms.ts --city "Pasadena" --state CA --message "Hi - I run MobilePhlebotomy.org (patient referral site). We're getting patient requests near Pasadena. Do you want free leads by text? Reply YES or NO. STOP to opt out."

# 3. Check Twilio console for replies
# 4. Manually update providers based on YES/NO responses
```

## Message Strategy (CRITICAL)

### COLD Message (Scraped Providers)
```
Hi - I run MobilePhlebotomy.org (patient referral site). We're getting patient requests near {City}. Do you want free leads by text? Reply YES or NO. STOP to opt out.
```

**Key Elements:**
- "(patient referral site)" = legitimacy line
- NO emojis (spam filters)
- YES/NO permission-first (not dashboard redirect)
- STOP opt-out included

### WARM Message (Form Submissions)
```
Hi {Name} - Hector from MobilePhlebotomy.org. Your listing is live. Want to receive free patient leads by text + email in your service area? Reply YES and I'll activate you. STOP to opt out.
```

### FOLLOW-UP Message (After YES Reply)
```
Great! Confirm your coverage area (cities/ZIPs or radius) and best email for lead details. You can also update here: https://mobilephlebotomy.org/dashboard
```

## Manual Processing Workflow (For Now)

1. **Send SMS blast** (10-20 providers at a time)
2. **Check Twilio console** for incoming replies
3. **YES replies:**
   - Manually update provider: `eligibleForLeads = true`, `smsOptInAt = now()`
   - Send follow-up asking for coverage details
4. **NO replies:**
   - Manually update provider: `smsOptOutAt = now()`, `smsOptOutReason = "User replied NO to onboarding"`
   - Script will automatically exclude them from future blasts
5. **STOP replies:**
   - Twilio handles automatically
   - Also update `smsOptOutAt` in database

## Future Automation (After 50+ Replies)

Once you validate the process works, you can automate YES/NO handling:

**Location to update:** `app/api/webhooks/sms-reply/route.ts`

See `scripts/sms-onboarding-tracker.md` for webhook code snippets.

## Compliance Checklist

- ✅ Opt-out tracking in database (`smsOptOutAt` field)
- ✅ Script automatically excludes opted-out providers
- ✅ STOP handling (Twilio automatic + database tracking)
- ✅ Batch size guidance (10-20 at a time)
- ✅ Rate limiting (1 msg/second)
- ✅ Consistent sender number (Twilio Messaging Service)
- ✅ Permission-first strategy (YES/NO before sending leads)

## Next Steps

1. **Test with small batch** (10-20 providers in Pasadena or Santa Monica)
2. **Watch reply rate and sentiment**
3. **Adjust message if needed**
4. **Expand to full LA metro** once validated
5. **Replicate for NYC and Detroit**

## Key Metros to Target

Focus on metros where you have SEO pages:

**LA Metro:**
- Pasadena, Santa Monica, Burbank, Glendale, Long Beach, Torrance, West Hollywood, Beverly Hills

**NYC Metro:**
- Manhattan, Brooklyn, Queens, Bronx, Staten Island, Newark, Jersey City, Bayonne

**Detroit Metro:**
- Detroit, Dearborn, Livonia, Troy, Southfield, Warren

## Documentation

- `scripts/send-targeted-sms.ts` - Main SMS blast tool
- `scripts/sms-onboarding-tracker.md` - Manual/automated tracking guide
- `lib/smsBlast.ts` - Existing SMS infrastructure for lead notifications

## Help

Run `npx tsx scripts/send-targeted-sms.ts --help` for full documentation.
