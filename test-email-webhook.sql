-- Create test provider for email webhook testing
INSERT INTO "Provider" (
  id,
  name,
  slug,
  email,
  "claimEmail",
  "phonePublic",
  website,
  description,
  city,
  state,
  zip,
  "isFeatured",
  "createdAt",
  "updatedAt"
) VALUES (
  'test-provider-email-webhook',
  'Test Provider - Email Webhook',
  'test-provider-email-webhook',
  'hmvalles75@yahoo.com',
  'hmvalles75@yahoo.com',
  '+15555551234',
  'https://test.com',
  'Test provider for email webhook testing',
  'Detroit',
  'MI',
  '48201',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "claimEmail" = 'hmvalles75@yahoo.com',
  email = 'hmvalles75@yahoo.com',
  "updatedAt" = NOW();

-- Create test lead for this provider
INSERT INTO "Lead" (
  id,
  "fullName",
  phone,
  email,
  address1,
  city,
  state,
  zip,
  urgency,
  notes,
  status,
  "routedToId",
  "routedAt",
  "priceCents",
  "createdAt",
  "updatedAt"
) VALUES (
  'test-lead-email-webhook-001',
  'Test Patient',
  '+15555559999',
  'patient@test.com',
  '123 Test St',
  'Detroit',
  'MI',
  '48201',
  'ROUTINE',
  'Test lead for email webhook testing',
  'OPEN',
  'test-provider-email-webhook',
  NOW(),
  2500,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "routedAt" = NOW(),
  "updatedAt" = NOW();
