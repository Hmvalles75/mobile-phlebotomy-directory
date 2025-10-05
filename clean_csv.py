import pandas as pd
import numpy as np
import re

# Load the CSV
df = pd.read_csv('fully_enriched_providers_batch.csv')

print("=" * 80)
print("INITIAL DATA ANALYSIS")
print("=" * 80)
print(f"Total rows: {len(df)}")
print(f"Total columns: {len(df.columns)}")

# Show 3 sample rows with problems
print("\n" + "=" * 80)
print("SAMPLE ROWS WITH DATA QUALITY ISSUES")
print("=" * 80)

# Find rows with various issues
problematic_rows = []

# Find rows with Google Place IDs in wrong fields
for idx, row in df.iterrows():
    issues = []

    # Check for Google Place IDs in wrong fields
    if pd.notna(row['testimonials']) and 'ChI' in str(row['testimonials']):
        issues.append(f"Google Place ID in testimonials: {row['testimonials'][:50]}...")

    if pd.notna(row['insuranceAmount']) and 'ChI' in str(row['insuranceAmount']):
        issues.append(f"Google Place ID in insuranceAmount: {row['insuranceAmount'][:50]}...")

    if pd.notna(row['bio']) and 'ChI' in str(row['bio']):
        issues.append(f"Google Place ID in bio: {row['bio'][:50]}...")

    # Check for NaN or empty critical fields
    if pd.isna(row['email']) or str(row['email']) == 'nan':
        issues.append("Email is NaN or empty")

    if pd.isna(row['languages']) or str(row['languages']) == 'nan':
        issues.append("Languages is NaN or empty")

    # Check for incomplete bio
    if pd.notna(row['bio']) and str(row['bio']).endswith('*'):
        issues.append(f"Bio has trailing asterisk: {row['bio'][:50]}...")

    # Check for empty boolean fields
    if pd.isna(row['emergencyAvailable']):
        issues.append("emergencyAvailable is empty")

    if pd.isna(row['weekendAvailable']):
        issues.append("weekendAvailable is empty")

    if issues and len(problematic_rows) < 3:
        problematic_rows.append({
            'index': idx,
            'name': row['name'],
            'city': row['city'],
            'state': row['state'],
            'issues': issues
        })

for i, prob_row in enumerate(problematic_rows, 1):
    print(f"\nExample {i}: Row {prob_row['index']} - {prob_row['name']}")
    print(f"Location: {prob_row['city']}, {prob_row['state']}")
    print("Issues found:")
    for issue in prob_row['issues']:
        print(f"  - {issue}")

# Show data type issues
print("\n" + "=" * 80)
print("DATA TYPE AND MISSING VALUE ANALYSIS")
print("=" * 80)

# Check for NaN values in each column
nan_counts = df.isna().sum()
print("\nColumns with missing values (NaN):")
for col in df.columns:
    if nan_counts[col] > 0:
        print(f"  {col}: {nan_counts[col]} missing ({nan_counts[col]/len(df)*100:.1f}%)")

# Check for Google Place IDs in wrong fields
print("\n" + "=" * 80)
print("GOOGLE PLACE ID CONTAMINATION CHECK")
print("=" * 80)

google_id_pattern = r'ChI[a-zA-Z0-9_-]+'
for col in ['testimonials', 'insuranceAmount', 'bio']:
    count = df[col].apply(lambda x: bool(re.search(google_id_pattern, str(x))) if pd.notna(x) else False).sum()
    if count > 0:
        print(f"{col}: {count} rows contain Google Place IDs")
        # Show first example
        example = df[df[col].apply(lambda x: bool(re.search(google_id_pattern, str(x))) if pd.notna(x) else False)].iloc[0]
        print(f"  Example: {example[col][:100]}...")

# Check for invalid emails
print("\n" + "=" * 80)
print("EMAIL VALIDATION CHECK")
print("=" * 80)

email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
valid_emails = df['email'].apply(lambda x: bool(re.match(email_pattern, str(x))) if pd.notna(x) else False).sum()
invalid_or_missing = len(df) - valid_emails
print(f"Valid emails: {valid_emails}")
print(f"Invalid or missing emails: {invalid_or_missing}")

# Show some examples of invalid emails
invalid_email_examples = df[~df['email'].apply(lambda x: bool(re.match(email_pattern, str(x))) if pd.notna(x) else True)]['email'].head(5)
if len(invalid_email_examples) > 0:
    print("Examples of invalid emails:")
    for email in invalid_email_examples:
        print(f"  - {email}")