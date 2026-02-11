/**
 * Nationwide ZIP code to lat/lng geocoding using the zipcodes package
 * Covers all US ZIP codes (~40,000 entries)
 */
import zipcodes from 'zipcodes'

interface Coordinates {
  lat: number
  lng: number
}

/**
 * Get coordinates for any US ZIP code
 * Returns null if ZIP code not found
 */
export function getZipCoordinates(zip: string): Coordinates | null {
  // Normalize ZIP (remove spaces, dashes, take first 5 digits)
  const normalizedZip = zip.replace(/[\s-]/g, '').slice(0, 5)

  // Look up in zipcodes database
  const location = zipcodes.lookup(normalizedZip)

  if (location && location.latitude && location.longitude) {
    return {
      lat: location.latitude,
      lng: location.longitude
    }
  }

  return null
}

/**
 * Get full location info for a ZIP code
 */
export function getZipInfo(zip: string) {
  const normalizedZip = zip.replace(/[\s-]/g, '').slice(0, 5)
  return zipcodes.lookup(normalizedZip)
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate distance between two ZIP codes
 * Returns distance in miles or null if either ZIP not found
 */
export function getDistanceBetweenZips(zip1: string, zip2: string): number | null {
  const coords1 = getZipCoordinates(zip1)
  const coords2 = getZipCoordinates(zip2)

  if (!coords1 || !coords2) {
    return null
  }

  return calculateDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng)
}

/**
 * Check if a lead is within the provider's service radius
 */
export function isLeadInServiceRadius(
  providerZip: string,
  leadZip: string,
  radiusMiles: number
): boolean {
  // Normalize ZIPs
  const normalizedProviderZip = providerZip.replace(/[\s-]/g, '').slice(0, 5)
  const normalizedLeadZip = leadZip.replace(/[\s-]/g, '').slice(0, 5)

  // Exact match always works
  if (normalizedProviderZip === normalizedLeadZip) {
    return true
  }

  const distance = getDistanceBetweenZips(normalizedProviderZip, normalizedLeadZip)

  if (distance === null) {
    // If we can't calculate distance, fall back to exact ZIP match only
    return false
  }

  return distance <= radiusMiles
}

/**
 * Find all ZIP codes within a radius of a given ZIP
 * Useful for expanding provider service areas
 */
export function getZipsInRadius(centerZip: string, radiusMiles: number): string[] {
  const normalizedZip = centerZip.replace(/[\s-]/g, '').slice(0, 5)

  // Use zipcodes package's radius lookup
  const results = zipcodes.radius(normalizedZip, radiusMiles)

  if (!results) return []

  // Results can be strings or objects depending on version
  return results.map((r: any) => typeof r === 'string' ? r : r.zip)
}
