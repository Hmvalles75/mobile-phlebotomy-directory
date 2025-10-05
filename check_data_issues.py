import pandas as pd

# Load the cleaned data
df = pd.read_csv('cleaned_providers.csv')

print("=" * 80)
print("CHECKING ZIP CODES ISSUE")
print("=" * 80)

# Check zip codes field
zip_samples = df[df['zipCodes'].notna()].head(10)
print("\nSample ZIP codes from CSV:")
for idx, row in zip_samples.iterrows():
    print(f"{row['name'][:40]}: {row['zipCodes']}")

# Check for numeric vs string issues
print("\n" + "=" * 80)
print("CHECKING BUSINESS IMAGES")
print("=" * 80)

# Check business images
image_samples = df[df['businessImages'].notna()].head(10)
print(f"\nProviders with businessImages: {df['businessImages'].notna().sum()}")
if len(image_samples) > 0:
    print("\nSample businessImages values:")
    for idx, row in image_samples.iterrows():
        print(f"{row['name'][:40]}: {row['businessImages'][:100]}...")

# Check profile images
profile_samples = df[df['profileImage'].notna()].head(10)
print(f"\nProviders with profileImage: {df['profileImage'].notna().sum()}")
if len(profile_samples) > 0:
    print("\nSample profileImage values:")
    for idx, row in profile_samples.iterrows():
        print(f"{row['name'][:40]}: {row['profileImage'][:100]}...")

# Check logos
logo_samples = df[df['logo'].notna()].head(10)
print(f"\nProviders with logo: {df['logo'].notna().sum()}")
if len(logo_samples) > 0:
    print("\nSample logo values:")
    for idx, row in logo_samples.iterrows():
        print(f"{row['name'][:40]}: {row['logo'][:100] if len(str(row['logo'])) > 0 else 'EMPTY'}...")