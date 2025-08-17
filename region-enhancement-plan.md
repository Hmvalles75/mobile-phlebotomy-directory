# Regional Provider Enhancement Plan

## Current Situation
- 745 total providers
- 567 providers with specific city addresses  
- 178 providers without specific addresses (need regional mapping)
- All providers currently only have state-level coverage defined

## Proposed Enhanced Data Structure

### 1. Add Regional Coverage Schema
```typescript
export const RegionSchema = z.object({
  name: z.string(), // e.g., "SF Bay Area", "Capital Region", "Metro Atlanta"
  type: z.enum(['metro', 'region', 'county', 'custom']),
  cities: z.array(z.string()), // Cities included in this region
  states: z.array(z.string()).optional(), // States if multi-state region
})

export const EnhancedCoverageSchema = z.object({
  states: z.array(z.string()),
  cities: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(), // Reference to region names
  zipPrefixes: z.array(z.string()).optional(),
  serviceRadius: z.number().optional(), // Miles from main location
})
```

### 2. Create Regional Mapping System

**Common Regions to Define:**
- SF Bay Area → San Francisco, Oakland, San Jose, etc.
- Capital Region (NY) → Albany, Troy, Schenectady, etc.  
- Metro Atlanta → Atlanta, Marietta, Alpharetta, etc.
- Greater Boston → Boston, Cambridge, Newton, etc.
- Tri-State Area → NYC metro spanning NY, NJ, CT

### 3. Multi-Tier Search Strategy

**When user searches for a city:**
1. **Direct Match**: Show providers specifically in that city
2. **Regional Match**: Show regional providers serving that city's area
3. **State Match**: Show statewide providers
4. **Distance Match**: Show providers within service radius

### 4. UI Enhancements

**Provider Display:**
- City-specific: "Mobile Phlebotomy Services in Boston, MA"
- Regional: "Mobile Phlebotomy Services in SF Bay Area"  
- Statewide: "Mobile Phlebotomy Services throughout California"

**Search Results Grouping:**
```
🎯 Local Providers in Boston (5)
🏢 Regional Providers serving Boston area (3)  
🗺️ Statewide Providers in Massachusetts (2)
```

## Implementation Steps

### Phase 1: Data Enhancement
1. Create regions.json with common metropolitan areas
2. Research and map the 178 providers without addresses to regions
3. Update provider schema to support regional coverage

### Phase 2: Search Enhancement  
1. Modify API to handle multi-tier search
2. Update city page to show regional providers
3. Add regional landing pages (e.g., /us/ca/sf-bay-area)

### Phase 3: UI Enhancement
1. Improve provider cards to show coverage type
2. Add coverage area visualization
3. Enhanced filtering by coverage type

## Benefits
- ✅ Better user experience - users find relevant providers
- ✅ Regional providers get appropriate visibility  
- ✅ More accurate search results
- ✅ Support for mobile providers' actual service areas
- ✅ SEO benefits from regional landing pages