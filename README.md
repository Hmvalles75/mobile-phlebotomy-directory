# MobilePhlebotomy.org — LeadGen

A lead-generation directory connecting patients to **verified** mobile phlebotomists. Patients start with us; providers receive leads by SMS/email after verification and prepayment (credits) or subscription (Featured).

## Runbook
- **Modes**
  - `SILENT_MODE=true`: collect leads, notify admin only. No routing.
  - `SILENT_MODE=false`: auto-route to VERIFIED providers with credits.
- **Lead Pricing (default)**
  - STANDARD: $15–$20 (configurable)
  - STAT: $35–$50 (configurable)
- **Featured Tiers**
  - SMALL $99/mo · MEDIUM $249/mo · LARGE $499/mo (Stripe Prices)
- **Routing Order**
  1. VERIFIED with coverage ZIPs
  2. Featured first
  3. Most recently active
  4. Else: hold + email ADMIN to recruit

## Compliance & Positioning
- Public site shows a **directory disclaimer**:
  > Directory of publicly listed mobile phlebotomy services. Not all providers are verified. We connect verified providers with patient requests.
- Unverified pages:
  - ⚠️ "Unverified Listing" badge
  - No public email; phone may show with disclaimer
  - "Report this listing" link
- Verified pages:
  - ✅ "Verified Provider" badge
  - Lead form + tracked call enabled
- **PHI Minimization**: Collect only what's needed to book (name, phone, city/state/ZIP, urgency, optional notes). No lab results.
- **HIPAA Note**: We are a marketing/lead-gen platform. We are **not** a covered entity or business associate unless we sign BAAs and handle PHI on behalf of providers. Default posture: **no BAAs**, no storage of medical records, use transport-only notifications, encrypt at rest.

## Environment
- Vercel env:
  - `SILENT_MODE` (true/false)
  - `PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA4_ID`
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Tier Price IDs
  - Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`
  - Email: `SENDGRID_API_KEY`, `LEAD_EMAIL_FROM`, `ADMIN_EMAIL`

## Data Retention
- Leads: 18 months (auto purge task)
- Call recordings: 90 days (optional, can disable recording)
- Corrections/Abuse reports: 24 months

## Incident Playbook
- Provider complaint → Remove/mark Unverified immediately, respond within 24h.
- Incorrect info → Update via "Corrections" queue.
- Data request (CCPA/GDPR) → export or delete on verified ownership email.

## Deploy Checklist
- Set all env vars
- Verify Stripe webhook secrets
- Twilio webhooks → `/api/telephony/voice` + `/api/telephony/status`
- GA4 events firing
- `SILENT_MODE=true` for first deploy; flip when ready

## Project Structure

### Core Technologies
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe (credits & subscriptions)
- **Communications**: Twilio (SMS/Voice) + SendGrid (email)
- **Analytics**: Google Analytics 4

### Key Features
1. **Provider Directory**: Public listings with verification badges
2. **Lead Generation**: Patient intake forms with smart routing
3. **Credit System**: Pay-per-lead model with Stripe integration
4. **Featured Listings**: Subscription tiers for premium placement
5. **Call Tracking**: Twilio-powered call forwarding with recordings
6. **Admin Dashboard**: Lead management and provider verification

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev

# Open Prisma Studio
npx prisma studio
```

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure Stripe webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Configure Twilio webhooks:
   - Voice: `https://yourdomain.com/api/telephony/voice`
   - Status: `https://yourdomain.com/api/telephony/status`
5. Deploy with `SILENT_MODE=true` initially
6. Test lead flow end-to-end
7. Flip `SILENT_MODE=false` to enable live routing

### Database
- Production: Vercel Postgres or similar PostgreSQL provider
- Run migrations: `npx prisma migrate deploy`
- Seed initial data if needed: `npx prisma db seed`

## API Routes

### Public
- `POST /api/lead/submit` - Submit patient lead
- `POST /api/providers/report` - Report incorrect provider info
- `GET /api/providers` - List providers (with filters)
- `GET /api/autocomplete` - Search autocomplete

### Provider Dashboard
- `POST /api/providers/claim` - Claim provider listing
- `POST /api/providers/verify` - Verify ownership
- `POST /api/providers/coverage` - Update ZIP coverage
- `GET /api/providers/dashboard` - Dashboard data

### Webhooks
- `POST /api/webhooks/stripe` - Stripe events (payments, subscriptions)
- `POST /api/telephony/voice` - Twilio voice webhook
- `POST /api/telephony/status` - Twilio call status

### Admin
- `POST /api/admin/retention` - Data retention cron job

## Email Templates

### Patient Emails
- Lead confirmation
- Provider match notification

### Provider Emails
- Claim receipt with verification link
- Verification success welcome
- New lead notification (SMS + email)
- Credits depleted warning
- Featured listing activated

### Admin Emails
- New lead (when SILENT_MODE=true)
- Provider correction report
- System alerts

## Analytics Events (GA4)

### Patient Journey
- `lead_form_start` - User opens lead form
- `lead_form_submit` - Lead submitted successfully
- `provider_view` - Provider detail page view
- `call_click` - User clicks call button

### Provider Actions
- `claim_click` - Provider clicks "Claim listing"
- `verify_complete` - Provider verification complete
- `credit_purchase` - Provider buys credits
- `featured_subscribe` - Provider subscribes to Featured

### Admin
- `report_click` - User clicks "Report listing"
- `report_submit` - Correction report submitted
- `policy_view` - Privacy/Terms page view

## Security & Compliance

### Data Protection
- All data encrypted at rest and in transit
- Minimal PHI collection (name, phone, location only)
- No storage of medical records or lab results
- Access control on all provider/admin routes

### HIPAA Considerations
- Platform is NOT a covered entity or business associate
- No BAAs signed by default
- Providers handle all protected health information
- Clear disclaimers on all public pages

### User Rights (CCPA/GDPR)
- Data access requests: Email privacy@mobilephlebotomy.org
- Data deletion: Automated upon verified request
- Opt-out: Unsubscribe links in all emails

## Monitoring

### Key Metrics
- Lead conversion rate (form submit → provider match)
- Provider response time (lead delivered → first contact)
- Credit utilization rate
- Featured vs. Standard conversion comparison
- Call tracking analytics

### Alerts
- Failed Stripe payments
- Twilio delivery failures
- Database connection issues
- Unusual traffic patterns

## Support

- **General**: support@mobilephlebotomy.org
- **Privacy**: privacy@mobilephlebotomy.org
- **Provider Issues**: providers@mobilephlebotomy.org
- **Technical**: See GitHub Issues

## License

Proprietary - All rights reserved
