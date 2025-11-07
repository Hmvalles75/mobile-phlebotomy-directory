# Deployment Guide

This guide covers setting up external services and deploying your mobile phlebotomy platform to production.

## Prerequisites

- Vercel account (for hosting)
- Stripe account (for payments)
- Twilio account (for phone tracking)
- SendGrid account (for transactional emails)
- GitHub repository (for deployment)

---

## 1. Stripe Setup

### Create Stripe Account
1. Sign up at https://stripe.com
2. Complete business verification
3. Enable Live mode (initially use Test mode for testing)

### Create Products & Prices

#### Lead Credit Packages
Create three one-time payment products:

1. **10 Lead Credits**
   - Product Name: "10 Lead Credits"
   - Price: $200 USD
   - Type: One-time payment
   - Copy the Price ID → Use for checkout button

2. **25 Lead Credits** (Most Popular)
   - Product Name: "25 Lead Credits"
   - Price: $475 USD
   - Type: One-time payment
   - Copy the Price ID

3. **50 Lead Credits**
   - Product Name: "50 Lead Credits"
   - Price: $900 USD
   - Type: One-time payment
   - Copy the Price ID

#### Featured Provider Subscriptions
Create three recurring subscription products:

1. **Featured Small Tier**
   - Product Name: "Featured Provider - Small"
   - Price: $99/month USD
   - Type: Recurring subscription
   - Billing: Monthly
   - Copy Price ID → `STRIPE_PRICE_FEATURED_SMALL`

2. **Featured Medium Tier**
   - Product Name: "Featured Provider - Medium"
   - Price: $249/month USD
   - Type: Recurring subscription
   - Billing: Monthly
   - Copy Price ID → `STRIPE_PRICE_FEATURED_MED`

3. **Featured Large Tier**
   - Product Name: "Featured Provider - Large"
   - Price: $499/month USD
   - Type: Recurring subscription
   - Billing: Monthly
   - Copy Price ID → `STRIPE_PRICE_FEATURED_LARGE`

### Configure Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Get API Keys

1. Go to Stripe Dashboard → Developers → API keys
2. Copy **Secret key** → `STRIPE_SECRET_KEY`
   - Use test key (starts with `sk_test_`) for development
   - Use live key (starts with `sk_live_`) for production

---

## 2. Twilio Setup

### Create Twilio Account
1. Sign up at https://www.twilio.com
2. Verify your business information
3. Add billing information

### Purchase Phone Numbers

You'll need phone numbers for:
- **Default tracking number** (shown on homepage/listings)
- **City-specific numbers** (optional, for better tracking)

To purchase:
1. Go to Phone Numbers → Buy a number
2. Search by area code or location
3. Select a number with Voice + SMS capabilities
4. Purchase the number
5. Copy the phone number → Add to `CityNumber` table in database

### Configure Webhooks

For each phone number:
1. Go to Phone Numbers → Manage → Active numbers
2. Click on the phone number
3. Under "Voice Configuration":
   - A CALL COMES IN: Webhook
   - URL: `https://yourdomain.com/api/telephony/voice`
   - HTTP POST
4. Under "Messaging Configuration":
   - A MESSAGE COMES IN: Webhook
   - URL: `https://yourdomain.com/api/telephony/sms`
   - HTTP POST

### Get API Credentials

1. Go to Console → Account Info
2. Copy **Account SID** → `TWILIO_ACCOUNT_SID`
3. Copy **Auth Token** → `TWILIO_AUTH_TOKEN`
4. (Optional) Create Messaging Service:
   - Go to Messaging → Services
   - Create new service
   - Add phone numbers to service
   - Copy **Messaging Service SID** → `TWILIO_MESSAGING_SERVICE_SID`

---

## 3. SendGrid Setup

### Create SendGrid Account
1. Sign up at https://sendgrid.com
2. Complete Sender Authentication

### Sender Verification

**Option A: Single Sender Verification (Easier)**
1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter email: `noreply@mobilephlebotomy.org`
4. Complete verification via email link

**Option B: Domain Authentication (Recommended for Production)**
1. Go to Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Enter your domain: `mobilephlebotomy.org`
4. Add the provided DNS records to your domain registrar
5. Verify DNS records

### Create API Key

1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name: "Production API Key"
4. Permissions: Full Access (or Restricted Access with Mail Send only)
5. Copy the API key → `SENDGRID_API_KEY`
   - **Important**: Save this immediately - you can't view it again!

### Create Email Templates (Optional)

Create transactional email templates for:
- Lead notification emails to providers
- Provider claim confirmation emails
- Password reset emails (if adding authentication)

---

## 4. Environment Variables

### Development (.env)

Your current `.env` file:

```bash
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-SCL6SM3FD8"
```

### Production (.env.production)

Create a `.env.production` file (DO NOT commit this to git):

```bash
# Database (use Supabase, PlanetScale, or Neon for production)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-SCL6SM3FD8"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PRICE_FEATURED_SMALL="price_..."
STRIPE_PRICE_FEATURED_MED="price_..."
STRIPE_PRICE_FEATURED_LARGE="price_..."

# Twilio
TWILIO_ACCOUNT_SID="ACxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxx"
TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxx"
TWILIO_VOICE_WEBHOOK_URL="https://mobilephlebotomy.org/api/telephony/voice"
TWILIO_STATUS_WEBHOOK_URL="https://mobilephlebotomy.org/api/telephony/status"

# SendGrid
SENDGRID_API_KEY="SG.xxxxxxxx"

# Site Configuration
PUBLIC_SITE_URL="https://mobilephlebotomy.org"
NEXT_PUBLIC_SITE_URL="https://mobilephlebotomy.org"
NEXT_PUBLIC_DEFAULT_PHONE="1-800-555-0100"

# Email Configuration
LEAD_EMAIL_FROM="noreply@mobilephlebotomy.org"
ADMIN_EMAIL="hector@mobilephlebotomy.org"

# Node Environment
NODE_ENV="production"
```

