# Adding New Providers to the Directory

This guide explains how to safely add new providers to `cleaned_providers.csv` without causing field misalignment issues.

## Quick Start (Recommended Method)

Use the interactive script that includes built-in validation:

```bash
node scripts/add-provider.js
```

This script will:
- ✅ Prompt you for all required fields
- ✅ Validate the data before adding it
- ✅ Ensure exactly 37 fields (preventing misalignment)
- ✅ Properly escape commas and special characters
- ✅ Show you a preview before saving

## Manual Method (Not Recommended)

If you must manually edit the CSV:

### 1. Understand the CSV Structure

The CSV has **37 fields** in this exact order:

```
name, totalScore, reviewsCount, street, regions serviced, city, state,
countryCode, website, phone, categoryName, url, is_mobile_phlebotomy,
is_nationwide, verified_service_areas, validation_notes, logo,
profileImage, businessImages, bio, foundedYear, teamSize, yearsExperience,
zipCodes, serviceRadius, travelFee, googlePlaceId, testimonials,
certifications, licenseNumber, insuranceAmount, specialties,
emergencyAvailable, weekendAvailable, email, contactPerson, languages
```

### 2. Required Fields

At minimum, provide:
- **name** - Business name
- **city** - City location
- **state** - State
- **phone** - Contact phone
- **email** - Contact email

### 3. Field Formatting Rules

- **Empty fields**: Leave blank, don't use "N/A", "null", or "false"
- **Boolean fields**: Use "Yes" or "No" (not "true"/"false")
  - `is_mobile_phlebotomy` - Usually "Yes"
  - `is_nationwide` - Usually "No"
  - `emergencyAvailable` - "Yes" or "No"
  - `weekendAvailable` - "Yes" or "No"
- **Commas**: If a field contains commas, wrap the entire field in quotes
  - Example: `"San Diego, Orange County, Riverside"`
- **Quotes**: If a field contains quotes, escape them by doubling them
  - Example: `"They said ""excellent"" service"`

### 4. Common Pitfalls to Avoid

❌ **DON'T** manually count commas - you'll get it wrong
❌ **DON'T** copy-paste from Excel without checking field count
❌ **DON'T** use "false", "False", "N/A", or "null" - leave blank instead
❌ **DON'T** forget to wrap fields with commas in quotes

### 5. Validation

After manually adding a provider, **always run validation**:

```bash
node scripts/validate-csv.js
```

This will check if all rows have exactly 37 fields and report any misalignments.

## Example: Adding a Provider Manually

**Bad Example** (will cause misalignment):
```csv
New Provider,,,123 Main St,San Diego, Orange County,San Diego,CA,US,https://example.com,...
```
☝️ Problem: "San Diego, Orange County" has a comma but isn't quoted, creating an extra field

**Good Example**:
```csv
New Provider,,,123 Main St,"San Diego, Orange County",San Diego,CA,US,https://example.com,...
```
☝️ Solution: Wrap the field in quotes

## Verification Checklist

After adding a provider:

- [ ] Run `node scripts/validate-csv.js` - must pass
- [ ] Check dev server reloaded (or restart it)
- [ ] Visit the provider page: `http://localhost:3000/provider/[slug]`
- [ ] Verify all fields display correctly:
  - [ ] Email shows under "Email" label (not "Contact Person")
  - [ ] Contact person shows under "Contact Person" label
  - [ ] Languages shows actual languages (not contact person name)
  - [ ] No "false" or "No" showing in unexpected places
  - [ ] Service areas display correctly
  - [ ] Logo displays (if provided)
- [ ] Commit to git only after verification passes

## Troubleshooting

### Issue: Fields are shifted (email showing as contact person, etc.)

**Cause**: Row has incorrect number of fields (not 37)

**Fix**:
1. Run `node scripts/validate-csv.js` to identify the problem row
2. Delete the incorrect row
3. Re-add using `node scripts/add-provider.js` (recommended)
   OR carefully reconstruct with exactly 36 commas (37 fields)

### Issue: "false" or "No" showing on provider page

**Cause**: Using "false" instead of leaving field blank

**Fix**: Replace "false" with empty string in CSV

### Issue: Logo not displaying

**Cause**:
- Logo file doesn't exist at the specified path
- Path doesn't start with `/` for local files
- Path doesn't start with `http://` or `https://` for remote files

**Fix**:
1. Ensure logo file exists in `public/provider-logos/`
2. Use path format: `/provider-logos/logo-name.png`

## Scripts Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `node scripts/add-provider.js` | Add new provider with validation | **Every time** you add a provider |
| `node scripts/validate-csv.js` | Check CSV for field alignment errors | After manual edits, before committing |

## Need Help?

If you encounter issues:
1. Check this guide first
2. Run `node scripts/validate-csv.js` to identify problems
3. Look at existing providers in the CSV for formatting examples
4. When in doubt, use `node scripts/add-provider.js` instead of manual editing
