/**
 * Market Configuration
 *
 * This module defines the market lock system that allows the site to be focused
 * on a specific metropolitan area while preserving the national directory.
 *
 * HOW IT WORKS:
 * - When ENABLE_MARKET_LOCK is true, the homepage experience is tailored to the
 *   specified market (e.g., Los Angeles)
 * - CTAs, hero copy, and featured content prioritize the locked market
 * - The national directory (/us/*, /metros, etc.) remains fully functional
 * - Users can still navigate to any state/city page directly
 *
 * TO CHANGE MARKETS:
 * 1. Update MARKET_SLUG to match a slug from data/top-metros.ts
 * 2. Update MARKET_NAME, MARKET_STATE, MARKET_AREA accordingly
 * 3. Optionally update GEO_COPY for market-specific messaging
 * 4. Optionally update DEFAULT_ZIPS for the new market
 *
 * TO DISABLE MARKET LOCK:
 * Set ENABLE_MARKET_LOCK = false to restore national homepage experience
 */

export interface MarketConfig {
  /** Enable/disable market lock - when false, site operates as national directory */
  ENABLE_MARKET_LOCK: boolean

  /** URL slug for the market (must match a slug in data/top-metros.ts) */
  MARKET_SLUG: string

  /** Display name for the market */
  MARKET_NAME: string

  /** State abbreviation (e.g., "CA") */
  MARKET_STATE: string

  /** Full state name */
  MARKET_STATE_NAME: string

  /** Geographic area description (e.g., "Los Angeles County") */
  MARKET_AREA: string

  /** Sample ZIP codes for the market (used for default form values, etc.) */
  DEFAULT_ZIPS: string[]

  /** Market-specific copy for hero sections and CTAs */
  GEO_COPY: {
    headline: string
    subheadline: string
    ctaText: string
    trustSignal: string
  }
}

/**
 * Current market configuration
 *
 * Currently locked to Los Angeles metro area.
 * Change ENABLE_MARKET_LOCK to false to restore national experience.
 */
export const MARKET_CONFIG: MarketConfig = {
  // Toggle this to enable/disable market lock
  ENABLE_MARKET_LOCK: false,

  // Los Angeles market settings
  MARKET_SLUG: 'los-angeles',
  MARKET_NAME: 'Los Angeles',
  MARKET_STATE: 'CA',
  MARKET_STATE_NAME: 'California',
  MARKET_AREA: 'Los Angeles County',

  // Sample LA ZIP codes (covers different areas)
  DEFAULT_ZIPS: [
    '90210', // Beverly Hills
    '90001', // South LA
    '90012', // Downtown
    '90024', // Westwood
    '90028', // Hollywood
    '91101', // Pasadena
    '90802', // Long Beach
  ],

  // LA-specific marketing copy
  GEO_COPY: {
    headline: 'Mobile Phlebotomy in Los Angeles',
    subheadline: 'Licensed phlebotomists serving Los Angeles County. Same-day appointments available.',
    ctaText: 'Find a Phlebotomist in LA',
    trustSignal: 'Serving all of Los Angeles County'
  }
}

/**
 * Helper function to check if market lock is enabled
 */
export function isMarketLocked(): boolean {
  return MARKET_CONFIG.ENABLE_MARKET_LOCK
}

/**
 * Get the URL path for the locked market's metro page
 */
export function getMarketMetroPath(): string {
  return `/us/metro/${MARKET_CONFIG.MARKET_SLUG}`
}

/**
 * Get the URL path for the locked market's state page
 */
export function getMarketStatePath(): string {
  return `/us/${MARKET_CONFIG.MARKET_STATE_NAME.toLowerCase().replace(/\s+/g, '-')}`
}

/**
 * Get market-appropriate headline - returns market copy if locked, generic if not
 */
export function getHeadline(genericHeadline: string): string {
  return MARKET_CONFIG.ENABLE_MARKET_LOCK
    ? MARKET_CONFIG.GEO_COPY.headline
    : genericHeadline
}

/**
 * Get market-appropriate subheadline
 */
export function getSubheadline(genericSubheadline: string): string {
  return MARKET_CONFIG.ENABLE_MARKET_LOCK
    ? MARKET_CONFIG.GEO_COPY.subheadline
    : genericSubheadline
}

/**
 * Get market-appropriate CTA text
 */
export function getCtaText(genericCtaText: string): string {
  return MARKET_CONFIG.ENABLE_MARKET_LOCK
    ? MARKET_CONFIG.GEO_COPY.ctaText
    : genericCtaText
}

/**
 * Get the URL path for the market's dedicated request page
 * e.g., /los-angeles/request
 */
export function getMarketRequestPath(): string {
  return `/${MARKET_CONFIG.MARKET_SLUG}/request`
}

/**
 * Get the URL path for the market request page with ZIP
 * e.g., /los-angeles/request?zip=90210
 */
export function getMarketRequestPathWithZip(zip: string): string {
  return `/${MARKET_CONFIG.MARKET_SLUG}/request?zip=${encodeURIComponent(zip)}`
}

/**
 * Get the primary CTA destination URL
 * - If market locked: goes to market's request page (capture ZIP first)
 * - If not locked: goes to search page (national)
 */
export function getPrimaryCtaPath(): string {
  return MARKET_CONFIG.ENABLE_MARKET_LOCK
    ? getMarketRequestPath()
    : '/search'
}

/**
 * Check if a given slug matches the locked market
 */
export function isLockedMarket(slug: string): boolean {
  return MARKET_CONFIG.ENABLE_MARKET_LOCK && slug === MARKET_CONFIG.MARKET_SLUG
}

/**
 * LA County ZIP code prefixes
 * Covers core LA (900-905), Long Beach (907-908), and San Fernando/Pasadena areas (910-918)
 */
const LA_COUNTY_ZIP_PREFIXES = [
  '900', '901', '902', '903', '904', '905', '906', '907', '908',
  '910', '911', '912', '913', '914', '915', '916', '917', '918'
]

/**
 * Check if a ZIP code is within LA County coverage area
 * Returns true for ZIPs with LA County prefixes, false otherwise
 */
export function isInLACountyCoverage(zip: string): boolean {
  if (!zip || zip.length !== 5) return false
  const prefix = zip.slice(0, 3)
  return LA_COUNTY_ZIP_PREFIXES.includes(prefix)
}
