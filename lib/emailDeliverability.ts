import { promises as dns } from 'dns'

/**
 * Deliverability checks for provider addresses — the tier above syntax.
 *
 * checkProviderEmail() in lib/emailValidation.ts catches malformed addresses
 * and known consumer typos from a static list. It is worth keeping, and it
 * would have caught none of the failures that prompted this file.
 *
 * Four providers signed up between June and July 2026 with syntactically
 * perfect addresses on real domains whose mailboxes did not exist:
 *
 *   medicalprofessionals@phleblab.com   550 RecipientNotFound   (Microsoft)
 *   sprice@sammeliaservices.com         550 5.1.1 no account    (Google)
 *   labs@guardian-labs.com              550 5.1.1 no account    (Google)
 *   lashondra@tsafoundation.org         550 mailbox unavailable (IONOS)
 *
 * All four passed every static check. Eighteen lead notifications were sent to
 * them and none arrived. Each provider spent months believing the directory
 * produced no work, because from their side that is exactly what it looks
 * like. One of them, Phleb Lab, only surfaced because she gave up waiting and
 * tried to register a second time; the duplicate guard blocked her, which is
 * the only reason we found out at all. The other three never came back.
 *
 * No static list can catch these. Two cheap signals can:
 *
 * 1. MX lookup. A domain with no mail exchanger cannot receive mail at all.
 *    Jackson OneSource has djackson@jacksononesoure.org — missing the "c" —
 *    and that domain has no MX. It never even reached the bounce list, because
 *    almost nothing was ever sent to it. It is still in the routing pool today
 *    with notifyEnabled true.
 *
 * 2. Email domain against website domain. A provider who types their own
 *    website correctly and their own email address with one character missing
 *    hands us the correct spelling in the next form field. Selesia Ann
 *    Foundation gave website tsafoundations.org and email @tsafoundation.org.
 *    Across 347 providers with both fields this fires 5 times: two are benign
 *    (a business legitimately using a different domain, delivering fine) and
 *    two are the confirmed typos above.
 *
 * That precision is why the domain comparison WARNS and never blocks. A false
 * positive that blocks a signup costs more than the bounce it prevents. The MX
 * check blocks, because a domain with no mail exchanger is not a judgement
 * call — it is a fact, and nothing sent there can ever arrive.
 *
 * Neither check proves a mailbox exists. Only delivery does. What they do is
 * move the discovery from "two months later, in a suppression list, after the
 * provider has given up" to "while the person is still looking at the form and
 * can fix it in five seconds".
 */

/** DNS is a network call on a signup path; fail open rather than block. */
const DNS_TIMEOUT_MS = 3000

export interface DeliverabilityResult {
  /** False only when we are certain the address cannot receive mail. */
  ok: boolean
  /** Blocking reason, shown to the submitter. */
  error?: string
  /** Non-blocking; surfaced as a "did you mean" the submitter may dismiss. */
  warning?: string
  /** The address we believe was intended, when we can name one. */
  suggestion?: string
}

/**
 * Resolve, distinguishing "no such records" from "could not ask".
 *
 * dns.resolveMx THROWS ENODATA when a domain publishes no MX records, rather
 * than returning an empty array. Catching that as a generic failure is what
 * makes a no-MX domain look merely unknown, which defeats the check entirely:
 * the first version of this file did exactly that, and Jackson OneSource --
 * the case it was written for -- passed straight through it.
 *
 * ENODATA and NOTFOUND are answers. Everything else, including a timeout, is
 * an absence of one.
 */
type Resolution<T> = { answered: true; records: T[] } | { answered: false }

async function resolveOrNull<T>(p: Promise<T[]>, ms: number): Promise<Resolution<T>> {
  const definitive = new Set(['ENODATA', 'ENOTFOUND', 'NXDOMAIN'])
  const attempt = p.then(
    records => ({ answered: true as const, records }),
    (err: any) =>
      definitive.has(err?.code) ? { answered: true as const, records: [] as T[] } : { answered: false as const }
  )
  const timeout = new Promise<Resolution<T>>(resolve =>
    setTimeout(() => resolve({ answered: false }), ms)
  )
  return Promise.race([attempt, timeout])
}

