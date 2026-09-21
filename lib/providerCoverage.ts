import { getDistanceBetweenZips, isLeadInServiceRadius } from './zip-geocode'

/**
 * The one answer to "does this provider serve this lead?"
 *
 * Until 2026-09-18 six places decided this on their own (the router, the
 * provider dashboard's available-leads list, the admin rematch page, the
 * catch-missed cron, the admin coverage map, the SMS routing), all
 * inclusion-only: a radius or ZIP list could add areas but nothing could
 * remove one. A Long Island provider whose 70-mile radius reaches Brooklyn
 * got Brooklyn leads she declines; a Maryland provider with a 100-mile radius
 * claimed a Delaware patient and then said they don't serve Delaware; a Dallas
 * provider with a 50-mile radius said "we have no phlebotomist in
 * Farmersville". Three paying or active providers hit it, so it is a feature.
 *
 * Order of evaluation, first match wins:
 *   1. No ZIPs on the record: cannot judge, does not serve.
 *   2. Excluded state, or excluded ZIP token: does not serve. Exclusions beat
 *      radius, the ZIP list, and the fan-out floor.
 *   3. Farther than MAX_ROUTING_DISTANCE_MILES from the primary ZIP: no.
 *   4. Inside the radius from the primary ZIP: yes.
 *   5. Explicit ZIP token match (exact, "112*" prefix, "10000-10499" range),
 *      as long as the token itself sits within MAX_LISTED_ZIP_DISTANCE_MILES
 *      of the primary ZIP (a typo like 90210 on an Ohio record is ignored).
 *
 * Both `zipCodes` and `excludedZipCodes` use the same token grammar.
 */

/** Beyond this, a lead is never routed even if the radius says otherwise. */
export const MAX_ROUTING_DISTANCE_MILES = 100
/** A listed ZIP token farther than this from the primary ZIP is treated as a typo. */
export const MAX_LISTED_ZIP_DISTANCE_MILES = 150

export interface CoverageRecord {
  zipCodes?: string | null
  serviceRadiusMiles?: number | null
  excludedZipCodes?: string | null
  excludedStates?: string | null
}

export type CoverageReason =
  | 'no_zips' | 'excluded_state' | 'excluded_zip' | 'too_far' | 'radius' | 'zip_list' | 'not_covered'

export interface CoverageVerdict {
  serves: boolean
  reason: CoverageReason
  /** Miles from the provider's primary ZIP, when both geocode. */
  distance: number | null
}

/**
 * Tokenise a ZIP list. Separators are commas, semicolons, newlines and plain
 * whitespace ("20646 20745"). A range may be written with spaces around the
 * dash. ZIP+4 ("20853-9458") is read as its first five digits: four records
 * store their only ZIP that way, and treating it as unparseable dropped them
 * from routing entirely (20 lost matches in the 90-day comparison).
 */
export function parseZipTokens(raw: string | null | undefined): string[] {
  return (raw || '')
    .replace(/(\d{5})\s*-\s*(\d{5})(?!\d)/g, '$1-$2') // "10000 - 10499" -> one token
    .split(/[,;\s]+/)
    .map(z => z.trim())
    .filter(z => z.length >= 3)
    .map(z => (/^\d{5}-\d{4}$/.test(z) ? z.slice(0, 5) : z)) // ZIP+4 -> ZIP
}

export function parseStates(raw: string | null | undefined): string[] {
  return (raw || '').split(/[,\s;]+/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]{2}$/.test(s))
}

/**
 * The provider's home ZIP: the first five digits of the first token that is
 * at least five characters long. That mirrors what routing has always done
 * (a record whose first token is a range is anchored at the range start), so
 * no provider's anchor moves with this refactor.
 */
export function primaryZipOf(record: Pick<CoverageRecord, 'zipCodes'>): string | null {
  const first = parseZipTokens(record.zipCodes).find(z => z.length >= 5)
  const digits = first ? first.replace(/\D/g, '').slice(0, 5) : ''
  return digits.length === 5 ? digits : null
}

/**
 * Exact, prefix or range ("10000-10499"). A prefix needs its star ("112*")
 * on the INCLUDE list: six live records hold bare 3-4 digit fragments of a
 * phone number or a mistyped ZIP there, and reading "313" as "every ZIP
 * starting 313" would route leads nobody asked for. Exclusion lists accept a
 * bare prefix too (`allowBarePrefix`), because over-excluding is harmless.
 */
export function zipMatchesToken(zip: string, token: string, allowBarePrefix = false): boolean {
  const z = zip.replace(/\D/g, '').slice(0, 5)
  if (z.length !== 5) return false
  const t = token.trim()
  if (/^\d{5}$/.test(t)) return z === t
  if (/^\d{3,4}\*$/.test(t)) return z.startsWith(t.replace('*', ''))
  if (allowBarePrefix && /^\d{3,4}$/.test(t)) return z.startsWith(t)
  if (/^\d{5}\s*-\s*\d{5}$/.test(t)) {
    const [start, end] = t.split('-').map(x => x.trim())
    return z >= start && z <= end
  }
  return false
}

export function isExcluded(record: CoverageRecord, zip: string, state?: string | null): CoverageReason | null {
  if (state && parseStates(record.excludedStates).includes(state.toUpperCase())) return 'excluded_state'
  if (parseZipTokens(record.excludedZipCodes).some(t => zipMatchesToken(zip, t, true))) return 'excluded_zip'
  return null
}

export function providerServesLead(record: CoverageRecord, leadZip: string, leadState?: string | null): CoverageVerdict {
  const primary = primaryZipOf(record)
  if (!primary) return { serves: false, reason: 'no_zips', distance: null }
  const distance = getDistanceBetweenZips(primary, leadZip)

  const excluded = isExcluded(record, leadZip, leadState)
  if (excluded) return { serves: false, reason: excluded, distance }

  if (distance !== null && distance > MAX_ROUTING_DISTANCE_MILES) return { serves: false, reason: 'too_far', distance }

  const radius = record.serviceRadiusMiles || 25
  if (isLeadInServiceRadius(primary, leadZip, radius)) return { serves: true, reason: 'radius', distance }

  const plausible = (token: string) => {
    const anchor = token.replace('*', '').split('-')[0].trim().padEnd(5, '0')
    const d = getDistanceBetweenZips(primary, anchor)
    return d === null || d <= MAX_LISTED_ZIP_DISTANCE_MILES
  }
  const listed = parseZipTokens(record.zipCodes).some(t => zipMatchesToken(leadZip, t) && plausible(t))
  if (listed) return { serves: true, reason: 'zip_list', distance }

  return { serves: false, reason: 'not_covered', distance }
}
