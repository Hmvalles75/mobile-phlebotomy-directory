import pandas as pd
import json
from datetime import datetime

# State name to abbreviation mapping
STATE_MAPPING = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
}

# Read your updated dataset
df = pd.read_csv('enriched_mobile_phlebotomy_providers_updated.csv')

# Function to safely get value or return empty string
def safe_get(row, column, default=''):
    value = row.get(column, default)
    if pd.isna(value) or value == 'NaN' or str(value).strip() == '':
        return default
    return str(value).strip()

# Filter for mobile phlebotomy services only (excluding nationwide)
print(f"Total rows in CSV: {len(df)}")

# Apply filters
df_filtered = df[
    (df['is_mobile_phlebotomy'].astype(str).str.lower() == 'yes') & 
    (df['is_nationwide'].astype(str).str.lower() != 'yes')
]

print(f"Rows after filtering (mobile phlebotomy only, excluding nationwide): {len(df_filtered)}")

# Convert to the JSON format your site expects
providers = []
for index, row in df_filtered.iterrows():
    # Skip if no name
    if pd.isna(row.get('name')) or not str(row.get('name')).strip():
        continue
    
    # Get state and convert to abbreviation
    state_full = safe_get(row, 'state')
    state_abbr = STATE_MAPPING.get(state_full, state_full)
    
    # Handle regions serviced and new enriched fields
    regions_serviced = safe_get(row, 'regions serviced')
    verified_service_areas = safe_get(row, 'verified_service_areas')
    validation_notes = safe_get(row, 'validation_notes')
    
    # Build description using validation notes
    base_description = f"Professional mobile phlebotomy services. {safe_get(row, 'categoryName', 'Medical services')} providing at-home blood draw services."
    if validation_notes:
        base_description = f"{base_description} {validation_notes}"
    
    provider = {
        "id": str(index + 1),
        "name": safe_get(row, 'name'),
        "slug": safe_get(row, 'name').lower().replace(' ', '-').replace('&', 'and').replace(',', '').replace('.', '').replace('(', '').replace(')', ''),
        "phone": safe_get(row, 'phone'),
        "website": safe_get(row, 'website'),
        "bookingUrl": safe_get(row, 'url'),
        "description": base_description,
        "services": ["At-Home Blood Draw", "Specimen Pickup", "Lab Partner"],
        "coverage": {
            "states": [state_abbr] if state_abbr else [],
            "cities": [safe_get(row, 'city')] if safe_get(row, 'city') else [],
            "serviceAreas": verified_service_areas if verified_service_areas else regions_serviced
        },
        "address": {
            "street": safe_get(row, 'street'),
            "city": safe_get(row, 'city'),
            "state": state_abbr,
            "zip": ""
        },
        "availability": ["Weekdays"],
        "payment": ["Cash", "Major Insurance"],
        "rating": float(row.get('totalScore', 0)) if pd.notna(row.get('totalScore')) and row.get('totalScore') != 0 else None,
        "reviewsCount": int(row.get('reviewsCount', 0)) if pd.notna(row.get('reviewsCount')) and row.get('reviewsCount') != 0 else None,
        "badges": ["Certified", "Insured", "Mobile Service"],
        "isMobilePhlebotomy": True,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    
    # Add verified service areas to description if available
    if verified_service_areas:
        provider["description"] += f" Verified service areas: {verified_service_areas}."
    elif regions_serviced:
        provider["description"] += f" Serving: {regions_serviced}."
    
    providers.append(provider)

# Save to JSON
with open('data/providers.json', 'w', encoding='utf-8') as f:
    json.dump(providers, f, indent=2, ensure_ascii=False)

# Also save to public folder for the website
with open('public/data/providers.json', 'w', encoding='utf-8') as f:
    json.dump(providers, f, indent=2, ensure_ascii=False)

print(f"Converted {len(providers)} mobile phlebotomy providers to data/providers.json and public/data/providers.json")

# Show state distribution
states = {}
for p in providers:
    state = p['address']['state']
    if state:
        states[state] = states.get(state, 0) + 1

print("\nProviders by state:")
for state, count in sorted(states.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"  {state}: {count}")