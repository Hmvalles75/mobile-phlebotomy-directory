# SMS Compliance System Documentation

This document describes the Twilio SMS automation system for patient qualification and provider routing.

**CRITICAL COMPLIANCE REQUIREMENT**: Only providers who have EXPLICITLY opted in via the onboarding flow may receive lead/claim SMS. Scraped providers or providers without explicit SMS consent must NEVER receive automated SMS.

## System Overview

The SMS system handles two distinct flows:

1. **Patient Qualification Flow** - Confirm intent and collect details from patients who submit web forms
2. **Provider Routing Flow** - Route qualified leads to opted-in providers via SMS

## Database Schema Changes

### Provider Fields (Compliance-Critical)

```
source              ProviderSource    - SCRAPED | SELF_SIGNUP | ADMIN_CREATED
onboardingToken     String?           - Secure token for onboarding link
onboardingStatus    OnboardingStatus  - NOT_INVITED | INVITED | STARTED | ACTIVE
onboardingInvitedAt DateTime?         - When invite was sent
onboardingCompletedAt DateTime?       - When onboarding completed
termsAcceptedAt     DateTime?         - Legal compliance timestamp
smsOptInAt          DateTime?         - REQUIRED for SMS eligibility
smsOptOutAt         DateTime?         - If set, provider has opted out
```

### Lead Status Flow

```
NEW                    → Web form submitted
AWAITING_CONFIRM       → Confirmation SMS sent to patient
CONFIRMED              → Patient replied "1" to confirm
COLLECTING_DETAILS     → Collecting ZIP/time/notes from patient
QUALIFIED              → Patient fully qualified, ready for routing
ROUTING                → Currently being offered to providers
CLAIMED                → Provider claimed the lead
SCHEDULED              → Appointment scheduled
COMPLETED              → Service completed
NEEDS_COVERAGE         → No opted-in providers available
CLOSED_UNCONFIRMED     → Patient didn't respond (24hr timeout)
CLOSED_PRICING_ONLY    → Patient only wanted pricing info
```

## Provider Eligibility Requirements

A provider can ONLY receive lead SMS if ALL of these are true:

1. `eligibleForLeads = true` (account activated)
2. `smsOptInAt != null` (explicitly consented to SMS)
3. `smsOptOutAt = null` (has not opted out)
4. `onboardingStatus = 'ACTIVE'` (completed onboarding)
5. `phonePublic != null` (has SMS-capable phone)
6. Within service radius of lead's ZIP code

## Key Files

### Patient SMS Flow
- `lib/patientSmsFlow.ts` - Patient qualification state machine
- `app/api/twilio/inbound/route.ts` - Twilio webhook handler

### Provider Routing
- `lib/optedInRouting.ts` - Compliance-first provider routing
- Creates `DispatchTask` when no opted-in providers available

### Provider Onboarding
- `app/provider/onboard/page.tsx` - Onboarding UI with SMS consent
- `app/api/provider/onboard/route.ts` - Onboarding API

### Admin Tools
- `app/api/admin/providers/[id]/invite/route.ts` - Send invitation email

### Cron Jobs
- `app/api/cron/lead-followups/route.ts` - Automated lead lifecycle management

## API Endpoints

### POST /api/admin/providers/:id/invite
Sends onboarding invitation email to a provider. **Email only by default.**

Request: Admin auth required
Response:
```json
{
  "ok": true,
  "message": "Invitation sent successfully",
  "provider": {
    "id": "...",
    "name": "...",
    "email": "...",
    "onboardingStatus": "INVITED"
  }
}
```

### GET /api/provider/onboard?token=...
Validates onboarding token and returns provider data.

### POST /api/provider/onboard
Completes onboarding with explicit SMS consent.

Request body:
```json
{
  "token": "...",
  "email": "...",
  "phone": "...",
  "zipCodes": "90210, 90211",
  "serviceRadiusMiles": 25,
  "smsConsent": true,   // REQUIRED
  "termsAccepted": true // REQUIRED
}
```

### POST /api/twilio/inbound
Twilio webhook for inbound SMS. Routes to patient or provider handler.

### POST /api/cron/lead-followups
Automated lead lifecycle management. Recommended schedule: every 30 minutes.

Actions:
- Send reminders to patients awaiting confirmation (4+ hours)
- Close unconfirmed leads (24 hour timeout or 3+ SMS)
- Close stale detail-collection leads (6 hour timeout)
- Route qualified leads to providers
- Escalate stale routing situations (2+ hours with no claim)

