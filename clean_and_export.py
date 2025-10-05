import pandas as pd
import numpy as np
import re

# Load the CSV
print("Loading CSV file...")
df = pd.read_csv('fully_enriched_providers_batch.csv')
original_count = len(df)

# Initialize tracking dictionaries
cleaning_stats = {
    'emails_cleaned': 0,
    'languages_set': 0,
    'testimonials_cleaned': 0,
    'insuranceAmount_cleaned': 0,
    'bio_created': 0,
    'bio_expanded': 0,
    'bio_asterisk_removed': 0,
    'certifications_set': 0,
    'emergencyAvailable_set': 0,
    'weekendAvailable_set': 0,
    'regions_serviced_set': 0,
    'critical_missing_name': 0,
    'critical_missing_phone': 0,
    'critical_missing_city': 0,
    'critical_missing_state': 0
}

print(f"Processing {original_count} rows...")

# Helper function to validate email
def is_valid_email(email):
    if pd.isna(email) or email == '' or str(email).lower() == 'nan':
        return False
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_pattern, str(email)))

# Helper function to check for Google Place ID
def contains_google_place_id(text):
    if pd.isna(text):
        return False
    google_id_pattern = r'ChI[a-zA-Z0-9_-]+'
    return bool(re.search(google_id_pattern, str(text)))

# Apply cleaning rules
for idx in range(len(df)):
    # 1. Clean email field
    if not is_valid_email(df.loc[idx, 'email']):
        df.loc[idx, 'email'] = ''
        cleaning_stats['emails_cleaned'] += 1

    # 2. Clean languages field
    if pd.isna(df.loc[idx, 'languages']) or str(df.loc[idx, 'languages']).lower() == 'nan' or df.loc[idx, 'languages'] == '':
        df.loc[idx, 'languages'] = 'English'
        cleaning_stats['languages_set'] += 1

    # 3. Clean testimonials field
    if contains_google_place_id(df.loc[idx, 'testimonials']):
        df.loc[idx, 'testimonials'] = np.nan
        cleaning_stats['testimonials_cleaned'] += 1

    # 4. Clean insuranceAmount field
    if contains_google_place_id(df.loc[idx, 'insuranceAmount']):
        df.loc[idx, 'insuranceAmount'] = 'Licensed and Insured'
        cleaning_stats['insuranceAmount_cleaned'] += 1

    # 5. Clean bio field
    bio = df.loc[idx, 'bio']
    name = df.loc[idx, 'name']
    city = df.loc[idx, 'city']
    state = df.loc[idx, 'state']

    if pd.isna(bio) or str(bio).lower() == 'nan' or bio == '':
        # Create bio from template if we have name, city, and state
        if pd.notna(name) and pd.notna(city) and pd.notna(state):
            df.loc[idx, 'bio'] = f"{name} provides mobile phlebotomy services in {city}, {state}."
            cleaning_stats['bio_created'] += 1
    else:
        bio_str = str(bio)
        # Check for incomplete bio patterns
        if bio_str.endswith('*'):
            bio_str = bio_str.rstrip('*')
            cleaning_stats['bio_asterisk_removed'] += 1

        # Check if bio is just state or city with asterisk
        if pd.notna(state) and pd.notna(city):
            if bio_str in [f"{state}", f"{city}", f"{state}*", f"{city}*"]:
                bio_str = f"{name} provides mobile phlebotomy services in {city}, {state}."
                cleaning_stats['bio_expanded'] += 1

        df.loc[idx, 'bio'] = bio_str

    # 6. Clean certifications field
    if pd.isna(df.loc[idx, 'certifications']) or str(df.loc[idx, 'certifications']).lower() == 'nan' or df.loc[idx, 'certifications'] == '':
        df.loc[idx, 'certifications'] = 'ASCP Certified'
        cleaning_stats['certifications_set'] += 1

    # 7. Clean emergencyAvailable field
    if pd.isna(df.loc[idx, 'emergencyAvailable']) or str(df.loc[idx, 'emergencyAvailable']).lower() == 'nan' or df.loc[idx, 'emergencyAvailable'] == '':
        df.loc[idx, 'emergencyAvailable'] = 'No'
        cleaning_stats['emergencyAvailable_set'] += 1

    # 8. Clean weekendAvailable field
    if pd.isna(df.loc[idx, 'weekendAvailable']) or str(df.loc[idx, 'weekendAvailable']).lower() == 'nan' or df.loc[idx, 'weekendAvailable'] == '':
        df.loc[idx, 'weekendAvailable'] = 'Yes'
        cleaning_stats['weekendAvailable_set'] += 1

    # 9. Clean regions serviced field
    if (pd.isna(df.loc[idx, 'regions serviced']) or str(df.loc[idx, 'regions serviced']).lower() == 'nan' or df.loc[idx, 'regions serviced'] == ''):
        if pd.notna(city) and pd.notna(state):
            df.loc[idx, 'regions serviced'] = f"{city}, {state} area"
            cleaning_stats['regions_serviced_set'] += 1

