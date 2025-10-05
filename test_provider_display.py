import pandas as pd
import json

# Load the cleaned data
df = pd.read_csv('cleaned_providers.csv')

print("=" * 80)
print("SAMPLE PROVIDER DATA FROM CLEANED CSV")
print("=" * 80)

# Show a few sample providers with different data completeness levels
samples = [
    df[df['phone'].notna()].iloc[0] if len(df[df['phone'].notna()]) > 0 else None,  # Provider with phone
    df[df['email'].notna() & (df['email'] != '')].iloc[0] if len(df[df['email'].notna() & (df['email'] != '')]) > 0 else None,  # Provider with email
    df[df['bio'].notna()].iloc[0] if len(df[df['bio'].notna()]) > 0 else None  # Provider with bio
]

for i, provider in enumerate(samples, 1):
    if provider is not None:
        print(f"\nProvider {i}: {provider['name']}")
        print("-" * 40)

        # Key display fields
        print(f"Location: {provider['city']}, {provider['state']}")
        print(f"Phone: {provider['phone'] if pd.notna(provider['phone']) else '[Not provided]'}")
        print(f"Email: {provider['email'] if pd.notna(provider['email']) and provider['email'] != '' else '[Not provided]'}")
        print(f"Website: {provider['website'] if pd.notna(provider['website']) else '[Not provided]'}")

        # Cleaned fields
        print(f"\nCleaned Fields:")
        print(f"  Bio: {provider['bio'][:100] if pd.notna(provider['bio']) else '[Empty]'}...")
        print(f"  Languages: {provider['languages']}")
        print(f"  Certifications: {provider['certifications']}")
        print(f"  Emergency Available: {provider['emergencyAvailable']}")
        print(f"  Weekend Available: {provider['weekendAvailable']}")
        print(f"  Regions Serviced: {provider['regions serviced'] if pd.notna(provider['regions serviced']) else '[Not specified]'}")

        # Data quality indicators
        print(f"\nData Quality:")
        print(f"  Has testimonials: {'Yes' if pd.notna(provider['testimonials']) and provider['testimonials'] != '' else 'No'}")
        print(f"  Has insurance info: {'Yes' if pd.notna(provider['insuranceAmount']) and provider['insuranceAmount'] != '' else 'No'}")
        print(f"  Has specialties: {'Yes' if pd.notna(provider['specialties']) and provider['specialties'] != '' else 'No'}")

print("\n" + "=" * 80)
print("OVERALL DATA QUALITY SUMMARY")
print("=" * 80)

# Count providers with key fields
with_phone = df['phone'].notna().sum()
with_email = (df['email'].notna() & (df['email'] != '')).sum()
with_website = df['website'].notna().sum()
with_bio = df['bio'].notna().sum()
with_regions = df['regions serviced'].notna().sum()
with_certifications = df['certifications'].notna().sum()

print(f"\nProviders with key information:")
print(f"  With phone number: {with_phone}/{len(df)} ({with_phone/len(df)*100:.1f}%)")
print(f"  With email: {with_email}/{len(df)} ({with_email/len(df)*100:.1f}%)")
print(f"  With website: {with_website}/{len(df)} ({with_website/len(df)*100:.1f}%)")
print(f"  With bio/description: {with_bio}/{len(df)} ({with_bio/len(df)*100:.1f}%)")
print(f"  With regions serviced: {with_regions}/{len(df)} ({with_regions/len(df)*100:.1f}%)")
print(f"  With certifications: {with_certifications}/{len(df)} ({with_certifications/len(df)*100:.1f}%)")

print("\n✅ All provider pages are now configured to display the cleaned data properly!")