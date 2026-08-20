/**
 * Service radius for a newly approved provider, read from what they actually
 * wrote on their application.
 *
 * This was hardcoded to 25 miles in the approval route, which is where 186 of
 * the directory's providers still sit — more than the next seven values
 * combined. It was never a number anyone chose: the signup form asks for a
 * free-text "service area", and 25 was applied regardless of the answer. The
 * form's own placeholder used to read "Los Angeles County, 25 mile radius",
 * so it anchored applicants on 25 and then ignored them anyway.
 *
 * It also contradicted the applications. Of recent submissions that state a
 * radius, the values are 25, 50, 50, 60, 60, 70, 100 and 100. Those that don't
 * describe whole regions — "Entire Louisiana and parts of Mississippi", "All
 * DMV MARYLAND DC VIRGINIA", "Denver Metro Area, Nationwide". Every one was
 * filed at 25 miles.
 *
 * The cost is measurable. A 180-day audit (scripts/radius-audit.ts) found 183
 * providers under a 50-mile radius who missed in-state leads, with 935 of those
 * misses on leads nobody served at all. A patient in Shelburne VT went unserved
 * because the nearest provider was 26 miles out; asked directly, she wanted 50.
 *
 * So: use their number when they give one, and fall back to 50 rather than 25 —
 * closer to the median stated radius and to what the regional answers imply.
 * Capped at 150, beyond which it is aspiration rather than coverage.
 */
export const DEFAULT_SERVICE_RADIUS_MILES = 50
const MAX_SERVICE_RADIUS_MILES = 150

export function radiusFromSubmission(serviceArea: string | null | undefined): number {
  if (!serviceArea) return DEFAULT_SERVICE_RADIUS_MILES

  // "25 mile radius", "up to 100mi", "60 miles", "50+ mile", "60 mile of Little Rock"
  const match = serviceArea.match(/(\d{1,3})\s*\+?\s*(?:mi\b|mile)/i)
  if (!match) return DEFAULT_SERVICE_RADIUS_MILES

  const stated = parseInt(match[1], 10)
  if (!Number.isFinite(stated) || stated < 1) return DEFAULT_SERVICE_RADIUS_MILES
  return Math.min(stated, MAX_SERVICE_RADIUS_MILES)
}
