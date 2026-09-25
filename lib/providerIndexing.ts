/**
 * Which provider pages carry robots noindex (and stay out of the sitemap).
 *
 * Fixed facilities are never mobile providers (2026-09-17). Beyond that, a
 * scraped stub: unverified, a description under 100 characters, and either no
 * city or never once sent a lead. GSC 2026-09-25: 226 such pages sat in
 * "discovered / crawled, not indexed" and were consuming crawl budget that the
 * mapped city pages were not getting. The rule is evaluated from the record at
 * render and at sitemap time, so a provider who verifies or writes a real
 * description becomes indexable on the next render with no manual step.
 * Noindexed providers stay listed on state and city pages.
 */
export const STUB_DESCRIPTION_MIN_CHARS = 100

export interface IndexabilityInput {
  status: string | null | undefined
  description: string | null | undefined
  primaryCity: string | null | undefined
  isFixedSite?: boolean | null
  /** Count of LeadNotification rows for the provider. */
  notifiedCount: number
}

export function isStubNoindex(p: IndexabilityInput): boolean {
  if (p.status === 'VERIFIED') return false
  if ((p.description || '').trim().length >= STUB_DESCRIPTION_MIN_CHARS) return false
  return !(p.primaryCity || '').trim() || p.notifiedCount === 0
}

export function isProviderNoindex(p: IndexabilityInput): boolean {
  return !!p.isFixedSite || isStubNoindex(p)
}