# Check for critical missing data
for idx in range(len(df)):
    if pd.isna(df.loc[idx, 'name']) or df.loc[idx, 'name'] == '':
        cleaning_stats['critical_missing_name'] += 1
    if pd.isna(df.loc[idx, 'phone']) or df.loc[idx, 'phone'] == '':
        cleaning_stats['critical_missing_phone'] += 1
    if pd.isna(df.loc[idx, 'city']) or df.loc[idx, 'city'] == '':
        cleaning_stats['critical_missing_city'] += 1
    if pd.isna(df.loc[idx, 'state']) or df.loc[idx, 'state'] == '':
        cleaning_stats['critical_missing_state'] += 1

# Create flagged providers dataframe (rows with critical issues)
flagged_df = df[(df['name'].isna() | (df['name'] == '')) |
                 (df['phone'].isna() | (df['phone'] == ''))]

# Export cleaned data
print("\nExporting cleaned data...")
df.to_csv('cleaned_providers.csv', index=False, encoding='utf-8')
print(f"[OK] Exported cleaned data to 'cleaned_providers.csv' ({len(df)} rows)")

# Export flagged providers
if len(flagged_df) > 0:
    flagged_df.to_csv('flagged_providers.csv', index=False, encoding='utf-8')
    print(f"[OK] Exported flagged providers to 'flagged_providers.csv' ({len(flagged_df)} rows)")
else:
    print("[OK] No providers with critical issues found!")

# Generate summary report
print("\n" + "=" * 80)
print("CLEANING SUMMARY REPORT")
print("=" * 80)
print(f"\nOVERALL STATISTICS:")
print(f"  - Total rows processed: {original_count}")
print(f"  - Total rows in cleaned file: {len(df)}")
print(f"  - Rows with critical issues (flagged): {len(flagged_df)}")

print(f"\nFIELDS CLEANED:")
print(f"  - Emails cleaned (set to empty): {cleaning_stats['emails_cleaned']}")
print(f"  - Languages set to 'English': {cleaning_stats['languages_set']}")
print(f"  - Testimonials with Google IDs removed: {cleaning_stats['testimonials_cleaned']}")
print(f"  - Insurance amounts with Google IDs fixed: {cleaning_stats['insuranceAmount_cleaned']}")
print(f"  - Bios created from template: {cleaning_stats['bio_created']}")
print(f"  - Bios expanded from short text: {cleaning_stats['bio_expanded']}")
print(f"  - Bios with asterisks removed: {cleaning_stats['bio_asterisk_removed']}")
print(f"  - Certifications set to 'ASCP Certified': {cleaning_stats['certifications_set']}")
print(f"  - Emergency available set to 'No': {cleaning_stats['emergencyAvailable_set']}")
print(f"  - Weekend available set to 'Yes': {cleaning_stats['weekendAvailable_set']}")
print(f"  - Regions serviced generated: {cleaning_stats['regions_serviced_set']}")

print(f"\nCRITICAL DATA ISSUES:")
print(f"  - Rows missing name: {cleaning_stats['critical_missing_name']}")
print(f"  - Rows missing phone: {cleaning_stats['critical_missing_phone']}")
print(f"  - Rows missing city: {cleaning_stats['critical_missing_city']}")
print(f"  - Rows missing state: {cleaning_stats['critical_missing_state']}")

# Additional validation checks
print(f"\nPOST-CLEANING VALIDATION:")

# Check for remaining Google Place IDs
remaining_google_ids = 0
for col in ['testimonials', 'insuranceAmount', 'bio']:
    count = df[col].apply(lambda x: contains_google_place_id(x)).sum()
    if count > 0:
        remaining_google_ids += count
        print(f"  WARNING: {col} still contains {count} Google Place IDs")

if remaining_google_ids == 0:
    print(f"  [OK] No Google Place IDs found in text fields")

# Check email validity after cleaning
valid_emails_after = df['email'].apply(lambda x: is_valid_email(x)).sum()
print(f"  - Valid emails after cleaning: {valid_emails_after}/{len(df)}")
print(f"  - Empty/invalid emails: {len(df) - valid_emails_after}")

# Check for completeness of key fields
complete_records = df[
    (df['name'].notna() & (df['name'] != '')) &
    (df['phone'].notna() & (df['phone'] != '')) &
    (df['city'].notna() & (df['city'] != '')) &
    (df['state'].notna() & (df['state'] != ''))
].shape[0]

print(f"\nDATA COMPLETENESS:")
print(f"  - Records with all critical fields (name, phone, city, state): {complete_records}/{len(df)} ({complete_records/len(df)*100:.1f}%)")

print("\n[OK] Cleaning process completed successfully!")
print(f"   - Clean data: cleaned_providers.csv")
if len(flagged_df) > 0:
    print(f"   - Flagged data: flagged_providers.csv")