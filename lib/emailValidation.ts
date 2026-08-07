/**
 * Provider email validation.
 *
 * Written after an audit found 32 bad addresses across 716 providers, 19 of
 * them on the field the router actually sends to. Brio Labs was stored as
 * "briosticks@gmail" — no TLD — while eligibleForLeads and notifyEnabled were
 * both true, so she sat in the routing pool receiving nothing and looked
 * dormant rather than broken. Four others were domain typos: gmail.con,
 * jacksononesoure.org, divineblendlingllc.com, ...testing.co.
 *
 * Deliberately stricter than z.string().email(), which accepts "a@b" — no dot,
 * no TLD — and would have let every one of those through.
 */

/** Requires a dot-separated TLD of at least two letters. */
const STRICT_EMAIL = /^[^\s@,;<>()[\]\\]+@[^\s@,;<>()[\]\\]+\.[A-Za-z]{2,}$/

/**
 * Domains that are almost always a slip for a well-known provider. Matched on
 * the full domain so a legitimate address on a similar domain is unaffected.
 */
const TYPO_DOMAINS: Record<string, string> = {
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmail.con': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outlook.con': 'outlook.com',
  'outlok.com': 'outlook.com',
  'icloud.con': 'icloud.com',
  'aol.con': 'aol.com',
}

/** Generic TLD slips worth catching on any domain. */
const TYPO_TLDS: Record<string, string> = {
  '.con': '.com',
  '.ocm': '.com',
  '.comm': '.com',
  '.cmo': '.com',
}

export interface EmailCheck {
  ok: boolean
  /** Trimmed and lowercased when valid; the raw input otherwise. */
  normalized: string
  error?: string
  /** Set when the address looks like a near-miss we can name. */
  suggestion?: string
}

export function checkProviderEmail(raw: string | null | undefined): EmailCheck {
  const value = (raw || '').trim()
  if (!value) return { ok: false, normalized: '', error: 'Email address is required.' }

  if (/\s/.test(value)) {
    return { ok: false, normalized: value, error: 'Email address cannot contain spaces.' }
  }
  if (!STRICT_EMAIL.test(value)) {
    return {
      ok: false,
      normalized: value,
      error: 'That does not look like a complete email address — check the part after the @, including the .com.',
    }
  }

  const lower = value.toLowerCase()
  const domain = lower.split('@')[1] || ''

  const domainFix = TYPO_DOMAINS[domain]
  if (domainFix) {
    return {
      ok: false,
      normalized: lower,
      error: `Did you mean ${lower.split('@')[0]}@${domainFix}?`,
      suggestion: `${lower.split('@')[0]}@${domainFix}`,
    }
  }

  for (const [bad, good] of Object.entries(TYPO_TLDS)) {
    if (domain.endsWith(bad)) {
      const fixed = lower.slice(0, lower.length - bad.length) + good
      return { ok: false, normalized: lower, error: `Did you mean ${fixed}?`, suggestion: fixed }
    }
  }

  return { ok: true, normalized: lower }
}

/** Convenience for call sites that only need a boolean. */
export function isValidProviderEmail(raw: string | null | undefined): boolean {
  return checkProviderEmail(raw).ok
}
