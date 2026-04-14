/**
 * Normalize a city name for consistent storage:
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Take only the first city if comma-separated
 * - Expand common abbreviations (Ft → Fort, St → Saint, Mt → Mount)
 * - Title case
 */
export function normalizeCityName(input: string | null | undefined): string | null {
  if (!input) return null
  let c = input.trim().replace(/\s+/g, ' ')
  if (!c) return null

  // Take first city if comma-separated coverage list
  if (c.includes(',')) c = c.split(',')[0].trim()

  // Expand common abbreviations
  c = c.replace(/\bFt\.?\s/gi, 'Fort ')
  c = c.replace(/\bSt\.?\s/gi, 'Saint ')
  c = c.replace(/\bMt\.?\s/gi, 'Mount ')

  // Title case (preserve internal capitals like "McKinney" by only fixing first letter of each word)
  c = c.split(' ').map(w => {
    if (w.length === 0) return w
    // Don't lowercase the rest if word contains internal caps (e.g., "McKinney")
    if (/[A-Z]/.test(w.slice(1))) {
      return w[0].toUpperCase() + w.slice(1)
    }
    return w[0].toUpperCase() + w.slice(1).toLowerCase()
  }).join(' ')

  return c
}

export function citySlug(city: string | null | undefined): string | null {
  if (!city) return null
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
