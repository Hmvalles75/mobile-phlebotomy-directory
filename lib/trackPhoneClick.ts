/**
 * Track a click-to-call click and return so the caller can navigate to tel:.
 *
 * Uses navigator.sendBeacon when available — the browser guarantees the
 * payload is transmitted even if the page unloads (the tel: handler on
 * mobile often suspends the page). Falls back to fetch with keepalive
 * when sendBeacon isn't available.
 *
 * Non-blocking by design — even if the tracking call fails, the click
 * still lets the tel: navigate.
 */
export function trackPhoneClick(params: {
  providerId: string
  source: string
  pagePath?: string
}): void {
  if (typeof window === 'undefined') return

  const payload = JSON.stringify({
    providerId: params.providerId,
    source: params.source,
    pagePath: params.pagePath ?? window.location.pathname,
  })

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/phone-click', blob)
      return
    }
  } catch {
    // fall through to fetch
  }

  // Fallback for older browsers
  try {
    fetch('/api/analytics/phone-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => { /* ignore */ })
  } catch {
    // truly nothing we can do — tel: still fires
  }
}
