# Featured Provider Guidelines

## Services Management

### ✅ Best Practices

1. **Always add services to database** - Never leave "Services Offered" section empty
2. **Keep description generic** - Don't list specific services in the intro paragraph
3. **Use description for story/value prop** - Focus on what makes them unique

### Description Format (Good Examples)

**GOOD** - Generic, focused on value:
```
Carewithluvs LLC is a Maryland-based mobile healthcare service providing professional,
compassionate care. We come to you at home, nursing facilities, or assisted living.
We provide flexible scheduling, including evenings and weekends, to meet client needs
quickly and efficiently. Our pricing is competitive and often lower than traditional
facilities while maintaining high-quality, compliant services.
```

**BAD** - Lists services (redundant with Services Offered section):
```
Carewithluvs LLC offers phlebotomy services, breath alcohol testing, nail and hair
drug testing, DOT and NON-DOT specimen collection, immigration DNA testing, and early
gender reveal DNA testing.
```

### Required Database Fields for Featured Providers

- ✅ `primaryState` (abbreviation like "MD")
- ✅ `primaryCity`
- ✅ At least 5-10 services in `services` relation
- ✅ `listingTier` set to PREMIUM or FEATURED
- ✅ `isFeatured` = true
- ✅ `featuredTier` if applicable (FOUNDING_PARTNER, STANDARD_PREMIUM)
- ✅ `description` (generic value proposition, not service list)
- ✅ `phone` with proper formatting
- ✅ `email` for notifications

### Services Checklist

Run this before marking a provider as featured:
```bash
npx tsx scripts/ensure-all-featured-have-services.ts
```

Should show:
- ✓ Provider name
- ✓ Services: [count]
- ✓ Has services: [service names]

If shows "NO SERVICES", run:
```bash
# Extract services from description and add to database
npx tsx scripts/add-[provider-name]-services.ts
```

### Landing Pages (for providers without websites)

Create at: `app/[state]/[provider-slug]/page.tsx`

**Must include:**
- Founding Partner badge (if applicable)
- Hero with CTA (phone/email)
- Services section (from database, not hardcoded)
- Location information
- Use Next.js `<Image>` component (not `<img>`)
- Proper TypeScript types

**Example:**
```typescript
import Image from 'next/image'

export default function ProviderPage() {
  // ... hero, services from description
  <Image
    src="/images/provider-flyer.png"
    alt="..."
    width={400}
    height={600}
    priority
  />
}
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Services section empty | Add services to database via script |
| Description lists services | Rewrite to be generic value prop |
| State = "Maryland" not "MD" | Update to abbreviation for search |
| Build timeout on landing page | Use `<Image>` not `<img>` |
| Missing from state searches | Check primaryState is abbreviation |

## Testing Checklist

Before marking featured:

- [ ] Provider appears in correct state page (`/us/[state]`)
- [ ] Services section shows 5+ services
- [ ] Description doesn't duplicate services
- [ ] Phone number clickable with proper formatting
- [ ] Website link works (or points to landing page)
- [ ] Founding Partner badge shows (if applicable)
- [ ] Ranks above non-featured providers
- [ ] Landing page (if created) builds without timeout

## Scripts Reference

```bash
# Check all featured providers have services
npx tsx scripts/ensure-all-featured-have-services.ts

# Check provider search visibility
npx tsx scripts/audit-provider-seo.ts

# Test state API filtering
npx tsx scripts/test-maryland-api.ts  # Replace maryland with state

# Check specific provider details
npx tsx scripts/check-ponce-prostik.ts  # Template for checking providers
```
