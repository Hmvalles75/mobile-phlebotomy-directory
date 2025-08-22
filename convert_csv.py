import pandas as pd
import json
from datetime import datetime

# Read your updated dataset
df = pd.read_csv('dataset_crawler-google-places_2025-08-15_13-25-00-192.csv')

# Function to safely get value or return empty string
def safe_get(row, column, default=''):
    value = row.get(column, default)
    if pd.isna(value) or value == 'NaN':
        return default
    return str(value)

# Convert to the JSON format your site expects
providers = []
for index, row in df.iterrows():
    # Skip if no name
    if pd.isna(row.get('title')) or not row.get('title'):
        continue
        
    provider = {
        "id": str(index + 1),
        "name": safe_get(row, 'title'),
        "slug": safe_get(row, 'title').lower().replace(' ', '-').replace('&', 'and').replace(',', '').replace('.', ''),
        "phone": safe_get(row, 'phone'),
        "website": safe_get(row, 'website'),
        "bookingUrl": safe_get(row, 'url'),
        "description": f"Professional mobile phlebotomy services. {safe_get(row, 'categoryName', 'Medical services')} providing at-home blood draw services.",
        "services": ["At-Home Blood Draw", "Specimen Pickup", "Lab Partner"],
        "coverage": {
            "states": [safe_get(row, 'state')] if safe_get(row, 'state') else [],
            "cities": [safe_get(row, 'city')] if safe_get(row, 'city') else []
        },
        "address": {
            "street": safe_get(row, 'street'),
            "city": safe_get(row, 'city'),
            "state": safe_get(row, 'state'),
            "zip": safe_get(row, 'zip')
        },
        "availability": ["Weekdays"],
        "payment": ["Cash", "Major Insurance"],
        "rating": float(row.get('totalScore', 0)) if pd.notna(row.get('totalScore')) and row.get('totalScore') != 0 else None,
        "reviewsCount": int(row.get('reviewsCount', 0)) if pd.notna(row.get('reviewsCount')) and row.get('reviewsCount') != 0 else None,
        "badges": ["Certified", "Insured"],
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    providers.append(provider)

# Save to JSON
with open('data/providers.json', 'w', encoding='utf-8') as f:
    json.dump(providers, f, indent=2, ensure_ascii=False)

print(f"Converted {len(providers)} providers from your updated dataset to data/providers.json")