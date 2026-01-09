# Setting Up Stripe Premium Pricing

## Step 1: Create Products in Stripe Dashboard

Go to: https://dashboard.stripe.com/products

Create 3 products with the following details:

### Product 1: Founding Partner Premium
- **Name**: Founding Partner Premium
- **Description**: Launch offer for providers in new, unserved markets
- **Pricing**: $49/month (recurring)
- After creation, copy the **Price ID** (starts with `price_`)

### Product 2: Standard Premium
- **Name**: Standard Premium
- **Description**: Standard premium listing for established markets
- **Pricing**: $79/month (recurring)
- After creation, copy the **Price ID** (starts with `price_`)

### Product 3: High-Density Metro
- **Name**: High-Density Metro
- **Description**: Maximum visibility in major metro markets
- **Pricing**: $149/month (recurring)
- After creation, copy the **Price ID** (starts with `price_`)

## Step 2: Add Price IDs to .env

Add these lines to your `.env` file (replace with your actual Price IDs):

```
STRIPE_PRICE_FOUNDING_PARTNER=price_xxxxxxxxxxxxx
STRIPE_PRICE_STANDARD_PREMIUM=price_xxxxxxxxxxxxx
STRIPE_PRICE_HIGH_DENSITY=price_xxxxxxxxxxxxx
```

## Step 3: Restart Your Development Server

```bash
npm run dev
```

## Step 4: Test the Pricing Flow

1. Go to your dashboard: http://localhost:3000/dashboard
2. Click "View Pricing Plans"
3. Select a tier and click "Get Started"
4. You should be redirected to Stripe Checkout
5. Use test card: 4242 4242 4242 4242

## Already Have Products?

If you already have these products in Stripe, just:
1. Go to https://dashboard.stripe.com/products
2. Click on each product
3. Copy the Price ID from the "Pricing" section
4. Add them to your .env file
