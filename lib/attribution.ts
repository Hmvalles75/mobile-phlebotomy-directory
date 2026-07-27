/**
 * Attribution tracking — capture where a signup came from.
 *
 * Captures UTM params first (most reliable), then falls back to document.referrer,
 * and finally defaults to 'direct' if neither is present.
 */

export interface Attribution {
  attributionSource: string   // Normalized: 'facebook', 'google', 'direct', 'email', etc.
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  referrer: string | null
  landingPage: string | null
}

/**
 * Normalize a referrer or utm_source into a canonical source label.
 */
function normalizeSource(raw: string | null | undefined): string {
  if (!raw) return 'direct'
  const s = raw.toLowerCase()
  if (s.includes('facebook') || s.includes('fb.com') || s === 'fb') return 'facebook'
  if (s.includes('instagram') || s.includes('ig.com')) return 'instagram'
  if (s.includes('tiktok')) return 'tiktok'
  if (s.includes('linkedin') || s.includes('lnkd.in')) return 'linkedin'
  if (s.includes('twitter') || s.includes('t.co') || s.includes('x.com')) return 'twitter'
  if (s.includes('youtube') || s.includes('youtu.be')) return 'youtube'
  if (s.includes('google')) return 'google'
  if (s.includes('bing')) return 'bing'
  if (s.includes('reddit')) return 'reddit'
  if (s.includes('thedrawreport') || s.includes('beehiiv')) return 'newsletter'
  if (s.includes('mobilephlebotomy.org') || s.includes('mobilephlebotomy')) return 'internal'
  // Anything else — use the raw value
  return s.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split('.').slice(-2, -1)[0] || 'other'
}

const EMPTY_ATTRIBUTION: Attribution = {
  attributionSource: 'direct',
  utmSource: null, utmMedium: null, utmCampaign: null,
  referrer: null, landingPage: null,
}

/**
 * Derive attribution from the page as it is right now — UTM params on the URL
 * and document.referrer. No storage reads.
 */
function captureAttributionFromUrl(): Attribution {
  if (typeof window === 'undefined') return EMPTY_ATTRIBUTION

  const url = new URL(window.location.href)
  const utmSource = url.searchParams.get('utm_source')
  const utmMedium = url.searchParams.get('utm_medium')
  const utmCampaign = url.searchParams.get('utm_campaign')
  const referrer = document.referrer || null
  const landingPage = window.location.pathname

  const attributionSource = utmSource
    ? normalizeSource(utmSource)
    : referrer
      ? normalizeSource(referrer)
      : 'direct'

  return {
    attributionSource,
    utmSource, utmMedium, utmCampaign,
    referrer, landingPage,
  }
}

/**
 * Capture attribution on the client side. Call on form submit.
 * Prefers the value stored at landing (so `landingPage` is the page they
 * actually entered on, not the form's own path), falling back to the URL.
 */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return EMPTY_ATTRIBUTION

  const stored = sessionStorage.getItem('attribution')
  if (stored) {
    try { return JSON.parse(stored) } catch { /* ignore */ }
  }

  return captureAttributionFromUrl()
}

/**
 * Call this once on first page load (e.g., in a layout) to capture the initial
 * landing attribution, which persists across the session even if the user
 * navigates to other pages before submitting a form.
 */
export function persistAttributionOnLanding(): void {
  if (typeof window === 'undefined') return

  const existing = sessionStorage.getItem('attribution')
  if (!existing) {
    sessionStorage.setItem('attribution', JSON.stringify(captureAttribution()))
  }

  persistFirstTouch()
}

// ---------------------------------------------------------------------------
// Persistent first-touch (localStorage)
//
// sessionStorage attribution is last-touch-per-session: a B2B buyer who finds
// us on Google, leaves, and comes back a week later to fill the form is
// recorded as 'direct'. Institutional deals research over weeks, so the
// session value systematically under-credits organic search. This keeps the
// FIRST source we ever saw for this browser, for FIRST_TOUCH_TTL_DAYS.
// ---------------------------------------------------------------------------

const FIRST_TOUCH_KEY = 'attribution_first_touch'
const FIRST_TOUCH_TTL_DAYS = 90

interface StoredFirstTouch {
  attribution: Attribution
  capturedAt: number
}

/**
 * Record the first source ever seen for this browser. Never overwrites a live
 * (non-expired) value — that is the whole point of first-touch.
 */
function persistFirstTouch(): void {
  try {
    const raw = localStorage.getItem(FIRST_TOUCH_KEY)
    if (raw) {
      const parsed: StoredFirstTouch = JSON.parse(raw)
      const ageDays = (Date.now() - parsed.capturedAt) / 86_400_000
      if (ageDays < FIRST_TOUCH_TTL_DAYS) return
    }
  } catch {
    // Corrupt value — fall through and rewrite it.
  }

  // Derive from the current URL, not from sessionStorage: on a returning visit
  // the session value may already have been written by an earlier navigation.
  const stored: StoredFirstTouch = {
    attribution: captureAttributionFromUrl(),
    capturedAt: Date.now(),
  }
  try {
    localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(stored))
  } catch {
    // Private mode / quota — first-touch is best-effort, never block the page.
  }
}

/**
 * Attribution for a form submit, preferring the persistent first-touch value
 * over the current session. Use this on long-consideration-cycle forms
 * (institutional / coverage requests) where the session value is misleading.
 *
 * Falls back to `captureAttribution()` when no first-touch value exists
 * (localStorage blocked, or the visitor predates this feature).
 */
export function captureFirstTouchAttribution(): Attribution {
  if (typeof window === 'undefined') return captureAttribution()

  try {
    const raw = localStorage.getItem(FIRST_TOUCH_KEY)
    if (raw) {
      const parsed: StoredFirstTouch = JSON.parse(raw)
      const ageDays = (Date.now() - parsed.capturedAt) / 86_400_000
      if (ageDays < FIRST_TOUCH_TTL_DAYS && parsed.attribution) {
        // A first-touch of 'direct' is usually just a lost referrer. If this
        // session has a real source, that beats an empty first-touch.
        const session = captureAttribution()
        if (parsed.attribution.attributionSource === 'direct' && session.attributionSource !== 'direct') {
          return session
        }
        return parsed.attribution
      }
    }
  } catch {
    // Fall through to the session value.
  }

  return captureAttribution()
}
