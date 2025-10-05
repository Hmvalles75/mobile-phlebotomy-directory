import pandas as pd

# Load the cleaned data
cleaned_df = pd.read_csv('cleaned_providers.csv')
flagged_df = pd.read_csv('flagged_providers.csv')

print("=" * 80)
print("VERIFICATION OF CLEANED DATA")
print("=" * 80)

# Show a few sample rows from cleaned data
print("\nSAMPLE CLEANED RECORDS (First 3 with previously problematic fields):")
print("-" * 80)

sample_cols = ['name', 'city', 'state', 'email', 'languages', 'bio',
               'certifications', 'emergencyAvailable', 'weekendAvailable', 'regions serviced']

for i in range(min(3, len(cleaned_df))):
    print(f"\nRecord {i+1}:")
    for col in sample_cols:
        value = cleaned_df.iloc[i][col]
        # Truncate long values for display
        if pd.notna(value) and len(str(value)) > 60:
            value = str(value)[:60] + "..."
        print(f"  {col}: {value}")

print("\n" + "=" * 80)
print("FLAGGED PROVIDERS (Missing Critical Data)")
print("=" * 80)

if len(flagged_df) > 0:
    print(f"\nTotal flagged providers: {len(flagged_df)}")
    print("\nFirst 5 flagged providers:")
    for i in range(min(5, len(flagged_df))):
        row = flagged_df.iloc[i]
        print(f"\n{i+1}. {row['name'] if pd.notna(row['name']) else '[NO NAME]'}")
        print(f"   Phone: {row['phone'] if pd.notna(row['phone']) else '[MISSING]'}")
        print(f"   Location: {row['city'] if pd.notna(row['city']) else '[NO CITY]'}, "
              f"{row['state'] if pd.notna(row['state']) else '[NO STATE]'}")
else:
    print("\nNo providers were flagged!")

# Verify that cleaning rules were applied correctly
print("\n" + "=" * 80)
print("VERIFICATION OF CLEANING RULES")
print("=" * 80)

# Check that no Google Place IDs remain in wrong fields
import re
google_id_pattern = r'ChI[a-zA-Z0-9_-]+'
issues_found = []

for col in ['testimonials', 'insuranceAmount', 'bio']:
    contaminated = cleaned_df[col].apply(
        lambda x: bool(re.search(google_id_pattern, str(x))) if pd.notna(x) else False
    ).sum()
    if contaminated > 0:
        issues_found.append(f"{col}: {contaminated} rows still have Google Place IDs")

# Check that default values were applied
empty_languages = cleaned_df[cleaned_df['languages'].isna() | (cleaned_df['languages'] == '')].shape[0]
if empty_languages > 0:
    issues_found.append(f"languages: {empty_languages} rows are still empty")

empty_emergency = cleaned_df[cleaned_df['emergencyAvailable'].isna() | (cleaned_df['emergencyAvailable'] == '')].shape[0]
if empty_emergency > 0:
    issues_found.append(f"emergencyAvailable: {empty_emergency} rows are still empty")

empty_weekend = cleaned_df[cleaned_df['weekendAvailable'].isna() | (cleaned_df['weekendAvailable'] == '')].shape[0]
if empty_weekend > 0:
    issues_found.append(f"weekendAvailable: {empty_weekend} rows are still empty")

if issues_found:
    print("\nISSUES FOUND:")
    for issue in issues_found:
        print(f"  - {issue}")
else:
    print("\n[OK] All cleaning rules appear to have been applied correctly!")

print("\n" + "=" * 80)