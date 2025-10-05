import pandas as pd

# Load the data
df = pd.read_csv('cleaned_providers.csv')

# State mapping
state_map = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
}

# Test the exact logic from the updated metros page
def get_provider_count(metro_city, metro_state_abbr):
    full_state_name = state_map.get(metro_state_abbr)
    normalized_city = metro_city.lower()
    normalized_state = metro_state_abbr.upper()

    count = 0

    for idx, provider in df.iterrows():
        # Skip non-mobile phlebotomy services
        if provider['is_mobile_phlebotomy'] == 'No':
            continue

        # Include nationwide providers
        if provider['is_nationwide'] == 'Yes':
            count += 1
            continue

        # Check if provider serves this state
        serves_state = (
            provider['state'] == normalized_state or
            provider['state'] == full_state_name
        )

        if not serves_state:
            continue

        # 1. Direct city match
        has_direct_city_match = False
        if pd.notna(provider['city']):
            has_direct_city_match = provider['city'].lower() == normalized_city

        # 2. Service area match
        service_area_match = False
        if pd.notna(provider['verified_service_areas']):
            service_area_match = normalized_city in provider['verified_service_areas'].lower()
        if pd.notna(provider['validation_notes']):
            service_area_match = service_area_match or (normalized_city in provider['validation_notes'].lower())

        # 3. Regional match
        has_regional_match = not has_direct_city_match and not service_area_match and serves_state

        # Count all providers
        if has_direct_city_match or service_area_match or has_regional_match:
            count += 1

    return count

# Test top 10 metros
top_metros = [
    ("Los Angeles", "CA"),
    ("New York", "NY"),
    ("Chicago", "IL"),
    ("Houston", "TX"),
    ("Phoenix", "AZ"),
    ("Philadelphia", "PA"),
    ("San Antonio", "TX"),
    ("San Diego", "CA"),
    ("Dallas", "TX"),
    ("Austin", "TX")
]

print("CURRENT METRO PROVIDER COUNTS (using exact updated logic):")
print("=" * 60)

for city, state in top_metros:
    count = get_provider_count(city, state)
    print(f"{city}, {state}: {count} providers")

# Also debug a specific case to see what's happening
print("\n" + "=" * 60)
print("DEBUGGING LOS ANGELES SPECIFICALLY:")
print("=" * 60)

normalized_city = "los angeles"
normalized_state = "CA"
full_state_name = "California"

city_specific = 0
regional = 0
statewide = 0

debug_providers = []

for idx, provider in df.iterrows():
    if provider['is_mobile_phlebotomy'] == 'No':
        continue

    if provider['is_nationwide'] == 'Yes':
        statewide += 1
        debug_providers.append(f"Nationwide: {provider['name']}")
        continue

    serves_state = (
        provider['state'] == normalized_state or
        provider['state'] == full_state_name
    )

    if not serves_state:
        continue

    # Check matches
    has_direct_city_match = False
    if pd.notna(provider['city']):
        has_direct_city_match = provider['city'].lower() == normalized_city

    service_area_match = False
    if pd.notna(provider['verified_service_areas']):
        service_area_match = normalized_city in provider['verified_service_areas'].lower()
    if pd.notna(provider['validation_notes']):
        service_area_match = service_area_match or (normalized_city in provider['validation_notes'].lower())

    if has_direct_city_match or service_area_match:
        city_specific += 1
        debug_providers.append(f"City-specific: {provider['name']} (city: {provider['city'] if pd.notna(provider['city']) else 'N/A'})")
    elif serves_state:
        regional += 1
        debug_providers.append(f"Regional: {provider['name']} (city: {provider['city'] if pd.notna(provider['city']) else 'N/A'})")

print(f"City-specific: {city_specific}")
print(f"Regional: {regional}")
print(f"Statewide/Nationwide: {statewide}")
print(f"Total: {city_specific + regional + statewide}")

print(f"\nFirst 10 providers:")
for i, prov in enumerate(debug_providers[:10]):
    print(f"  {i+1}. {prov}")