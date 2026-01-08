/**
 * Google Analytics 4 Event Tracking
 * Fire client-side events for key user actions
 */

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return
  if (!(window as any).gtag) {
    console.warn('GA4 not initialized')
    return
  }

  (window as any).gtag('event', eventName, params)
}

// Specific event trackers
export const ga4 = {
  leadFormOpen: (params?: { city?: string; state?: string; zip?: string }) => {
    trackEvent('lead_form_open', params)
  },

  leadSubmitAttempt: (params?: { city?: string; state?: string; zip?: string; urgency?: string }) => {
    trackEvent('lead_submit_attempt', params)
  },

  leadSubmitSuccess: (params?: { city?: string; state?: string; zip?: string; urgency?: string; provider_status?: string }) => {
    trackEvent('lead_submit_success', params)
  },

  callClick: (params?: { city?: string; state?: string; zip?: string; provider_status?: string }) => {
    trackEvent('call_click', params)
  },

  claimClick: (params?: { provider_id?: string }) => {
    trackEvent('claim_click', params)
  },

  reportClick: (params?: { provider_id?: string; provider_name?: string }) => {
    trackEvent('report_click', params)
  },

  reportSubmit: (params?: { provider_id?: string; issue_type?: string }) => {
    trackEvent('report_submit', params)
  },

  purchaseCreditsClick: (params?: { pack?: number }) => {
    trackEvent('purchase_credits_click', params)
  },

  subscribeFeaturedClick: (params?: { tier?: string }) => {
    trackEvent('subscribe_featured_click', params)
  },

  heroCTAClick: (params?: { cta_type?: 'request' | 'call' }) => {
    trackEvent('hero_cta_click', params)
  },

  mobileStickyCTAClick: (params?: { cta_type?: 'request' | 'call' }) => {
    trackEvent('mobile_sticky_cta_click', params)
  },

  zipSearch: (params?: { zip?: string }) => {
    trackEvent('zip_search', params)
  },

  scrollFeaturedSection: () => {
    trackEvent('scroll_featured_section')
  },

  policyView: (policyType: 'privacy' | 'terms') => {
    trackEvent('policy_view', { policy_type: policyType })
  },

  disclaimerView: () => {
    trackEvent('disclaimer_view')
  },

  /**
   * Track provider website outbound clicks
   * @param params - provider_name, provider_city, provider_state, link_type, page_path
   *
   * To verify in GA4:
   * 1. Go to GA4 Admin -> DebugView
   * 2. Click any "Visit Website" link on a provider card or profile
   * 3. Confirm 'provider_click' event appears with all parameters
   */
  providerClick: (params: {
    provider_name: string
    provider_city?: string
    provider_state?: string
    link_type: 'website' | 'phone' | 'email'
    page_path?: string
  }) => {
    trackEvent('provider_click', {
      ...params,
      page_path: params.page_path || (typeof window !== 'undefined' ? window.location.pathname : undefined)
    })
  }
}
