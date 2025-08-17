import fs from 'fs';
import path from 'path';
import { Provider } from './schemas';

interface Region {
  name: string;
  slug: string;
  type: 'metro' | 'region' | 'county' | 'custom';
  state: string;
  cities: string[];
}

// Cache for loaded data
let providersCache: Provider[] | null = null;
let regionsCache: Region[] | null = null;

function loadProviders(): Provider[] {
  if (!providersCache) {
    const providersPath = path.join(process.cwd(), 'data', 'providers.json');
    providersCache = JSON.parse(fs.readFileSync(providersPath, 'utf8'));
  }
  return providersCache;
}

function loadRegions(): Region[] {
  if (!regionsCache) {
    const regionsPath = path.join(process.cwd(), 'data', 'regions.json');
    regionsCache = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
  }
  return regionsCache;
}

// Clear cache when data updates
export function clearCache() {
  providersCache = null;
  regionsCache = null;
}

// Get regions that include a specific city
function getRegionsForCity(cityName: string, regions: Region[]): Region[] {
  return regions.filter(region =>
    region.cities.some(city =>
      city.toLowerCase() === cityName.toLowerCase()
    )
  );
}

// Get all cities covered by specific regions
function getCitiesInRegions(regionSlugs: string[], regions: Region[]): string[] {
  const cities = new Set<string>();

  regionSlugs.forEach(slug => {
    const region = regions.find(r => r.slug === slug);
    if (region) {
      region.cities.forEach(city => cities.add(city));
    }
  });

  return Array.from(cities);
}

// Enhanced city search that includes regional providers
export function getProvidersByCity(cityName: string, stateAbbr: string) {
  const providers = loadProviders();
  const regions = loadRegions();
  
  const results = {
    citySpecific: [] as Provider[],
    regional: [] as Provider[],
    statewide: [] as Provider[]
  };

  // Normalize inputs
  const normalizedCity = cityName.toLowerCase();
  const normalizedState = stateAbbr.toUpperCase();

  providers.forEach(provider => {
    // Check if provider serves this state
    const servesState = provider.coverage.states.some(state => 
      state.toUpperCase() === normalizedState
    );
    
    if (!servesState) return;

    // 1. Direct city match
    const hasDirectCityMatch = provider.coverage.cities?.some(city =>
      city.toLowerCase() === normalizedCity
    );

    // 2. Address city match  
    const hasAddressCityMatch = provider.address?.city?.toLowerCase() === normalizedCity;

    // 3. Regional match
    const hasRegionalMatch = provider.coverage.regions?.some(regionSlug => {
      const citiesInRegion = getCitiesInRegions([regionSlug], regions);
      return citiesInRegion.some(city => city.toLowerCase() === normalizedCity);
    });

    // 4. Statewide coverage (no specific cities or regions)
    const isStatewide = (!provider.coverage.cities || provider.coverage.cities.length === 0) &&
                       (!provider.coverage.regions || provider.coverage.regions.length === 0) &&
                       !provider.address?.city;

    // Categorize the provider
    if (hasDirectCityMatch || hasAddressCityMatch) {
      results.citySpecific.push(provider);
    } else if (hasRegionalMatch) {
      results.regional.push(provider);
    } else if (isStatewide) {
      results.statewide.push(provider);
    }
  });

  return results;
}

// Get all providers for a city (combined results)
export function getAllProvidersForCity(cityName: string, stateAbbr: string): Provider[] {
  const results = getProvidersByCity(cityName, stateAbbr);
  return [
    ...results.citySpecific,
    ...results.regional,
    ...results.statewide
  ];
}

