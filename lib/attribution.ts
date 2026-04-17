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

/**
 * Capture attribution on the client side. Call on form submit.
 * Reads UTM params from URL and referrer from document.referrer.
 */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') {
    return {
      attributionSource: 'direct',
      utmSource: null, utmMedium: null, utmCampaign: null,
      referrer: null, landingPage: null,
    }
  }

  // Prefer sessionStorage values (captured at landing), fall back to current URL
  const stored = sessionStorage.getItem('attribution')
  if (stored) {
    try { return JSON.parse(stored) } catch { /* ignore */ }
  }

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
 * Call this once on first page load (e.g., in a layout) to capture the initial
 * landing attribution, which persists across the session even if the user
 * navigates to other pages before submitting a form.
 */
export function persistAttributionOnLanding(): void {
  if (typeof window === 'undefined') return

  const existing = sessionStorage.getItem('attribution')
  if (existing) return // Don't overwrite — only capture first-touch

  const attribution = captureAttribution()
  sessionStorage.setItem('attribution', JSON.stringify(attribution))
}
