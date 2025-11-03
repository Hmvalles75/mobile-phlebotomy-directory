// ZIP code geocoding and routing utilities

// Basic ZIP to state mapping for fallback
function getStateFromZipCode(zipCode: string): { name: string; abbr: string } | null {
  const zip = parseInt(zipCode);
  
  // Basic ZIP code ranges to states
  if (zip >= 90000 && zip <= 96199) return { name: 'California', abbr: 'CA' };
  if (zip >= 10000 && zip <= 14999) return { name: 'New York', abbr: 'NY' };
  if (zip >= 33000 && zip <= 34999) return { name: 'Florida', abbr: 'FL' };
  if (zip >= 75000 && zip <= 79999) return { name: 'Texas', abbr: 'TX' };
  if (zip >= 85000 && zip <= 86999) return { name: 'Arizona', abbr: 'AZ' };
  if (zip >= 80000 && zip <= 81999) return { name: 'Colorado', abbr: 'CO' };
  if (zip >= 98000 && zip <= 99999) return { name: 'Washington', abbr: 'WA' };
  if (zip >= 97000 && zip <= 97999) return { name: 'Oregon', abbr: 'OR' };
  if (zip >= 89000 && zip <= 89999) return { name: 'Nevada', abbr: 'NV' };
  if (zip >= 84000 && zip <= 84999) return { name: 'Utah', abbr: 'UT' };
  if (zip >= 83000 && zip <= 83999) return { name: 'Idaho', abbr: 'ID' };
  if (zip >= 59000 && zip <= 59999) return { name: 'Montana', abbr: 'MT' };
  if (zip >= 58000 && zip <= 58999) return { name: 'North Dakota', abbr: 'ND' };
  if (zip >= 57000 && zip <= 57999) return { name: 'South Dakota', abbr: 'SD' };
  if (zip >= 82000 && zip <= 83199) return { name: 'Wyoming', abbr: 'WY' };
  if (zip >= 35000 && zip <= 36999) return { name: 'Alabama', abbr: 'AL' };
  if (zip >= 99500 && zip <= 99999) return { name: 'Alaska', abbr: 'AK' };
  if (zip >= 71600 && zip <= 72999) return { name: 'Arkansas', abbr: 'AR' };
  if (zip >= 30000 && zip <= 31999) return { name: 'Georgia', abbr: 'GA' };
  if (zip >= 96700 && zip <= 96999) return { name: 'Hawaii', abbr: 'HI' };
  if (zip >= 60000 && zip <= 62999) return { name: 'Illinois', abbr: 'IL' };
  if (zip >= 46000 && zip <= 47999) return { name: 'Indiana', abbr: 'IN' };
  if (zip >= 50000 && zip <= 52999) return { name: 'Iowa', abbr: 'IA' };
  if (zip >= 66000 && zip <= 67999) return { name: 'Kansas', abbr: 'KS' };
  if (zip >= 40000 && zip <= 42999) return { name: 'Kentucky', abbr: 'KY' };
  if (zip >= 70000 && zip <= 71599) return { name: 'Louisiana', abbr: 'LA' };
  if (zip >= 3900 && zip <= 4999) return { name: 'Maine', abbr: 'ME' };
  if (zip >= 20600 && zip <= 21999) return { name: 'Maryland', abbr: 'MD' };
  if (zip >= 1000 && zip <= 2799) return { name: 'Massachusetts', abbr: 'MA' };
  if (zip >= 48000 && zip <= 49999) return { name: 'Michigan', abbr: 'MI' };
  if (zip >= 55000 && zip <= 56999) return { name: 'Minnesota', abbr: 'MN' };
  if (zip >= 38600 && zip <= 39999) return { name: 'Mississippi', abbr: 'MS' };
  if (zip >= 63000 && zip <= 65999) return { name: 'Missouri', abbr: 'MO' };
  if (zip >= 68000 && zip <= 69999) return { name: 'Nebraska', abbr: 'NE' };
  if (zip >= 3000 && zip <= 3899) return { name: 'New Hampshire', abbr: 'NH' };
  if (zip >= 7000 && zip <= 8999) return { name: 'New Jersey', abbr: 'NJ' };
  if (zip >= 87000 && zip <= 88999) return { name: 'New Mexico', abbr: 'NM' };
  if (zip >= 27000 && zip <= 28999) return { name: 'North Carolina', abbr: 'NC' };
  if (zip >= 43000 && zip <= 45999) return { name: 'Ohio', abbr: 'OH' };
  if (zip >= 73000 && zip <= 74999) return { name: 'Oklahoma', abbr: 'OK' };
  if (zip >= 15000 && zip <= 19699) return { name: 'Pennsylvania', abbr: 'PA' };
  if (zip >= 2800 && zip <= 2999) return { name: 'Rhode Island', abbr: 'RI' };
  if (zip >= 29000 && zip <= 29999) return { name: 'South Carolina', abbr: 'SC' };
  if (zip >= 37000 && zip <= 38599) return { name: 'Tennessee', abbr: 'TN' };
  if (zip >= 5000 && zip <= 5999) return { name: 'Vermont', abbr: 'VT' };
  if (zip >= 20100 && zip <= 20199) return { name: 'Virginia', abbr: 'VA' };
  if (zip >= 22000 && zip <= 24699) return { name: 'Virginia', abbr: 'VA' };
  if (zip >= 53000 && zip <= 54999) return { name: 'Wisconsin', abbr: 'WI' };
  if (zip >= 25000 && zip <= 26999) return { name: 'West Virginia', abbr: 'WV' };
  if (zip >= 20000 && zip <= 20099) return { name: 'District of Columbia', abbr: 'DC' };
  
  return null;
}