// Search providers with regional awareness
export function searchProvidersWithRegions(
  query: string,
  filters: {
    city?: string;
    state?: string;
    services?: string[];
    availability?: string[];
    payment?: string[];
  } = {}
): Provider[] {
  const providers = loadProviders();
  const regions = loadRegions();

  let filteredProviders = providers;

  // Location filtering
  if (filters.city && filters.state) {
    filteredProviders = getAllProvidersForCity(filters.city, filters.state);
  } else if (filters.state) {
    filteredProviders = providers.filter(provider =>
      provider.coverage.states.some(state =>
        state.toUpperCase() === filters.state?.toUpperCase()
      )
    );
  }

  // Service filtering
  if (filters.services && filters.services.length > 0) {
    filteredProviders = filteredProviders.filter(provider =>
      filters.services!.some(service =>
        provider.services.includes(service as any)
      )
    );
  }

  // Availability filtering
  if (filters.availability && filters.availability.length > 0) {
    filteredProviders = filteredProviders.filter(provider =>
      filters.availability!.some(avail =>
        provider.availability?.includes(avail as any)
      )
    );
  }

  // Payment filtering
  if (filters.payment && filters.payment.length > 0) {
    filteredProviders = filteredProviders.filter(provider =>
      filters.payment!.some(payment =>
        provider.payment?.includes(payment as any)
      )
    );
  }

  // Text search
  if (query) {
    const normalizedQuery = query.toLowerCase();
    filteredProviders = filteredProviders.filter(provider =>
      provider.name.toLowerCase().includes(normalizedQuery) ||
      provider.description?.toLowerCase().includes(normalizedQuery) ||
      provider.services.some(service => service.toLowerCase().includes(normalizedQuery))
    );
  }

  return filteredProviders;
}

// Get coverage display text for a provider (user-focused)
export function getProviderCoverageDisplay(provider: Provider, currentCity?: string): string {
  const regions = loadRegions();
  
  // If has specific cities
  if (provider.coverage.cities && provider.coverage.cities.length > 0) {
    // If current city is in their coverage, highlight it
    if (currentCity && provider.coverage.cities.some(city => 
      city.toLowerCase() === currentCity.toLowerCase())) {
      return `Serves ${currentCity} + ${provider.coverage.cities.length - 1} other cities`;
    }
    
    if (provider.coverage.cities.length <= 3) {
      return `Serves ${provider.coverage.cities.join(', ')}`;
    } else {
      return `Serves ${provider.coverage.cities.slice(0, 2).join(', ')} + ${provider.coverage.cities.length - 2} more cities`;
    }
  }
  
  // If has regional coverage
  if (provider.coverage.regions && provider.coverage.regions.length > 0) {
    const regionNames = provider.coverage.regions
      .map(slug => regions.find(r => r.slug === slug)?.name)
      .filter(Boolean);
    
    return `Serves ${regionNames.join(' & ')}`;
  }
  
  // Statewide coverage
  const stateNames = provider.coverage.states.map(state => {
    const stateMap: Record<string, string> = {
      'CA': 'California', 'NY': 'New York', 'TX': 'Texas', 'FL': 'Florida',
      'IL': 'Illinois', 'PA': 'Pennsylvania', 'OH': 'Ohio', 'GA': 'Georgia',
      'NC': 'North Carolina', 'MI': 'Michigan', 'NJ': 'New Jersey', 'VA': 'Virginia',
      'WA': 'Washington', 'AZ': 'Arizona', 'MA': 'Massachusetts', 'TN': 'Tennessee',
      'IN': 'Indiana', 'MO': 'Missouri', 'MD': 'Maryland', 'WI': 'Wisconsin',
      'CO': 'Colorado', 'MN': 'Minnesota', 'SC': 'South Carolina', 'AL': 'Alabama',
      'LA': 'Louisiana', 'KY': 'Kentucky', 'OR': 'Oregon', 'OK': 'Oklahoma',
      'CT': 'Connecticut', 'UT': 'Utah', 'IA': 'Iowa', 'NV': 'Nevada',
      'AR': 'Arkansas', 'MS': 'Mississippi', 'KS': 'Kansas', 'NM': 'New Mexico',
      'NE': 'Nebraska', 'WV': 'West Virginia', 'ID': 'Idaho', 'HI': 'Hawaii',
      'NH': 'New Hampshire', 'ME': 'Maine', 'RI': 'Rhode Island', 'MT': 'Montana',
      'DE': 'Delaware', 'SD': 'South Dakota', 'ND': 'North Dakota', 'AK': 'Alaska',
      'VT': 'Vermont', 'WY': 'Wyoming', 'DC': 'Washington DC'
    };
    return stateMap[state] || state;
  });
  
  return `Serves all of ${stateNames.join(' & ')}`;
}

// Helper to determine coverage type for UI display
export function getProviderCoverageType(provider: Provider): 'city' | 'regional' | 'statewide' {
  if (provider.coverage.cities && provider.coverage.cities.length > 0) {
    return 'city';
  }
  
  if (provider.coverage.regions && provider.coverage.regions.length > 0) {
    return 'regional';
  }
  
  return 'statewide';
}