# Lead Email Notifications - Implementation Guide

## Overview

This document describes the **Provider Email Notifications** feature (Phase 1) that automatically notifies **Featured providers only** when new leads are created in their service area.

## Goal

When a new lead is created via the web form, automatically email matching featured providers so they don't have to constantly check the dashboard for new opportunities.

## Phase 1 Scope - Featured Providers Only

- ✅ Email notifications sent to **Featured providers only** (providers with `isFeatured = true`)
- ✅ Non-featured providers receive **NO email notifications** in Phase 1
- ✅ SMS blast continues to work for all eligible providers (existing system)
- ✅ Email notifications run in parallel with SMS blast (both trigger on lead creation)
- ✅ Basic logging tracks which providers were notified and whether emails succeeded or failed

## Architecture

### Database Changes

#### New Provider Fields
```sql
-- Added to providers table
notificationEmail  String?   -- Override email for notifications (defaults to claimEmail or email)
notifyEnabled      Boolean   -- Allow providers to opt-out (default: true)
```

#### New Table: lead_notifications
```sql
CREATE TABLE lead_notifications (
  id              String PRIMARY KEY,
  leadId          String NOT NULL,      -- FK to leads.id
  providerId      String NOT NULL,      -- FK to providers.id
  channel         String DEFAULT 'email',
  status          NotificationStatus,   -- QUEUED, SENT, FAILED
  errorMessage    String?,
  createdAt       DateTime,
  updatedAt       DateTime,
  sentAt          DateTime?
);

CREATE INDEX idx_lead_notifications_lead ON lead_notifications(leadId);
CREATE INDEX idx_lead_notifications_provider ON lead_notifications(providerId);
```

### Code Structure

#### Core Files

1. **`lib/leadNotifications.ts`** - Main notification logic
   - `notifyFeaturedProvidersForLead(leadId)` - Main function called from API
   - `findFeaturedProvidersForNotification()` - Matching logic
   - `sendProviderLeadNotificationEmail()` - Email sending
   - `notifyFeaturedProvidersForLeadDryRun()` - Testing without sending

