/**
 * Location normalization utilities for consistent filtering
 */

// State abbreviation to full name mapping
const STATE_MAP: Record<string, string> = {
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

// Reverse mapping: full name to abbreviation
const STATE_NAME_TO_ABBR: Record<string, string> = Object.entries(STATE_MAP).reduce((acc, [abbr, name]) => {
  acc[name.toLowerCase()] = abbr
  return acc
}, {} as Record<string, string>)

/**
 * Normalize a state input to its abbreviation
 * @param input - State name or abbreviation (e.g., "Michigan", "MI", "mi")
 * @returns State abbreviation in uppercase (e.g., "MI") or null if invalid
 */
export function normalizeState(input: string): string | null {
  const trimmed = input.trim()
  const upper = trimmed.toUpperCase()

  // Check if it's already a valid abbreviation
  if (STATE_MAP[upper]) {
    return upper
  }

  // Check if it's a full state name
  const lower = trimmed.toLowerCase()
  if (STATE_NAME_TO_ABBR[lower]) {
    return STATE_NAME_TO_ABBR[lower]
  }

  return null
}

/**
 * Normalize a city input to a consistent format
 * @param input - City name (e.g., "detroit", "DETROIT", " Detroit ")
 * @returns Normalized city name in title case (e.g., "Detroit")
 */
export function normalizeCity(input: string): string {
  const trimmed = input.trim()
  // Convert to title case: first letter uppercase, rest lowercase
  return trimmed
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if a string looks like a US state
 * @param input - String to check
 * @returns true if it looks like a state name or abbreviation
 */
export function looksLikeState(input: string): boolean {
  return normalizeState(input) !== null
}

/**
 * Parse a location slug like "detroit-mi" into city and state
 * @param slug - Location slug (e.g., "detroit-mi", "new-york-ny")
 * @returns Object with city and state, or null if invalid
 */
export function parseLocationSlug(slug: string): { city: string; state: string } | null {
  const parts = slug.split('-')

  if (parts.length < 2) {
    return null
  }

  // Last part should be state abbreviation
  const potentialState = parts[parts.length - 1]
  const stateAbbr = normalizeState(potentialState)

  if (!stateAbbr) {
    return null
  }

  // Everything before the state is the city name
  const cityParts = parts.slice(0, -1)
  const city = normalizeCity(cityParts.join(' '))

  return { city, state: stateAbbr }
}

/**
 * Get the full state name from abbreviation
 * @param abbr - State abbreviation (e.g., "MI")
 * @returns Full state name (e.g., "Michigan") or null if invalid
 */
export function getStateName(abbr: string): string | null {
  return STATE_MAP[abbr.toUpperCase()] || null
}
