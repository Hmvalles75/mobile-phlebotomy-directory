import pandas as pd
import json
from datetime import datetime

# Read your updated dataset
df = pd.read_csv('dataset_crawler-google-places_2025-08-15_13-25-00-192.csv')

# Convert to the JSON format your site expects
providers = []
for index, row in df.iterrows():
    provider = {
        "id": str(index + 1),
        "name": row.get('title', ''),
        "slug": str(row.get('title', '')).lower().replace(' ', '-').replace('&', 'and').replace(',', '').replace('.', ''),
        "phone": row.get('phone', ''),
        "website": row.get('website', ''),
        "bookingUrl": row.get('url', ''),
        "description": f"Professional mobile phlebotomy services. {row.get('categoryName', 'Medical services')} providing at-home blood draw services.",
        "services": ["At-Home Blood Draw", "Specimen Pickup", "Lab Partner"],
        "coverage": {
            "states": [row.get('state', '')] if row.get('state') else [],
            "cities": [row.get('city', '')] if row.get('city') else []
        },
        "address": {
            "street": row.get('street', ''),
            "city": row.get('city', ''),
            "state": row.get('state', ''),
            "zip": row.get('zip', '')
        },
        "availability": ["Weekdays"],
        "payment": ["Cash", "Major Insurance"],
        "rating": row.get('totalScore', 0) if pd.notna(row.get('totalScore')) else None,
        "reviewsCount": row.get('reviewsCount', 0) if pd.notna(row.get('reviewsCount')) else None,
        "badges": ["Certified", "Insured"],
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    providers.append(provider)

# Save to JSON
with open('data/providers.json', 'w', encoding='utf-8') as f:
    json.dump(providers, f, indent=2, ensure_ascii=False)

print(f"Converted {len(providers)} providers from your updated dataset to data/providers.json")