## SMS Templates

### Patient Messages (patientSmsFlow.ts)

```
PATIENT_CONFIRM:
"MobilePhlebotomy.org: We got your request in {city}. Reply 1 to schedule today/tomorrow. Reply 2 if you're just pricing. Reply STOP to opt out."

PATIENT_COLLECT_DETAILS:
"Great! Reply with your ZIP code and preferred time window, e.g. '91773 tomorrow 9-12'"

PATIENT_QUALIFIED:
"Thanks! We're finding an available mobile phlebotomist in your area now. You'll hear back soon."

PATIENT_PROVIDER_ASSIGNED:
"Great news! {providerName} will contact you shortly to schedule your appointment."
```

### Provider Messages (optedInRouting.ts)

```
PROVIDER_CLAIM_OFFER:
"New CONFIRMED request: ZIP {zip}, Time: {timeWindow}, Notes: {notes}. Reply YES to claim."

(After claim):
"Lead claimed! Patient in {city}, {state}. Phone: {phone}. Please contact them within 30 minutes."
```

## Testing Scenarios

### 1. Patient Qualification Flow

```
1. Patient submits web form
2. Patient receives confirmation SMS
3. Patient replies "1"
4. Patient receives details collection SMS
5. Patient provides time window
6. Patient receives notes collection SMS
7. Patient provides notes or "none"
8. Patient receives qualified confirmation
```

### 2. Provider Claim Flow

```
1. Lead becomes QUALIFIED
2. System finds opted-in providers within radius
3. Up to 3 closest providers receive claim SMS
4. First provider to reply YES claims the lead
5. Patient receives provider assigned notification
6. Lead status becomes CLAIMED
```

### 3. Coverage Gap Flow

```
1. Lead becomes QUALIFIED
2. No opted-in providers found within radius
3. DispatchTask created with reason: NO_OPTED_IN_PROVIDERS
4. Lead status becomes NEEDS_COVERAGE
5. Patient receives "still looking" message
6. Admin notified via email
```

### 4. Provider Onboarding Flow

```
1. Admin sends invite via POST /api/admin/providers/:id/invite
2. Provider receives email with onboarding link
3. Provider clicks link, sees pre-filled info
4. Provider updates contact info and service area
5. Provider checks SMS consent checkbox (REQUIRED)
6. Provider accepts terms of service
7. Provider submits - now eligible for leads
```

## Cron Job Setup (Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/lead-followups",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/onboarding-followup",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

Set `CRON_SECRET` environment variable for authentication.

## Environment Variables

```
# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=...
TWILIO_NUMBER=+1...

# SendGrid (for emails)
SENDGRID_API_KEY=...
LEAD_EMAIL_FROM=leads@mobilephlebotomy.org

# Admin
ADMIN_EMAIL=admin@mobilephlebotomy.org

# Cron
CRON_SECRET=...

# Site
PUBLIC_SITE_URL=https://mobilephlebotomy.org
```

## Compliance Checklist

- [ ] Never SMS providers who haven't completed onboarding
- [ ] Never SMS providers without smsOptInAt timestamp
- [ ] Respect smsOptOutAt - never SMS opted-out providers
- [ ] Log all SMS events to SmsEvent table for audit trail
- [ ] Include STOP instructions in patient SMS
- [ ] Create DispatchTask for coverage gaps instead of SMS-ing non-opted providers
- [ ] Store termsAcceptedAt timestamp for legal compliance
- [ ] Validate Twilio signature in production

## Idempotency

The system uses `twilioSid` (Twilio's unique message ID) to prevent duplicate processing:

```sql
CREATE UNIQUE INDEX ON sms_events(twilioSid);
```

Inbound webhook checks for existing `twilioSid` before processing.

## Lead Claiming Race Condition

Provider claiming uses a Prisma transaction with optimistic locking:

```typescript
await prisma.$transaction(async (tx) => {
  const currentLead = await tx.lead.findUnique({ where: { id: lead.id } })
  if (currentLead?.status !== LeadStatus.ROUTING) {
    throw new Error('Lead already claimed')
  }
  await tx.lead.update({
    where: { id: lead.id },
    data: { status: LeadStatus.CLAIMED, routedToId: provider.id }
  })
})
```

This ensures only one provider can claim a lead even with concurrent responses.