---

## 5. Database Migration (SQLite → PostgreSQL)

Your app currently uses SQLite (good for development). For production, migrate to PostgreSQL.

### Option A: Supabase (Recommended - Free tier available)

1. Sign up at https://supabase.com
2. Create new project
3. Copy the connection string from Settings → Database
4. Update `DATABASE_URL` in production env vars
5. Run migration: `npx prisma migrate deploy`

### Option B: PlanetScale

1. Sign up at https://planetscale.com
2. Create new database
3. Get connection string
4. Update `DATABASE_URL`
5. Run migration

### Option C: Neon

1. Sign up at https://neon.tech
2. Create new project
3. Copy connection string
4. Update `DATABASE_URL`
5. Run migration

### Migration Steps

```bash
# 1. Update DATABASE_URL in .env.production
DATABASE_URL="postgresql://..."

# 2. Generate Prisma Client for PostgreSQL
npx prisma generate

# 3. Run migrations
npx prisma migrate deploy

# 4. (Optional) Seed data if needed
npx prisma db seed
```

---

## 6. Vercel Deployment

### Initial Setup

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/mobilephlebotomy.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
   - Install Command: `npm install`

### Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add all production environment variables:

```
DATABASE_URL
NEXT_PUBLIC_GA_MEASUREMENT_ID
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_FEATURED_SMALL
STRIPE_PRICE_FEATURED_MED
STRIPE_PRICE_FEATURED_LARGE
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_MESSAGING_SERVICE_SID
TWILIO_VOICE_WEBHOOK_URL
TWILIO_STATUS_WEBHOOK_URL
SENDGRID_API_KEY
PUBLIC_SITE_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_DEFAULT_PHONE
LEAD_EMAIL_FROM
ADMIN_EMAIL
NODE_ENV
```

3. Select environment: **Production** (and optionally Preview/Development)

### Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployed site at `https://your-project.vercel.app`

### Custom Domain

1. Go to Project Settings → Domains
2. Add your domain: `mobilephlebotomy.org`
3. Follow DNS configuration instructions
4. Add DNS records at your registrar:
   - Type: A, Name: @, Value: 76.76.21.21
   - Type: CNAME, Name: www, Value: cname.vercel-dns.com

---

## 7. Post-Deployment Checklist

### Update Webhook URLs

After deployment, update webhook URLs in:

1. **Stripe**
   - Update webhook endpoint to: `https://mobilephlebotomy.org/api/stripe/webhook`

2. **Twilio**
   - Update voice webhook: `https://mobilephlebotomy.org/api/telephony/voice`
   - Update status webhook: `https://mobilephlebotomy.org/api/telephony/status`
   - Update SMS webhook: `https://mobilephlebotomy.org/api/telephony/sms`

### Test Critical Flows

- [ ] Submit a lead through homepage form
- [ ] Verify provider receives email notification
- [ ] Test phone call tracking
- [ ] Test Stripe checkout (use test mode first)
- [ ] Verify webhook events are received
- [ ] Test provider dashboard
- [ ] Test lead credit deduction

### Monitor

1. **Vercel Dashboard**: Monitor deployment logs and errors
2. **Stripe Dashboard**: Monitor payments and webhook deliveries
3. **Twilio Console**: Monitor call/SMS logs
4. **SendGrid Dashboard**: Monitor email deliveries
5. **Google Analytics**: Monitor user traffic

---

## 8. Ongoing Maintenance

### Weekly
- Check Vercel deployment logs for errors
- Monitor Stripe webhook delivery success rate
- Review SendGrid delivery rates

### Monthly
- Review Twilio phone number usage
- Check provider lead credit balances
- Review GA4 analytics for insights

### As Needed
- Update phone numbers in database
- Add new city-specific tracking numbers
- Adjust pricing tiers in Stripe

---

## Security Best Practices

1. **Never commit .env files** - Already in .gitignore
2. **Use environment variables** for all secrets
3. **Enable Vercel authentication** for preview deployments
4. **Rotate API keys** periodically (every 90 days)
5. **Monitor webhook endpoints** for unusual activity
6. **Use Stripe webhook signatures** for verification (already implemented)
7. **Implement rate limiting** on API endpoints (consider adding)
8. **Keep dependencies updated** - Run `npm audit` regularly

---

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is correct (HTTPS required)
- Verify webhook secret is correctly set
- Check Vercel function logs for errors
- Test webhook with Stripe/Twilio test tools

### Database connection issues
- Verify DATABASE_URL is correct
- Check database is running and accessible
- Ensure IP whitelist includes Vercel IPs (if using)
- Run `npx prisma generate` after schema changes

### Email not sending
- Verify SendGrid API key is valid
- Check sender email is verified
- Review SendGrid activity log for bounce/blocks
- Ensure email templates are correct

### Phone calls not routing
- Verify Twilio webhook URLs are HTTPS
- Check phone number is configured correctly
- Review Twilio debugger for error messages
- Ensure voice webhook returns valid TwiML

---

## Support

For questions or issues:
- Email: hector@mobilephlebotomy.org
- Documentation: Review API endpoint files for implementation details
- External Services:
  - Stripe: https://stripe.com/docs
  - Twilio: https://www.twilio.com/docs
  - SendGrid: https://docs.sendgrid.com
  - Vercel: https://vercel.com/docs

---

**Last Updated**: January 2025
