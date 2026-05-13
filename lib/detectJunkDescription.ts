/**
 * Junk-description detection for scraped provider descriptions.
 *
 * Provider descriptions on directory pages render in full and contribute to
 * SEO. When the source data is a scraped <nav> menu ("HOME HOME CONTACT US
 * BOOK ONLINE..."), heavy ALL-CAPS marketing copy, or repeated boilerplate
 * phrases, the visible UX degrades AND we serve garbage content to Googlebot.
 *
 * Three heuristics, OR'd together:
 *   1. >40% of letter characters are uppercase
 *   2. Same 3-word phrase repeated 3+ times
 *   3. Substring match against a curated nav-menu / footer indicator list
 *
 * Pure function — used at backfill time AND at server-render time to decide
 * whether to swap the description for "Contact for details." (We persist the
 * flag in Provider.descriptionFlagged so we don't recompute on every render
 * and so admins can find them via /admin/flagged-descriptions.)
 */

const NAV_MENU_INDICATORS: ReadonlyArray<string> = [
  // Multi-word nav patterns — strong signal
  'HOME CONTACT',
  'HOME HOME',
  'CONTACT US CONTACT',
  'ABOUT US ABOUT',
  'BOOK NOW BOOK',
  'MENU MENU',
  // Legal / footer boilerplate — strong signal individually
  'Privacy Policy',
  'Terms of Service',
  'Cookie Policy',
  'All rights reserved',
  '© 20',
  // E-commerce / SaaS nav — strong signal individually
  'View Cart',
  'Add to Cart',
  'Skip to content',
  'Toggle navigation',
  'Site map',
  // CTAs typically present standalone in nav — weaker, only flag when
  // accompanied by other patterns. NOT in this list:
  //   "Sign in", "Log in", "Sign up", "Subscribe", "Newsletter"
  // Those frequently appear in legitimate descriptions ("subscribe to our
  // newsletter for updates") so they over-flag.
]

const ALLCAPS_RATIO_THRESHOLD = 0.40
const PHRASE_LENGTH = 3   // count repeats of N-word phrases
const PHRASE_REPEAT_THRESHOLD = 3
const MIN_LENGTH_FOR_PHRASE_CHECK = 60  // skip phrase-repeat for short text where coincidence is high

export interface JunkDetectionResult {
  isJunk: boolean
  reasons: string[]
}

export function detectJunkDescription(input: string | null | undefined): JunkDetectionResult {
  if (!input) return { isJunk: false, reasons: [] }
  const text = input.trim()
  if (!text) return { isJunk: false, reasons: [] }

  const reasons: string[] = []

  // 1. ALL-CAPS ratio
  const letters = text.match(/[A-Za-z]/g) || []
  if (letters.length > 0) {
    const upperCount = letters.filter(c => c >= 'A' && c <= 'Z').length
    const ratio = upperCount / letters.length
    if (ratio >= ALLCAPS_RATIO_THRESHOLD) {
      reasons.push(`${Math.round(ratio * 100)}% ALL-CAPS letters`)
    }
  }

  // 2. Repeated N-word phrases
  if (text.length >= MIN_LENGTH_FOR_PHRASE_CHECK) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0)
    if (words.length >= PHRASE_LENGTH * PHRASE_REPEAT_THRESHOLD) {
      const phraseCount = new Map<string, number>()
      for (let i = 0; i <= words.length - PHRASE_LENGTH; i++) {
        const phrase = words.slice(i, i + PHRASE_LENGTH).join(' ')
        phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1)
      }
      for (const [phrase, count] of phraseCount) {
        if (count >= PHRASE_REPEAT_THRESHOLD) {
          reasons.push(`Phrase repeated ${count}×: "${phrase}"`)
          break  // one is enough
        }
      }
    }
  }

  // 3. Nav-menu indicator substring match (case-insensitive)
  const lower = text.toLowerCase()
  for (const indicator of NAV_MENU_INDICATORS) {
    if (lower.includes(indicator.toLowerCase())) {
      reasons.push(`Nav/footer indicator: "${indicator}"`)
      break  // one is enough
    }
  }

  return { isJunk: reasons.length > 0, reasons }
}
