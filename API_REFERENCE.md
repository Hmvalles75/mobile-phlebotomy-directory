# API Reference

Complete reference for all API endpoints in the Mobile Phlebotomy platform.

---

## Base URL

- **Development**: `http://localhost:3002`
- **Production**: `https://mobilephlebotomy.org`

---

## Lead Management

### Submit Lead

Submit a new lead request from a patient.

**Endpoint**: `POST /api/leads/submit`

**Request Body**:
```json
{
  "fullName": "John Doe",
  "phone": "5551234567",
  "email": "john@example.com",
  "city": "Los Angeles",
  "state": "CA",
  "zip": "90001",
  "urgency": "STANDARD",
  "insuranceProvider": "Blue Cross",
  "notes": "Morning appointment preferred",
  "callTrackingNumber": "+15551234567"
}
```

**Required Fields**: `fullName`, `phone`, `city`, `state`, `zip`

**Optional Fields**: `email`, `urgency`, `insuranceProvider`, `notes`, `callTrackingNumber`

**Response**:
```json
{
  "success": true,
  "leadId": "cm1234567890",
  "message": "Lead submitted successfully"
}
```

**Behavior**:
- Determines STAT vs STANDARD urgency (STAT costs $30, STANDARD costs $20)
- Finds providers serving the ZIP code
- Deducts lead credit from each matched provider
- Sends email notification to matched providers
- Tracks call if `callTrackingNumber` provided

---

## Provider Management

### Claim Provider Account

Allows a provider to claim their listing.

**Endpoint**: `POST /api/providers/claim`

**Request Body**:
```json
{
  "providerId": "cm123",
  "contactName": "Jane Smith",
  "contactEmail": "jane@mobilephlebotomy.com",
  "contactPhone": "5559876543",
  "message": "I am the owner of this business"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Claim submitted successfully. You'll receive an email within 24 hours."
}
```

**Behavior**:
- Updates provider status to 'PENDING'
- Sends email to admin for verification
- Sends confirmation email to claimant

---

### Purchase Lead Credits

Provider purchases additional lead credits.

**Endpoint**: `POST /api/providers/purchase-credits`

**Request Body**:
```json
{
  "providerId": "cm123",
  "quantity": 25
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

**Behavior**:
- Creates Stripe Checkout session
- Stores pending purchase in metadata
- Redirects to Stripe payment page
- Credits added via webhook after successful payment

---

### Subscribe to Featured Tier

Provider subscribes to featured placement.

**Endpoint**: `POST /api/providers/subscribe-featured`

**Request Body**:
```json
{
  "providerId": "cm123",
  "tier": "MEDIUM"
}
```

**Tiers**: `SMALL`, `MEDIUM`, `LARGE`

**Response**:
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

**Behavior**:
- Creates Stripe subscription checkout
- Updates provider tier via webhook
- Featured providers appear at top of search results

---

### Update Service Areas

Provider updates their service coverage.

**Endpoint**: `POST /api/providers/update-service-areas`

**Request Body**:
```json
{
  "providerId": "cm123",
  "zipCodes": "90001,90002,90003,90210",
  "cities": "Los Angeles,Beverly Hills,Santa Monica",
  "states": "CA"
}
```

**Response**:
```json
{
  "success": true,
  "provider": { /* updated provider object */ }
}
```

---

### Update Phone Settings

Provider updates their contact phone number.

**Endpoint**: `POST /api/providers/update-phone`

**Request Body**:
```json
{
  "providerId": "cm123",
  "phone": "5551234567",
  "receiveTextAlerts": true
}
```

**Response**:
```json
{
  "success": true,
  "provider": { /* updated provider object */ }
}
```

---

## Telephony (Twilio Webhooks)

### Voice Call Webhook

Handles incoming calls to tracking numbers.

**Endpoint**: `POST /api/telephony/voice`

**Request Body** (from Twilio):
```
CallSid=CA1234567890
From=+15551234567
To=+18005551234
CallStatus=ringing
```

**Response**: TwiML XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. Connecting you now.</Say>
  <Dial>+15559876543</Dial>
</Response>
```

**Behavior**:
- Looks up tracking number in database
- Creates CallLog record
- Forwards call to provider's actual phone
- Tracks call duration and outcome

---

### Call Status Webhook

Tracks call completion and duration.

**Endpoint**: `POST /api/telephony/status`

**Request Body** (from Twilio):
```
CallSid=CA1234567890
CallStatus=completed
CallDuration=245
```

**Response**:
```json
{
  "success": true
}
```

**Behavior**:
- Updates CallLog with final status
- Records call duration
- Used for analytics

---

### SMS Webhook

Handles incoming SMS to tracking numbers.

**Endpoint**: `POST /api/telephony/sms`

**Request Body** (from Twilio):
```
MessageSid=SM1234567890
From=+15551234567
To=+18005551234
Body=Hi, I'd like to schedule a blood draw
```

