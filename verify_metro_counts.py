import pandas as pd
import requests
import json

# Load the cleaned data to verify locally
df = pd.read_csv('cleaned_providers.csv')

# Test the Los Angeles case specifically
los_angeles_city = "los angeles"
los_angeles_state = "CA"
ca_full_name = "California"

print("=" * 80)
print("LOS ANGELES PROVIDER COUNT VERIFICATION")
print("=" * 80)

# Count providers using the new logic (matching the updated metros page)
count = 0

for idx, provider in df.iterrows():
    # Skip non-mobile phlebotomy services
    if provider['is_mobile_phlebotomy'] == 'No':
        continue

    # Include nationwide providers
    if provider['is_nationwide'] == 'Yes':
        count += 1
        continue

    # Check if provider serves California
    serves_state = (provider['state'] == los_angeles_state or
                   provider['state'] == ca_full_name)

    if not serves_state:
        continue

    # 1. Direct city match
    city_match = False
    if pd.notna(provider['city']):
        city_match = provider['city'].lower() == los_angeles_city

    # 2. Service area match
    service_area_match = False
    if pd.notna(provider['verified_service_areas']):
        service_area_match = los_angeles_city in provider['verified_service_areas'].lower()

    if pd.notna(provider['validation_notes']):
        service_area_match = service_area_match or (los_angeles_city in provider['validation_notes'].lower())

    # 3. Regional match (serves state but not specifically LA)
    regional_match = not city_match and not service_area_match and serves_state

    # Count all types
    if city_match or service_area_match or regional_match:
        count += 1

print(f"Total Los Angeles area providers (using new logic): {count}")

# Also show breakdown
city_specific = 0
regional = 0
statewide = 0

for idx, provider in df.iterrows():
    if provider['is_mobile_phlebotomy'] == 'No':
        continue

    if provider['is_nationwide'] == 'Yes':
        statewide += 1
        continue

    serves_state = (provider['state'] == los_angeles_state or
                   provider['state'] == ca_full_name)

    if not serves_state:
        continue

    city_match = False
    if pd.notna(provider['city']):
        city_match = provider['city'].lower() == los_angeles_city

    service_area_match = False
    if pd.notna(provider['verified_service_areas']):
        service_area_match = los_angeles_city in provider['verified_service_areas'].lower()

    if pd.notna(provider['validation_notes']):
        service_area_match = service_area_match or (los_angeles_city in provider['validation_notes'].lower())

    if city_match or service_area_match:
        city_specific += 1
    elif serves_state:
        regional += 1

print(f"\nBreakdown:")
print(f"  City-specific: {city_specific}")
print(f"  Regional: {regional}")
print(f"  Statewide/Nationwide: {statewide}")
print(f"  Total: {city_specific + regional + statewide}")

print("\n" + "=" * 80)
print("VERIFICATION OF OTHER MAJOR METROS")
print("=" * 80)

# Test a few other major metros
test_metros = [
    ("new york", "NY", "New York"),
    ("chicago", "IL", "Illinois"),
    ("houston", "TX", "Texas"),
    ("phoenix", "AZ", "Arizona")
]

for city, state_abbr, state_full in test_metros:
    total_count = 0

    for idx, provider in df.iterrows():
        if provider['is_mobile_phlebotomy'] == 'No':
            continue

        if provider['is_nationwide'] == 'Yes':
            total_count += 1
            continue

        serves_state = (provider['state'] == state_abbr or
                       provider['state'] == state_full)

        if not serves_state:
            continue

        city_match = False
        if pd.notna(provider['city']):
            city_match = provider['city'].lower() == city

        service_area_match = False
        if pd.notna(provider['verified_service_areas']):
            service_area_match = city in provider['verified_service_areas'].lower()

        if pd.notna(provider['validation_notes']):
            service_area_match = service_area_match or (city in provider['validation_notes'].lower())

        regional_match = not city_match and not service_area_match and serves_state

        if city_match or service_area_match or regional_match:
            total_count += 1

    print(f"{city.title()}, {state_abbr}: {total_count} providers")

print("\nNew metro card counts should now match metro page counts!")