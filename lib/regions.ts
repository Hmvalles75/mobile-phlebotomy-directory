// Regional mapping utilities
export interface Region {
  name: string;
  slug: string;
  type: 'metro' | 'region' | 'county' | 'custom';
  state: string;
  cities: string[];
}

// Helper function to get region by slug
export function getRegionBySlug(slug: string, regions: Region[]): Region | undefined {
  return regions.find(r => r.slug === slug);
}

// Helper function to find regions that include a city
export function getRegionsForCity(cityName: string, regions: Region[]): Region[] {
  return regions.filter(region => 
    region.cities.some(city => 
      city.toLowerCase() === cityName.toLowerCase()
    )
  );
}

// Helper function to get all cities covered by regions
export function getCitiesInRegions(regionSlugs: string[], regions: Region[]): string[] {
  const cities = new Set<string>();
  
  regionSlugs.forEach(slug => {
    const region = getRegionBySlug(slug, regions);
    if (region) {
      region.cities.forEach(city => cities.add(city));
    }
  });
  
  return Array.from(cities);
}

// Helper to determine if a provider serves a specific city
export function providerServesCity(
  provider: any, 
  cityName: string, 
  regions: Region[]
): boolean {
  // Direct city match
  if (provider.coverage.cities?.includes(cityName)) {
    return true;
  }
  
  // Regional match
  if (provider.coverage.regions) {
    const allCitiesInRegions = getCitiesInRegions(provider.coverage.regions, regions);
    return allCitiesInRegions.includes(cityName);
  }
  
  return false;
}

// Common regional mappings
export const REGION_MAPPINGS = {
  'capital-region-ny': ['Albany', 'Schenectady', 'Troy', 'Saratoga Springs'],
  'sf-bay-area': ['San Francisco', 'Oakland', 'San Jose', 'Fremont', 'Sunnyvale'],
  'greater-boston': ['Boston', 'Cambridge', 'Newton', 'Quincy', 'Somerville'],
  'metro-atlanta': ['Atlanta', 'Marietta', 'Alpharetta', 'Sandy Springs'],
  'tri-state-area': ['New York', 'Newark', 'Jersey City', 'Yonkers'],
} as const;