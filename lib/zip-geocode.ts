/**
 * Simple ZIP code to lat/lng geocoding
 * For production, you'd use a proper geocoding API or database
 * This uses approximate coordinates for common California ZIP codes
 */

interface Coordinates {
  lat: number
  lng: number
}

// Approximate coordinates for CA ZIP code ranges
const CA_ZIP_COORDS: Record<string, Coordinates> = {
  // Los Angeles area (900xx)
  '90001': { lat: 33.9731, lng: -118.2479 },
  '90002': { lat: 33.9499, lng: -118.2468 },
  '90003': { lat: 33.9642, lng: -118.2728 },
  '90004': { lat: 34.0766, lng: -118.3092 },
  '90005': { lat: 34.0599, lng: -118.3089 },
  '90006': { lat: 34.0486, lng: -118.2933 },
  '90007': { lat: 34.0260, lng: -118.2833 },
  '90008': { lat: 34.0115, lng: -118.3414 },
  '90011': { lat: 33.9946, lng: -118.2580 },
  '90012': { lat: 34.0613, lng: -118.2380 },
  '90013': { lat: 34.0438, lng: -118.2467 },
  '90014': { lat: 34.0445, lng: -118.2520 },
  '90015': { lat: 34.0390, lng: -118.2668 },
  '90016': { lat: 34.0319, lng: -118.3525 },
  '90017': { lat: 34.0522, lng: -118.2437 },
  '90018': { lat: 34.0267, lng: -118.3089 },
  '90019': { lat: 34.0470, lng: -118.3414 },
  '90020': { lat: 34.0652, lng: -118.3092 },
  '90021': { lat: 34.0333, lng: -118.2361 },
  '90022': { lat: 34.0239, lng: -118.1553 },
  '90023': { lat: 34.0239, lng: -118.2036 },
  '90024': { lat: 34.0631, lng: -118.4420 },
  '90025': { lat: 34.0431, lng: -118.4436 },
  '90026': { lat: 34.0777, lng: -118.2615 },
  '90027': { lat: 34.1053, lng: -118.2922 },
  '90028': { lat: 34.1016, lng: -118.3287 },
  '90029': { lat: 34.0925, lng: -118.2937 },
  '90031': { lat: 34.0893, lng: -118.2097 },
  '90032': { lat: 34.0835, lng: -118.1776 },
  '90033': { lat: 34.0558, lng: -118.2092 },
  '90034': { lat: 34.0231, lng: -118.4045 },
  '90035': { lat: 34.0522, lng: -118.3787 },
  '90036': { lat: 34.0633, lng: -118.3539 },
  '90037': { lat: 34.0068, lng: -118.2880 },
  '90038': { lat: 34.0903, lng: -118.3287 },
  '90039': { lat: 34.1155, lng: -118.2648 },
  '90040': { lat: 33.9894, lng: -118.1681 },
  '90041': { lat: 34.1364, lng: -118.2137 },
  '90042': { lat: 34.1158, lng: -118.1953 },
  '90043': { lat: 33.9896, lng: -118.3331 },
  '90044': { lat: 33.9553, lng: -118.2942 },
  '90045': { lat: 33.9578, lng: -118.3964 },
  '90046': { lat: 34.1086, lng: -118.3632 },
  '90047': { lat: 33.9553, lng: -118.3089 },
  '90048': { lat: 34.0727, lng: -118.3787 },

  // San Gabriel Valley (917xx, 918xx)
  '91006': { lat: 34.1328, lng: -118.0353 },
  '91007': { lat: 34.1397, lng: -118.0870 },
  '91008': { lat: 34.1331, lng: -118.0673 },
  '91010': { lat: 34.1494, lng: -118.1126 },
  '91011': { lat: 34.1847, lng: -118.1479 },
  '91016': { lat: 34.1331, lng: -118.0353 },
  '91020': { lat: 34.2164, lng: -118.2201 },
  '91024': { lat: 34.1553, lng: -118.0870 },
  '91030': { lat: 34.1331, lng: -118.0673 },
  '91101': { lat: 34.1478, lng: -118.1445 },
  '91103': { lat: 34.1478, lng: -118.1445 },
  '91104': { lat: 34.1608, lng: -118.1270 },
  '91105': { lat: 34.1608, lng: -118.1445 },
  '91106': { lat: 34.1331, lng: -118.1445 },
  '91107': { lat: 34.1608, lng: -118.1620 },
  '91108': { lat: 34.1608, lng: -118.0870 },
  '91201': { lat: 34.1808, lng: -118.2556 },
  '91202': { lat: 34.1642, lng: -118.2556 },
  '91203': { lat: 34.1642, lng: -118.2381 },
  '91204': { lat: 34.1642, lng: -118.2731 },
  '91205': { lat: 34.1808, lng: -118.2731 },
  '91206': { lat: 34.1475, lng: -118.2206 },
  '91207': { lat: 34.1642, lng: -118.2206 },
  '91208': { lat: 34.1642, lng: -118.2031 },
  '91210': { lat: 34.1808, lng: -118.2031 },
  '91214': { lat: 34.2141, lng: -118.2206 },
  '91301': { lat: 34.2536, lng: -118.5645 },
  '91302': { lat: 34.2753, lng: -118.6423 },
  '91303': { lat: 34.2336, lng: -118.6601 },
  '91304': { lat: 34.2197, lng: -118.6012 },
  '91306': { lat: 34.2522, lng: -118.5370 },
  '91307': { lat: 34.2197, lng: -118.6189 },
  '91311': { lat: 34.3164, lng: -118.4584 },
  '91316': { lat: 34.1708, lng: -118.5009 },
  '91324': { lat: 34.2364, lng: -118.5370 },
  '91325': { lat: 34.2197, lng: -118.5370 },
  '91326': { lat: 34.2531, lng: -118.5723 },
  '91331': { lat: 34.2647, lng: -118.4384 },
  '91335': { lat: 34.1975, lng: -118.5723 },
  '91340': { lat: 34.2647, lng: -118.4209 },
  '91342': { lat: 34.2808, lng: -118.4734 },
  '91343': { lat: 34.2808, lng: -118.4384 },
  '91344': { lat: 34.2364, lng: -118.4909 },
  '91345': { lat: 34.2197, lng: -118.4559 },
  '91350': { lat: 34.3831, lng: -118.5723 },
  '91351': { lat: 34.4419, lng: -118.5723 },
  '91352': { lat: 34.3830, lng: -118.5195 },
  '91354': { lat: 34.4086, lng: -118.5370 },
  '91355': { lat: 34.3664, lng: -118.5370 },
  '91356': { lat: 34.1975, lng: -118.5898 },
  '91360': { lat: 34.1397, lng: -118.7895 },
  '91361': { lat: 34.2197, lng: -118.8245 },
  '91362': { lat: 34.1975, lng: -118.8595 },
  '91364': { lat: 34.1331, lng: -118.7370 },
  '91367': { lat: 34.1975, lng: -118.6423 },
  '91381': { lat: 34.4419, lng: -118.6598 },
  '91384': { lat: 34.3997, lng: -118.5898 },
  '91387': { lat: 34.3164, lng: -118.6948 },
  '91390': { lat: 34.3831, lng: -118.6423 },
  '91401': { lat: 34.1686, lng: -118.4384 },
  '91402': { lat: 34.1686, lng: -118.4734 },
  '91403': { lat: 34.1686, lng: -118.4209 },
  '91405': { lat: 34.1997, lng: -118.4384 },
  '91406': { lat: 34.1997, lng: -118.4909 },
  '91411': { lat: 34.1686, lng: -118.3859 },
  '91423': { lat: 34.1364, lng: -118.4384 },
  '91436': { lat: 34.1364, lng: -118.4734 },
  '91501': { lat: 34.1686, lng: -118.3509 },
  '91502': { lat: 34.1853, lng: -118.3334 },
  '91504': { lat: 34.1686, lng: -118.3159 },
  '91505': { lat: 34.1853, lng: -118.3509 },
  '91506': { lat: 34.1686, lng: -118.3334 },
  '91601': { lat: 34.1364, lng: -118.3684 },
  '91602': { lat: 34.1531, lng: -118.3859 },
  '91604': { lat: 34.1531, lng: -118.3334 },
  '91605': { lat: 34.1697, lng: -118.3684 },
  '91606': { lat: 34.1531, lng: -118.4034 },
  '91607': { lat: 34.1697, lng: -118.4209 },
  '91608': { lat: 34.1364, lng: -118.4034 },
  '91701': { lat: 34.1064, lng: -117.5931 },
  '91702': { lat: 33.9803, lng: -117.9228 },
  '91706': { lat: 34.0669, lng: -117.8556 },
  '91708': { lat: 34.0669, lng: -117.9228 },
  '91710': { lat: 34.0803, lng: -117.6425 },
  '91711': { lat: 34.1064, lng: -117.6603 },
  '91722': { lat: 34.0669, lng: -117.9881 },
  '91723': { lat: 34.0336, lng: -117.9228 },
  '91724': { lat: 34.0336, lng: -117.8881 },
  '91730': { lat: 34.1064, lng: -117.7097 },
  '91731': { lat: 34.0669, lng: -117.7097 },
  '91732': { lat: 34.0336, lng: -117.7097 },
  '91733': { lat: 34.0003, lng: -117.9228 },
  '91737': { lat: 34.0336, lng: -117.9881 },
  '91739': { lat: 34.0336, lng: -117.7750 },
  '91740': { lat: 34.0336, lng: -117.8228 },
  '91741': { lat: 34.0669, lng: -117.7750 },
  '91744': { lat: 34.0336, lng: -118.0534 },
  '91745': { lat: 34.0669, lng: -118.0187 },
  '91746': { lat: 34.0669, lng: -118.0534 },
  '91748': { lat: 34.0336, lng: -118.0881 },
  '91750': { lat: 34.1064, lng: -117.7444 },
  '91754': { lat: 34.0669, lng: -117.9534 },
  '91755': { lat: 34.0669, lng: -117.8881 },
  '91759': { lat: 34.1064, lng: -117.8228 },
  '91761': { lat: 34.1064, lng: -117.5584 },
  '91762': { lat: 34.1064, lng: -117.5237 },
  '91763': { lat: 34.1064, lng: -117.4889 },
  '91764': { lat: 34.1064, lng: -117.6950 },
  '91765': { lat: 34.1064, lng: -117.6256 },
  '91766': { lat: 34.1064, lng: -117.8903 },
  '91767': { lat: 34.1064, lng: -117.9556 },
  '91768': { lat: 34.1064, lng: -118.0209 },
  '91770': { lat: 34.0336, lng: -118.1187 },
  '91773': { lat: 34.1067, lng: -117.8067 }, // San Dimas
  '91775': { lat: 34.1397, lng: -117.9228 },
  '91776': { lat: 34.1064, lng: -117.9881 },
  '91780': { lat: 34.0336, lng: -117.9534 },
  '91784': { lat: 34.1064, lng: -117.8556 },
  '91789': { lat: 34.1064, lng: -117.7097 },
  '91790': { lat: 34.0669, lng: -117.6781 },
  '91791': { lat: 34.1064, lng: -117.6781 },
  '91792': { lat: 34.1064, lng: -117.6434 },
}

/**
 * Get approximate coordinates for a ZIP code
 * Falls back to Los Angeles center if ZIP not found
 */
export function getZipCoordinates(zip: string): Coordinates | null {
  // Normalize ZIP (remove spaces, dashes)
  const normalizedZip = zip.replace(/[\s-]/g, '').slice(0, 5)

  // Direct lookup
  if (CA_ZIP_COORDS[normalizedZip]) {
    return CA_ZIP_COORDS[normalizedZip]
  }

  // Not found
  return null
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
 * Check if a lead is within the provider's service radius
 */
export function isLeadInServiceRadius(
  providerZip: string,
  leadZip: string,
  radiusMiles: number
): boolean {
  const providerCoords = getZipCoordinates(providerZip)
  const leadCoords = getZipCoordinates(leadZip)

  if (!providerCoords || !leadCoords) {
    // If we can't geocode, fall back to exact ZIP match
    return providerZip === leadZip
  }

  const distance = calculateDistance(
    providerCoords.lat,
    providerCoords.lng,
    leadCoords.lat,
    leadCoords.lng
  )

  return distance <= radiusMiles
}