2. **`app/api/lead/submit/route.ts`** - Lead creation endpoint
   - Triggers email notifications after lead creation
   - Fire-and-forget async pattern (doesn't block response)

3. **`prisma/schema.prisma`** - Database schema
   - Provider notification fields
   - LeadNotification model
   - NotificationStatus enum

4. **`scripts/test-lead-notifications.ts`** - Testing script
   - Create test leads
   - Run dry-run mode
   - Send actual notifications

## Provider Matching Logic

### Criteria for Featured Provider Notifications

A provider receives an email notification if ALL conditions are met:

1. **Featured Status**: `isFeatured = true`
2. **Notifications Enabled**: `notifyEnabled = true` (default)
3. **Has Email**: `notificationEmail OR claimEmail OR email` is not null
4. **Geographic Match**: Provider's service area includes the lead location

### Geographic Matching

Providers match a lead if ANY of these are true:

1. **State Coverage**: Provider's `coverage` relation includes the lead's state
2. **ZIP Code Match**: Provider's `zipCodes` field includes the lead's ZIP:
   - Exact match: `"10001"` matches lead ZIP `"10001"`
   - Wildcard match: `"100*"` matches `"10001"`, `"10002"`, etc.
   - Range match: `"10001-10010"` matches any ZIP in that range

### Example

```typescript
// Lead created in NYC
Lead: { city: "New York", state: "NY", zip: "10001", urgency: "STANDARD" }

// CMB Group provider
Provider: {
  isFeatured: true,
  notifyEnabled: true,
  claimEmail: "dr.barrera@cmbgroup.com",
  zipCodes: "10001,10002,10003,..." // 271 NYC/NJ ZIPs
  coverage: [{ state: { abbr: "NY" } }, { state: { abbr: "NJ" } }]
}

Result: ✅ Notification sent
```

## Email Content

### Subject Line
```
New mobile phlebotomy request in your area
```

### Plain Text Body
```
Hi {{providerName}},

A new mobile phlebotomy request may match your coverage area.

Location: {{leadCity}}, {{leadState}} {{leadZip}}
Request type: Individual
Urgency: {{leadUrgency}}
Notes: {{leadNotesShort}}

Review the request here:
{{dashboardUrl}}

No action is required if you're unavailable.

— MobilePhlebotomy.org
```

### HTML Body
Clean, professional email with:
- Blue header with white text
- Request details in a white card
- Blue "Review Request" button linking to dashboard
- Footer with MobilePhlebotomy.org branding

### Privacy & Safety
- ❌ NO patient full name included
- ❌ NO patient phone number included
- ❌ NO patient email included
- ❌ NO medical details beyond generic notes (truncated to 200 chars)
- ✅ Dashboard link requires provider authentication to view full details

## Environment Variables

### Required
```bash
# SendGrid API Key (already used in project)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# From email address (already used in project)
LEAD_EMAIL_FROM="MobilePhlebotomy.org <noreply@mobilephlebotomy.org>"

# Site URL for dashboard links
NEXT_PUBLIC_SITE_URL=https://mobilephlebotomy.org
```

### Testing (Optional)
```bash
# Set EMAIL_DRY_RUN=true to log emails without sending
EMAIL_DRY_RUN=true
```

## Testing

### 1. Dry Run Mode (No Emails Sent)

```bash
# Run the test script without sending emails
npx tsx scripts/test-lead-notifications.ts [leadId]
```

This will:
- Show which providers would be notified
- Display email addresses that would receive notifications
- NOT create notification records in database
- NOT send any actual emails

### 2. Send Test Notification

```bash
# First, ensure env vars are set
export SENDGRID_API_KEY=your_key
export LEAD_EMAIL_FROM="MobilePhlebotomy.org <noreply@mobilephlebotomy.org>"

# Create a test lead
npx tsx scripts/test-lead-notifications.ts

# This will output a lead ID, then run:
npx tsx scripts/test-lead-notifications.ts clxxxxxxxxxxxxxx
```

### 3. Test via API

```bash
# Submit a real lead via the API (triggers notifications automatically)
curl -X POST http://localhost:3000/api/lead/submit \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Patient",
    "phone": "555-123-4567",
    "email": "test@example.com",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "urgency": "STANDARD",
    "notes": "Test lead"
  }'
```

### 4. Verify Notifications

Check the `lead_notifications` table:

```sql
SELECT
  ln.*,
  p.name as provider_name,
  l.city,
  l.state,
  l.zip
FROM lead_notifications ln
JOIN providers p ON ln.providerId = p.id
JOIN leads l ON ln.leadId = l.id
ORDER BY ln.createdAt DESC
LIMIT 10;
```

## Admin Tasks

### Enable Featured Status for a Provider

```sql
-- Enable featured status
UPDATE providers
SET isFeatured = true
WHERE id = 'provider_id_here';

-- Set custom notification email (optional)
UPDATE providers
SET notificationEmail = 'custom@email.com'
WHERE id = 'provider_id_here';
```

### Disable Notifications for a Provider

```sql
UPDATE providers
SET notifyEnabled = false
WHERE id = 'provider_id_here';
```

### View Notification Statistics

```sql
-- Notification success rate by provider
SELECT
  p.name,
  p.id,
  COUNT(*) as total_notifications,
  SUM(CASE WHEN ln.status = 'SENT' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN ln.status = 'FAILED' THEN 1 ELSE 0 END) as failed
FROM providers p
JOIN lead_notifications ln ON p.id = ln.providerId
GROUP BY p.id, p.name
ORDER BY total_notifications DESC;

-- Recent notification failures
SELECT
  ln.createdAt,
  p.name as provider,
  l.city,
  l.state,
  ln.errorMessage
FROM lead_notifications ln
JOIN providers p ON ln.providerId = p.id
JOIN leads l ON ln.leadId = l.id
WHERE ln.status = 'FAILED'
ORDER BY ln.createdAt DESC
LIMIT 20;
```

## Flow Diagram

```
1. User submits lead via web form
   ↓
2. API creates lead in database
   ↓
3. API returns success immediately (doesn't wait for notifications)
   ↓
4. [ASYNC] Email notification system:
   - Find featured providers in lead's area
   - For each matching provider:
     * Create notification record (status=QUEUED)
     * Attempt to send email via SendGrid
     * Update record (status=SENT or FAILED)
   ↓
5. [ASYNC] SMS blast system (existing):
   - Send SMS to all eligible providers
   ↓
6. Provider receives email notification
   ↓
7. Provider clicks "Review Request" button
   ↓
8. Provider logs into dashboard
   ↓
9. Provider views lead details and can claim
```

## Error Handling

### Email Send Failures

- If SendGrid API call fails, the notification record is marked as `FAILED`
- Error message is stored in `errorMessage` field
- Lead creation succeeds regardless of notification failures
- Failed notifications do NOT block the user's lead submission

### Missing Configuration

- If `SENDGRID_API_KEY` is missing:
  - Notification is marked as FAILED with error "Missing API key"
  - Error is logged to console
  - Lead creation still succeeds

- If provider has no email:
  - Provider is skipped (no notification record created)
  - Error is logged to console

### Graceful Degradation

The notification system is designed to never block lead creation:

```typescript
// Fire-and-forget pattern
notifyFeaturedProvidersForLead(lead.id).catch(err => {
  console.error('Featured provider email notifications failed:', err)
  // Lead is already created and returned to user
})
```

## Future Enhancements (Not in Phase 1)

- ❌ Notifications for non-featured providers
- ❌ SMS notifications (already exists separately)
- ❌ Push notifications
- ❌ Provider acceptance/claiming via email
- ❌ Response time tracking
- ❌ Notification preferences UI in provider dashboard
- ❌ Digest emails (batch notifications)
- ❌ Notification scheduling/throttling

## Files Changed

### New Files
- `lib/leadNotifications.ts` - Core notification logic
- `scripts/test-lead-notifications.ts` - Testing script
- `LEAD_NOTIFICATIONS_GUIDE.md` - This documentation

### Modified Files
- `prisma/schema.prisma` - Added fields and LeadNotification model
- `app/api/lead/submit/route.ts` - Added notification trigger

### Database Migrations
- Added `notificationEmail` and `notifyEnabled` to `providers` table
- Created `lead_notifications` table
- Created `NotificationStatus` enum

## Confirmation Checklist

✅ Email notifications sent to **featured providers only** (Phase 1)
✅ Non-featured providers do **NOT** receive email notifications
✅ Matching logic uses state/ZIP coverage (no heavy geocoding)
✅ Provider has `isFeatured = true` flag in database
✅ Provider has `notifyEnabled = true` (default, can opt-out)
✅ Notifications logged in `lead_notifications` table
✅ Email sending uses existing SendGrid setup
✅ Patient privacy protected (no PII in emails)
✅ Lead creation never blocked by notification failures
✅ Test script provided for dev verification
✅ Dry-run mode available (no actual sends)
✅ Dashboard link included in email
✅ Email uses professional HTML template

## Support

For issues or questions about the notification system:

1. Check the `lead_notifications` table for delivery status
2. Review server logs for error messages
3. Run the test script in dry-run mode to verify matching
4. Verify environment variables are set correctly
5. Check SendGrid dashboard for delivery logs
