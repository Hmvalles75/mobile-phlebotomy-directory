/**
 * ZIPs absent from zipcodes@8.0.0 whose real location we can verify.
 *
 * The package holds 44,175 entries and is essentially complete; the handful of
 * gaps are ZIPs created after its data was cut. This table is deliberately
 * tiny and hand-verified rather than generated.
 *
 * Do NOT extend it by picking the numerically nearest known ZIP. That was
 * tried and is unsafe: 99584 (Shelton WA) is numerically adjacent to 99583
 * (False Pass, ALASKA), and 39034 (Climax MI) to 39038 (Belzoni, MISSISSIPPI).
 * Numeric adjacency is not geographic adjacency across state lines, and a
 * wrong coordinate mis-routes a patient — strictly worse than an unresolvable
 * ZIP, which fails safe into NEEDS_COVERAGE.
 *
 * Rule for adding an entry: the ZIP must be confirmed real, and the borrowed
 * coordinate must come from a ZIP in the SAME city and state.
 */
export interface ZipOverride {
  lat: number
  lng: number
  city: string
  state: string
  /** Where the coordinate came from, so the approximation stays auditable. */
  borrowedFrom: string
}

export const ZIP_OVERRIDES: Record<string, ZipOverride> = {
  // McKinney TX — 75069/70/71/72 are all McKinney; 75071 is in the package.
  '75072': { lat: 33.198, lng: -96.615, city: 'McKinney', state: 'TX', borrowedFrom: '75071 McKinney, TX' },
  // Bentonville AR — 72712 is Bentonville and in the package.
  '72713': { lat: 36.358, lng: -94.222, city: 'Bentonville', state: 'AR', borrowedFrom: '72712 Bentonville, AR' },
  // Tannersville PA (submitted as Stroudsburg) — 18370 Swiftwater is the
  // adjacent Monroe County ZIP, ~4 miles away.
  '18366': { lat: 41.088, lng: -75.348, city: 'Tannersville', state: 'PA', borrowedFrom: '18370 Swiftwater, PA' },
  // Granville WV (submitted as Hurricane) — 26525 Bruceton Mills is the
  // adjacent Preston/Monongalia County ZIP.
  '26526': { lat: 39.645, lng: -79.616, city: 'Granville', state: 'WV', borrowedFrom: '26525 Bruceton Mills, WV' },
}

export function getZipOverride(zip: string): ZipOverride | null {
  const normalized = zip.replace(/[\s-]/g, '').slice(0, 5)
  return ZIP_OVERRIDES[normalized] || null
}