**Response**: TwiML XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message. We'll respond shortly!</Message>
</Response>
```

**Behavior**:
- Forwards SMS to provider's phone
- Sends auto-reply to patient
- Logs message for tracking

---

## Payment Processing (Stripe Webhooks)

### Stripe Webhook

Handles all Stripe events.

**Endpoint**: `POST /api/stripe/webhook`

**Headers**:
```
Stripe-Signature: t=1234567890,v1=signature...
```

**Events Handled**:

#### `checkout.session.completed`
- Payment successful
- Adds lead credits or activates subscription
- Updates provider record

#### `customer.subscription.created`
- New subscription started
- Updates provider featured tier

#### `customer.subscription.updated`
- Subscription tier changed
- Updates provider tier

#### `customer.subscription.deleted`
- Subscription cancelled
- Reverts provider to NONE tier

#### `invoice.payment_succeeded`
- Recurring payment successful
- Extends subscription period

#### `invoice.payment_failed`
- Payment failed
- Notifies provider
- May downgrade tier after grace period

**Response**:
```json
{
  "received": true
}
```

---

## Google Analytics Events

The platform tracks custom GA4 events. These are client-side events sent via `lib/ga4.ts`.

### Lead Form Events

```javascript
// Lead form opened
ga4.leadFormOpen({ city, state, zip })

// Lead form submitted
ga4.leadFormSubmit({ city, state, zip, urgency })
```

### Call Tracking Events

```javascript
// Call Now button clicked
ga4.callClick({ source: 'homepage_hero', city, state, zip })

// Mobile sticky CTA clicked
ga4.mobileStickyCTAClick({ cta_type: 'call' })
```

### Provider Events

```javascript
// Provider card viewed
ga4.providerView({ provider_id, provider_name, city, state })

// Provider contacted
ga4.providerContact({ provider_id, provider_name, method: 'phone' })
```

---

## Testing with cURL

### Submit a Lead
```bash
curl -X POST http://localhost:3002/api/leads/submit \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phone": "5551234567",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "urgency": "STANDARD"
  }'
```

### Claim a Provider
```bash
curl -X POST http://localhost:3002/api/providers/claim \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "cm123",
    "contactName": "Jane Smith",
    "contactEmail": "jane@example.com",
    "contactPhone": "5559876543"
  }'
```

### Test Stripe Webhook (use Stripe CLI)
```bash
stripe listen --forward-to localhost:3002/api/stripe/webhook
stripe trigger checkout.session.completed
```

### Test Twilio Webhook (use ngrok)
```bash
ngrok http 3002
# Update Twilio webhook URL to: https://your-ngrok-url.ngrok.io/api/telephony/voice
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "details": "Additional technical details (only in development)"
}
```

**HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

**Not currently implemented**, but recommended for production:

- Lead submission: 5 requests per hour per IP
- Provider claim: 3 requests per hour per IP
- General API: 100 requests per hour per IP

Consider implementing with Vercel Edge Config or Upstash Redis.

---

## Database Schema

Key models referenced in API responses:

### Provider
```typescript
{
  id: string
  name: string
  slug: string
  phone: string | null
  email: string | null
  website: string | null
  city: string | null
  state: string | null
  zipCodes: string | null  // Comma-separated
  leadCredit: number
  featuredTier: 'NONE' | 'SMALL' | 'MEDIUM' | 'LARGE'
  status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}
```

### Lead
```typescript
{
  id: string
  fullName: string
  phone: string
  email: string | null
  city: string
  state: string
  zip: string
  urgency: 'STANDARD' | 'STAT'
  insuranceProvider: string | null
  notes: string | null
  priceCents: number
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  createdAt: DateTime
}
```

### CallLog
```typescript
{
  id: string
  callSid: string
  trackingNumber: string
  fromNumber: string
  toNumber: string
  duration: number | null
  status: string
  recordingUrl: string | null
  createdAt: DateTime
}
```

---

## Webhook Testing Tools

### Stripe CLI
```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Listen to webhooks
stripe listen --forward-to localhost:3002/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### Twilio CLI
```bash
# Install
npm install -g twilio-cli

# Login
twilio login

# Test voice webhook
twilio api:core:calls:create \
  --from "+15551234567" \
  --to "+18005551234" \
  --url "http://localhost:3002/api/telephony/voice"
```

### Ngrok (for local Twilio testing)
```bash
# Install
brew install ngrok

# Start tunnel
ngrok http 3002

# Use the HTTPS URL in Twilio webhook configuration
```

---

## Security Notes

1. **Webhook Signature Verification**
   - All Stripe webhooks verify signature
   - Twilio webhooks validate request origin
   - Never disable signature verification in production

2. **Environment Variables**
   - All API keys stored in environment variables
   - Never expose secrets in client-side code
   - Rotate keys every 90 days

3. **Input Validation**
   - All endpoints validate input using Zod schemas
   - Phone numbers sanitized before storage
   - ZIP codes validated for format

4. **SQL Injection Prevention**
   - Using Prisma ORM (parameterized queries)
   - No raw SQL queries

---

**Last Updated**: January 2025
