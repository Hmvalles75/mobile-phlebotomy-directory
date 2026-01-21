# Duplicate Provider Detection System

## Overview

Automatic system to detect and remove duplicate provider entries based on:
- **Name matching**: Normalized names (removes LLC/Inc, whitespace, case)
- **Website matching**: Normalized domains (ignores www, protocol, query params)
- **Email/Phone matching**: Exact matches

## Features

### 1. Automatic Duplicate Prevention

**New Provider Submissions** (`/api/submit-provider`)
- Checks for duplicates before accepting submissions
- Returns 409 error with existing provider details if duplicate found
- Suggests using "claim listing" feature instead

**Bulk Imports** (`/api/admin/import-providers`)
- Automatically runs duplicate removal after import completes
- Reports duplicates found and removed in response

### 2. Manual Duplicate Management

**CLI Tool** (Recommended)
```bash
# Check for duplicates (dry run)
npx tsx scripts/check-duplicates.ts

# Remove duplicates
npx tsx scripts/check-duplicates.ts --remove
```

**Admin API Endpoint**
```bash
# Find duplicates (GET)
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:3000/api/admin/duplicates

# Remove duplicates (POST - dry run by default)
curl -X POST \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}' \
  http://localhost:3000/api/admin/duplicates
```

## How It Works

### Name Normalization
```javascript
"MobileBloodDraw LLC"  → "mobileblooddraw"
"Mobile Blood Draw, Inc." → "mobileblooddraw"
"MOBILE BLOOD DRAW" → "mobileblooddraw"
```

### Website Normalization
```javascript
"https://www.mobileblooddraw.com?utm_source=google" → "mobileblooddraw.com"
"http://mobileblooddraw.com/" → "mobileblooddraw.com"
"www.mobileblooddraw.com" → "mobileblooddraw.com"
```

### Duplicate Resolution
- **Keeps**: Most recently created provider (latest `createdAt`)
- **Deletes**: All older duplicates
- **Safe**: Always keeps at least one entry per duplicate group

## Examples

### Example 1: Manual Duplicate Check
```bash
$ npx tsx scripts/check-duplicates.ts

🔍 Checking for duplicate providers...
📋 DRY RUN MODE - No changes will be made

Found 2 duplicate groups:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Group 1: mobileblooddraw
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ KEEP: MobileBloodDraw
   ID: cmkn88kyz0002k1045810z3pg
   Website: https://www.mobileblooddraw.org
   Created: Tue Jan 20 2026 15:30:16 GMT

❌ DELETE: MobileBloodDraw
   ID: cmit32ub200oig0m0lz8rhcoc
   Website: https://www.mobileblooddraw.com
   Created: Fri Dec 05 2025 08:33:02 GMT

⚠️  Total duplicates to remove: 1

To remove duplicates, run:
  npx tsx scripts/check-duplicates.ts --remove
```

### Example 2: Preventing Duplicate Submission
```javascript
// User tries to submit "MobileBloodDraw LLC"
const response = await fetch('/api/submit-provider', {
  method: 'POST',
  body: JSON.stringify({
    businessName: 'MobileBloodDraw LLC',
    website: 'https://mobileblooddraw.org'
  })
})

// Response: 409 Conflict
{
  "success": false,
  "error": "duplicate",
  "message": "A provider with similar name or website already exists...",
  "existingProvider": {
    "id": "cmkn88kyz0002k1045810z3pg",
    "name": "MobileBloodDraw",
    "slug": "mobileblooddraw"
  }
}
```

## Database Impact

Current duplicates found (as of Jan 20, 2026):
- **25 duplicate groups**
- **32 duplicate providers** to be removed
- Common duplicate types:
  - Chain locations (ARCpoint Labs, Mercy Health, etc.)
  - Name variations (LLC vs Inc vs nothing)
  - Website parameter differences

## Best Practices

1. **Before bulk imports**: Run duplicate check
2. **After bulk imports**: System auto-removes duplicates
3. **Weekly maintenance**: Run `check-duplicates.ts` to catch any manual duplicates
4. **Before production**: Always use `--remove` flag only after reviewing dry run

## Technical Details

**Files:**
- `lib/duplicate-detection.ts` - Core detection logic
- `scripts/check-duplicates.ts` - CLI tool
- `app/api/admin/duplicates/route.ts` - Admin API
- `app/api/submit-provider/route.ts` - Prevention on submission
- `app/api/admin/import-providers/route.ts` - Auto-cleanup on import

**Functions:**
- `findDuplicates()` - Find all duplicate groups
- `removeDuplicates(dryRun)` - Remove duplicates
- `checkForDuplicate(name, website)` - Check single provider

## Safety Features

- **Dry run by default**: CLI and API default to dry run mode
- **Keeps newest**: Always preserves most recent entry
- **No data loss**: Duplicates are deleted, not modified
- **Detailed logging**: Shows exactly what will be kept/deleted
- **Authorization required**: API requires ADMIN_SECRET

## Future Enhancements

- [ ] Phone number matching
- [ ] Address matching
- [ ] Fuzzy name matching (Levenshtein distance)
- [ ] Merge duplicate data (combine reviews, coverage areas)
- [ ] Admin UI for manual review before deletion
- [ ] Email notifications when duplicates are found