/** Hostname of a URL, www- and case-normalised. Empty string if unparseable. */
export function websiteHostname(raw: string | null | undefined): string {
  const v = (raw || '').trim()
  if (!v) return ''
  try {
    return new URL(v.startsWith('http') ? v : `https://${v}`).hostname
      .replace(/^www\./i, '')
      .toLowerCase()
  } catch {
    return ''
  }
}

/** Levenshtein distance, capped work for the short strings we compare. */
function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i, ...Array(n).fill(0)]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = cur
  }
  return prev[n]
}

/**
 * Does the domain publish a mail exchanger?
 *
 * A null return means we could not tell — DNS failed or timed out — and the
 * caller must treat that as passing. Only `false` is a real negative.
 */
export async function domainAcceptsMail(domain: string): Promise<boolean | null> {
  if (!domain) return null

  const mx = await resolveOrNull(dns.resolveMx(domain), DNS_TIMEOUT_MS)
  if (!mx.answered) return null
  if (mx.records.length > 0) return true

  // No MX is not conclusive on its own: RFC 5321 permits delivery to fall back
  // to the A record. In practice that fallback is legacy and a domain with an
  // A record but no MX is usually parked rather than mail-capable -- so this
  // returns null, "cannot tell", and the caller warns instead of blocking. A
  // domain that resolves to nothing at all is the only certain negative.
  const a = await resolveOrNull(dns.resolve4(domain), DNS_TIMEOUT_MS)
  if (!a.answered) return null
  return a.records.length > 0 ? null : false
}

/**
 * Compare the email's domain against the website's.
 *
 * Only near-misses are reported. Wholly different domains are extremely common
 * and entirely legitimate — a provider using gmail alongside a business site —
 * so they are silent. The length guard keeps a short domain from matching an
 * unrelated short domain purely because two edits spans most of it.
 */
export function domainNearMiss(
  emailDomain: string,
  siteDomain: string
): string | null {
  if (!emailDomain || !siteDomain || emailDomain === siteDomain) return null
  if (Math.abs(emailDomain.length - siteDomain.length) > 2) return null
  if (Math.min(emailDomain.length, siteDomain.length) < 6) return null
  const d = editDistance(emailDomain, siteDomain)
  return d > 0 && d <= 2 ? siteDomain : null
}

/**
 * Full check. Call after checkProviderEmail() has passed on syntax.
 *
 * `website` is optional and is only used for the near-miss comparison, so a
 * provider without one still gets the MX check.
 */
export async function checkDeliverability(
  email: string,
  website?: string | null
): Promise<DeliverabilityResult> {
  const addr = (email || '').trim().toLowerCase()
  const local = addr.split('@')[0] || ''
  const emailDomain = addr.split('@')[1] || ''
  if (!emailDomain) return { ok: true }

  const accepts = await domainAcceptsMail(emailDomain)
  if (accepts === false) {
    const siteDomain = websiteHostname(website)
    const near = domainNearMiss(emailDomain, siteDomain)
    // A dead domain that is one edit from their own website is almost certainly
    // a typo, and we can name the fix rather than just refusing.
    if (near) {
      return {
        ok: false,
        error: `${emailDomain} cannot receive email. Did you mean ${local}@${near}?`,
        suggestion: `${local}@${near}`,
      }
    }
    return {
      ok: false,
      error: `${emailDomain} is not set up to receive email. Please check the spelling of the part after the @.`,
    }
  }

  const siteDomain = websiteHostname(website)
  const near = domainNearMiss(emailDomain, siteDomain)
  if (near) {
    return {
      ok: true,
      warning: `Your email is on ${emailDomain} but your website is ${near}. If that was a typo, use ${local}@${near} — we send lead notifications to this address.`,
      suggestion: `${local}@${near}`,
    }
  }

  return { ok: true }
}
