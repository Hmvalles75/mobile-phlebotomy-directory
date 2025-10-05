import pandas as pd

# Load the cleaned data
df = pd.read_csv('cleaned_providers.csv')

print("=" * 80)
print("LOGO DATA ANALYSIS")
print("=" * 80)

# Check logo and profileImage fields
logo_count = df['logo'].notna().sum()
profile_count = df['profileImage'].notna().sum()
total_with_images = df[(df['logo'].notna()) | (df['profileImage'].notna())].shape[0]

print(f"Total providers: {len(df)}")
print(f"Providers with logo: {logo_count}")
print(f"Providers with profileImage: {profile_count}")
print(f"Providers with any image: {total_with_images}")

print("\n" + "=" * 80)
print("SAMPLE LOGO URLs")
print("=" * 80)

# Show sample logo URLs
logo_samples = df[df['logo'].notna()].head(10)
print("\nSample logo URLs:")
for idx, row in logo_samples.iterrows():
    logo_url = str(row['logo'])
    print(f"{row['name'][:40]}: {logo_url[:80]}{'...' if len(logo_url) > 80 else ''}")

print("\n" + "=" * 80)
print("SAMPLE PROFILE IMAGE URLs")
print("=" * 80)

# Show sample profile image URLs
profile_samples = df[df['profileImage'].notna()].head(10)
print("\nSample profileImage URLs:")
for idx, row in profile_samples.iterrows():
    profile_url = str(row['profileImage'])
    print(f"{row['name'][:40]}: {profile_url[:80]}{'...' if len(profile_url) > 80 else ''}")

print("\n" + "=" * 80)
print("URL VALIDATION CHECK")
print("=" * 80)

# Check URL formats
valid_logo_urls = 0
valid_profile_urls = 0

for idx, row in df.iterrows():
    # Check logo URLs
    if pd.notna(row['logo']):
        logo_str = str(row['logo'])
        if logo_str.startswith('http://') or logo_str.startswith('https://'):
            valid_logo_urls += 1

    # Check profile image URLs
    if pd.notna(row['profileImage']):
        profile_str = str(row['profileImage'])
        if profile_str.startswith('http://') or profile_str.startswith('https://'):
            valid_profile_urls += 1

print(f"Valid logo URLs (http/https): {valid_logo_urls}/{logo_count}")
print(f"Valid profile URLs (http/https): {valid_profile_urls}/{profile_count}")

# Show some invalid URLs if any
print("\n" + "=" * 80)
print("INVALID URL EXAMPLES")
print("=" * 80)

invalid_count = 0
for idx, row in df.iterrows():
    if invalid_count >= 5:
        break

    if pd.notna(row['logo']):
        logo_str = str(row['logo'])
        if not (logo_str.startswith('http://') or logo_str.startswith('https://')):
            print(f"Invalid logo: {row['name'][:30]} -> {logo_str}")
            invalid_count += 1

if invalid_count == 0:
    print("No invalid logo URLs found in sample")