interface ZipCodeLocation {
  zipCode: string;
  city: string;
  state: string;
  stateAbbr: string;
  county: string;
  metroArea?: string;
  locationType: 'major-city' | 'suburb' | 'small-city' | 'rural';
  population?: number;
}

interface LocationRouting {
  route: string;
  routeType: 'city' | 'region' | 'state' | 'search';
  displayName: string;
}

// Basic ZIP code validation
export function isValidZipCode(input: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(input.trim());
}

// City slug conversion utility
function createCitySlug(cityName: string): string {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// State name to slug conversion
function createStateSlug(stateName: string): string {
  return stateName
    .toLowerCase()
    .replace(/\s+/g, '-');
}

// Major cities that should get direct city page routing
const MAJOR_CITIES = new Set([
  'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
  'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
  'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis',
  'seattle', 'denver', 'washington', 'boston', 'el paso', 'detroit',
  'nashville', 'memphis', 'portland', 'oklahoma city', 'las vegas',
  'louisville', 'baltimore', 'milwaukee', 'albuquerque', 'tucson',
  'fresno', 'mesa', 'sacramento', 'atlanta', 'kansas city', 'colorado springs',
  'miami', 'raleigh', 'omaha', 'long beach', 'virginia beach', 'oakland',
  'minneapolis', 'tulsa', 'tampa', 'arlington', 'new orleans', 'wichita',
  'cleveland', 'bakersfield', 'aurora', 'anaheim', 'honolulu', 'santa ana',
  'corpus christi', 'riverside', 'lexington', 'stockton', 'toledo',
  'st. paul', 'newark', 'greensboro', 'plano', 'henderson', 'lincoln',
  'buffalo', 'jersey city', 'chula vista', 'fort wayne', 'orlando',
  'st. petersburg', 'chandler', 'laredo', 'norfolk', 'durham', 'madison'
]);

// Metro areas for routing to regional pages
const METRO_AREAS: Record<string, { name: string, slug: string, cities: string[] }> = {
  'sf-bay-area': {
    name: 'SF Bay Area',
    slug: 'sf-bay-area',
    cities: ['san francisco', 'oakland', 'san jose', 'fremont', 'hayward', 'sunnyvale', 'santa clara', 'berkeley', 'richmond', 'daly city']
  },
  'greater-los-angeles': {
    name: 'Greater Los Angeles',
    slug: 'greater-los-angeles', 
    cities: ['los angeles', 'long beach', 'anaheim', 'santa ana', 'riverside', 'stockton', 'irvine', 'chula vista', 'fremont', 'san bernardino']
  },
  'greater-miami': {
    name: 'Greater Miami',
    slug: 'greater-miami',
    cities: ['miami', 'fort lauderdale', 'hialeah', 'hollywood', 'coral springs', 'miramar', 'pompano beach', 'davie', 'deerfield beach', 'boynton beach']
  },
  'dallas-fort-worth': {
    name: 'Dallas-Fort Worth',
    slug: 'dallas-fort-worth',
    cities: ['dallas', 'fort worth', 'arlington', 'plano', 'garland', 'irving', 'grand prairie', 'mesquite', 'carrollton', 'richardson']
  },
  'greater-houston': {
    name: 'Greater Houston', 
    slug: 'greater-houston',
    cities: ['houston', 'sugar land', 'baytown', 'conroe', 'galveston', 'league city', 'pearland', 'missouri city', 'texas city', 'friendswood']
  },
  'capital-region-ny': {
    name: 'Capital Region',
    slug: 'capital-region',
    cities: ['albany', 'schenectady', 'troy', 'saratoga springs', 'cohoes', 'watervliet', 'rensselaer', 'colonie']
  }
};

// Simulate ZIP code geocoding (in production, use a real geocoding service)
export async function geocodeZipCode(zipCode: string): Promise<ZipCodeLocation | null> {
  if (!isValidZipCode(zipCode)) {
    return null;
  }

  // Basic ZIP to location mapping (normally would call external API)
  const zipMappings: Record<string, Omit<ZipCodeLocation, 'zipCode'>> = {
    // New York major cities
    '10001': { city: 'New York', state: 'New York', stateAbbr: 'NY', county: 'New York', locationType: 'major-city', population: 8000000 },
    '10010': { city: 'New York', state: 'New York', stateAbbr: 'NY', county: 'New York', locationType: 'major-city', population: 8000000 },
    '10019': { city: 'New York', state: 'New York', stateAbbr: 'NY', county: 'New York', locationType: 'major-city', population: 8000000 },
    '11201': { city: 'Brooklyn', state: 'New York', stateAbbr: 'NY', county: 'Kings', locationType: 'major-city', population: 2500000 },
    '10451': { city: 'Bronx', state: 'New York', stateAbbr: 'NY', county: 'Bronx', locationType: 'major-city', population: 1400000 },
    '12201': { city: 'Albany', state: 'New York', stateAbbr: 'NY', county: 'Albany', locationType: 'small-city', metroArea: 'capital-region-ny', population: 100000 },
    
    // California major cities
    '90210': { city: 'Beverly Hills', state: 'California', stateAbbr: 'CA', county: 'Los Angeles', locationType: 'suburb', metroArea: 'greater-los-angeles', population: 35000 },
    '90001': { city: 'Los Angeles', state: 'California', stateAbbr: 'CA', county: 'Los Angeles', locationType: 'major-city', population: 4000000 },
    '91773': { city: 'San Dimas', state: 'California', stateAbbr: 'CA', county: 'Los Angeles', locationType: 'suburb', metroArea: 'greater-los-angeles', population: 34000 },
    '94102': { city: 'San Francisco', state: 'California', stateAbbr: 'CA', county: 'San Francisco', locationType: 'major-city', metroArea: 'sf-bay-area', population: 875000 },
    '95101': { city: 'San Jose', state: 'California', stateAbbr: 'CA', county: 'Santa Clara', locationType: 'major-city', metroArea: 'sf-bay-area', population: 1000000 },
    '94601': { city: 'Oakland', state: 'California', stateAbbr: 'CA', county: 'Alameda', locationType: 'suburb', metroArea: 'sf-bay-area', population: 430000 },
    
    // Florida
    '33101': { city: 'Miami', state: 'Florida', stateAbbr: 'FL', county: 'Miami-Dade', locationType: 'major-city', metroArea: 'greater-miami', population: 470000 },
    '33301': { city: 'Fort Lauderdale', state: 'Florida', stateAbbr: 'FL', county: 'Broward', locationType: 'suburb', metroArea: 'greater-miami', population: 180000 },
    '33134': { city: 'Coral Gables', state: 'Florida', stateAbbr: 'FL', county: 'Miami-Dade', locationType: 'suburb', metroArea: 'greater-miami', population: 50000 },
    '32801': { city: 'Orlando', state: 'Florida', stateAbbr: 'FL', county: 'Orange', locationType: 'major-city', population: 280000 },
    
    // Texas
    '77001': { city: 'Houston', state: 'Texas', stateAbbr: 'TX', county: 'Harris', locationType: 'major-city', metroArea: 'greater-houston', population: 2300000 },
    '75201': { city: 'Dallas', state: 'Texas', stateAbbr: 'TX', county: 'Dallas', locationType: 'major-city', metroArea: 'dallas-fort-worth', population: 1300000 },
    '76101': { city: 'Fort Worth', state: 'Texas', stateAbbr: 'TX', county: 'Tarrant', locationType: 'major-city', metroArea: 'dallas-fort-worth', population: 900000 },
    '78701': { city: 'Austin', state: 'Texas', stateAbbr: 'TX', county: 'Travis', locationType: 'major-city', population: 950000 },
    
    // Illinois
    '60601': { city: 'Chicago', state: 'Illinois', stateAbbr: 'IL', county: 'Cook', locationType: 'major-city', population: 2700000 },
    
    // Ohio
    '43201': { city: 'Columbus', state: 'Ohio', stateAbbr: 'OH', county: 'Franklin', locationType: 'major-city', population: 900000 },
    '44101': { city: 'Cleveland', state: 'Ohio', stateAbbr: 'OH', county: 'Cuyahoga', locationType: 'major-city', population: 385000 },
    '45201': { city: 'Cincinnati', state: 'Ohio', stateAbbr: 'OH', county: 'Hamilton', locationType: 'major-city', population: 300000 },
    
    // Small cities/rural examples
    '12345': { city: 'Schenectady', state: 'New York', stateAbbr: 'NY', county: 'Schenectady', locationType: 'small-city', metroArea: 'capital-region-ny', population: 65000 },
    '67890': { city: 'Rural Town', state: 'Montana', stateAbbr: 'MT', county: 'Rural County', locationType: 'rural', population: 2000 }
  };

  const clean5DigitZip = zipCode.slice(0, 5);
  const locationData = zipMappings[clean5DigitZip];
  
  if (!locationData) {
    // For unknown ZIPs, try to at least determine the state
    const stateFromZip = getStateFromZipCode(clean5DigitZip);
    if (stateFromZip) {
      return {
        zipCode: clean5DigitZip,
        city: 'Unknown City',
        state: stateFromZip.name,
        stateAbbr: stateFromZip.abbr,
        county: 'Unknown County',
        locationType: 'small-city' as const,
        population: 25000
      };
    }
    
    // Return null if we can't even determine the state
    return null;
  }

  return {
    zipCode: clean5DigitZip,
    ...locationData
  };
}

// Determine optimal routing for a ZIP code location
export function getLocationRouting(location: ZipCodeLocation): LocationRouting {
  const citySlug = createCitySlug(location.city);
  const stateSlug = createStateSlug(location.state);
  
  // Route to major city page if it's a major city
  if (location.locationType === 'major-city' && MAJOR_CITIES.has(location.city.toLowerCase())) {
    return {
      route: `/us/${stateSlug}/${citySlug}`,
      routeType: 'city',
      displayName: `${location.city}, ${location.stateAbbr}`
    };
  }
  
  // Route to metro area's main city if available, otherwise to state page
  if (location.metroArea && METRO_AREAS[location.metroArea]) {
    const metro = METRO_AREAS[location.metroArea];
    
    // Try to route to the main city if it's in our major cities list
    const mainCity = metro.cities.find(city => MAJOR_CITIES.has(city.toLowerCase()));
    if (mainCity) {
      const mainCitySlug = createCitySlug(mainCity);
      return {
        route: `/us/${stateSlug}/${mainCitySlug}`,
        routeType: 'city',
        displayName: `${mainCity}, ${location.stateAbbr} (${metro.name} area)`
      };
    }
    
    // Fall back to state page with metro area context
    return {
      route: `/us/${stateSlug}?metro=${metro.slug}&zip=${location.zipCode}`,
      routeType: 'state',
      displayName: `${metro.name}, ${location.stateAbbr}`
    };
  }
  
  // Route to suburb's main city if it exists in our city mapping
  if (location.locationType === 'suburb' && MAJOR_CITIES.has(location.city.toLowerCase())) {
    return {
      route: `/us/${stateSlug}/${citySlug}`,
      routeType: 'city',
      displayName: `${location.city}, ${location.stateAbbr}`
    };
  }
  
  // For small cities and rural areas, route to state page with ZIP filter
  return {
    route: `/us/${stateSlug}?zip=${location.zipCode}`,
    routeType: 'state',
    displayName: `${location.city}, ${location.stateAbbr} (${location.zipCode})`
  };
}

// Main function to handle ZIP code search
export async function handleZipCodeSearch(zipCode: string): Promise<LocationRouting | null> {
  const location = await geocodeZipCode(zipCode);
  if (!location) {
    return null;
  }
  
  return getLocationRouting(location);
}

// Helper to detect if a search query is a ZIP code
export function detectSearchType(query: string): 'zipcode' | 'text' {
  const trimmed = query.trim();
  return isValidZipCode(trimmed) ? 'zipcode' : 'text';
}

// State abbreviation to full name mapping
const STATE_ABBR_TO_NAME: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

// Parse city name from query (e.g., "San Diego, CA" -> { city: "San Diego", state: "CA" })
export function parseCityQuery(query: string): { city: string; stateAbbr: string } | null {
  // Match patterns like "San Diego, CA" or "San Diego CA"
  const match = query.trim().match(/^([A-Za-z\s]+),?\s+([A-Z]{2})$/);
  if (!match) return null;

  const city = match[1].trim();
  const stateAbbr = match[2].toUpperCase();

  // Validate state abbreviation
  if (!STATE_ABBR_TO_NAME[stateAbbr]) return null;

  return { city, stateAbbr };
}

// Handle state name search routing (e.g., "Pennsylvania" or "PA")
export function handleStateNameSearch(query: string): LocationRouting | null {
  const trimmedQuery = query.trim();

  // Check if it's a state abbreviation
  const upperQuery = trimmedQuery.toUpperCase();
  if (STATE_ABBR_TO_NAME[upperQuery]) {
    const stateName = STATE_ABBR_TO_NAME[upperQuery];
    const stateSlug = createStateSlug(stateName);
    return {
      route: `/us/${stateSlug}`,
      routeType: 'state',
      displayName: stateName
    };
  }

  // Check if it's a full state name
  const lowerQuery = trimmedQuery.toLowerCase();
  for (const [abbr, name] of Object.entries(STATE_ABBR_TO_NAME)) {
    if (name.toLowerCase() === lowerQuery) {
      const stateSlug = createStateSlug(name);
      return {
        route: `/us/${stateSlug}`,
        routeType: 'state',
        displayName: name
      };
    }
  }

  return null;
}

// Handle city name search routing
export function handleCityNameSearch(query: string): LocationRouting | null {
  const parsed = parseCityQuery(query);
  if (!parsed) return null;

  const { city, stateAbbr } = parsed;
  const stateName = STATE_ABBR_TO_NAME[stateAbbr];

  // Check if it's a major city
  if (MAJOR_CITIES.has(city.toLowerCase())) {
    const citySlug = createCitySlug(city);
    const stateSlug = createStateSlug(stateName);

    return {
      route: `/us/${stateSlug}/${citySlug}`,
      routeType: 'city',
      displayName: `${city}, ${stateAbbr}`
    };
  }

  // Fall back to state page
  const stateSlug = createStateSlug(stateName);
  return {
    route: `/us/${stateSlug}`,
    routeType: 'state',
    displayName: stateName
  };
}