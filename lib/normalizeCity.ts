/**
 * Normalize a city name: trim whitespace, collapse internal whitespace
 * to a single space, and title-case each word.
 *
 * Called at lead-write time so the `city` column on `leads` stays
 * consistent ("New York" — not "new york", "NEW YORK", or "New York ").
 * Also used by the one-time migration in
 * scripts/normalize-lead-cities.ts.
 */
export function normalizeCity(raw: string): string {
  if (!raw) return raw
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  if (!trimmed) return trimmed
  return trimmed
    .toLowerCase()
    .split(' ')
    .map(w => (w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}
