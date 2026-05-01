/**
 * Google Analytics 4 Event Tracking
 * Fire client-side events for key user actions
 * AUTO-CONTEXT: All events include page_path, page_title, city, state, metro
 */

/**
 * Get automatic context from current page
 */
function getAutoContext(): Record<string, any> {
  if (typeof window === 'undefined') return {}

  const context: Record<string, any> = {
    page_path: window.location.pathname,
    page_title: document.title
  }

  // Extract city, state, metro from URL path
  const pathParts = window.location.pathname.split('/').filter(Boolean)

  if (pathParts[0] === 'us') {
    if (pathParts[1]) {
      context.state = pathParts[1].toUpperCase()
    }
    if (pathParts[2]) {
      // Convert slug to readable name
      context.city = pathParts[2].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }

  if (pathParts[0] === 'us' && pathParts[1] === 'metro' && pathParts[2]) {
    context.metro = pathParts[2].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return context
}

export function trackEvent(eventName: string, params?: any) {
  if (typeof window === 'undefined') return
  if (!(window as any).gtag) {
    console.warn('GA4 not initialized')
    return
  }

  // Merge auto-context with provided params (params override auto-context)
  const autoContext = getAutoContext()
  const enrichedParams = { ...autoContext, ...(params || {}) } as any

  (window as any).gtag('event', eventName, enrichedParams)
}

// Specific event trackers
export const ga4 = {
  // ========================================
  // LEAD CONVERSION FUNNEL (Primary Events)
  // ========================================

  /**
   * Step 1: User clicks CTA button (before modal opens)
   * Use this BEFORE opening the lead form modal
   */
  leadCtaClick: (params?: {
    placement?: 'hero' | 'sticky' | 'inline' | 'provider_card' | 'not_found' | 'metro_links' | 'bottom'
  }) => {
    trackEvent('lead_cta_click', params)
  },

  /**
   * Step 2: Lead form modal opens
   */
  leadFormOpen: (params?: { city?: string; state?: string; zip?: string }) => {
    trackEvent('lead_form_open', params)
  },

  /**
   * Step 3: User starts filling form (first field interaction)
   * Fire once per session when user types in first field
   */
  leadFormStart: (params?: { first_field?: string }) => {
    trackEvent('lead_form_start', params)
  },

  /**
   * Step 3a: User completed the drawCount question (1-3 / 4-19 / 20+).
   * Fires once per session on first interaction with the buttons.
   * Diagnoses whether the form is even getting visible engagement.
   */
  leadFormStepDrawCount: (params?: { value?: string }) => {
    trackEvent('lead_form_step_drawcount', params)
  },

  /**
   * Step 3b: User completed the doctor's order question.
   * Fires once per session on first selection.
   * If this is significantly lower than step_drawcount, drawCount → doctor's
   * order is a drop-off point (maybe people stop when they see the question).
   */
  leadFormStepDoctorOrder: (params?: { value?: string }) => {
    trackEvent('lead_form_step_doctor_order', params)
  },

  /**
   * Step 3c: User completed the payment-method question.
   * Fires once per session on first selection.
   * If this is significantly lower than step_doctor_order, the payment
   * question is the drop-off (maybe "Insurance" missing as default scares
   * people who don't have insurance).
   */
  leadFormStepPayment: (params?: { value?: string }) => {
    trackEvent('lead_form_step_payment', params)
  },

  /**
   * Step 3d: User filled all required contact fields (fullName + phone + email).
   * Fires once per session when all three are non-empty for the first time.
   * If this is significantly lower than step_payment, the contact-fields
   * section is the drop-off (maybe email-required is friction, or maybe
   * they get distracted before finishing).
   */
  leadFormStepContactFilled: () => {
    trackEvent('lead_form_step_contact_filled')
  },

  /**
   * Step 3e: User filled all required location fields (zip + city + state).
   * Fires once per session when all three are non-empty for the first time.
   * If this is significantly lower than step_contact_filled, location is
   * the drop-off (maybe ZIP-validation feels too restrictive, or city/state
   * autofill failed).
   */
  leadFormStepLocationFilled: () => {
    trackEvent('lead_form_step_location_filled')
  },

  /**
   * Client-side validation blocked submit. Tells us which required field
   * was missing when the user clicked Submit. Each field gets its own
   * named param so we can stack-rank the most common blockers.
   */
  leadFormValidationError: (params: { field: string }) => {
    trackEvent('lead_form_validation_error', params)
  },

  /**
   * Step 4: User submits form (before API call).
   * Distance from step_location_filled tells us whether people make it to
   * "click submit" or get stuck somewhere else.
   */
  leadSubmitAttempt: (params?: {
    city?: string
    state?: string
    zip?: string
    urgency?: string
  }) => {
    trackEvent('lead_submit_attempt', params)
  },

  /**
   * Step 5a: Form submitted successfully (PRIMARY CONVERSION)
   * Mark as "Key Event" in GA4 UI
   */
  leadSubmitSuccess: (params?: {
    lead_id?: string
    location_type?: 'city' | 'metro' | 'state' | 'not_found'
    city?: string
    state?: string
    zip?: string
    urgency?: string
    provider_status?: string
  }) => {
    trackEvent('lead_submit_success', params)
  },

  /**
   * Step 5b: Form submission error
   */
  leadSubmitError: (params?: {
    error_code?: string
    error_message?: string
  }) => {
    trackEvent('lead_submit_error', params)
  },

  // ========================================
  // PROVIDER INTERACTION EVENTS (Granular)
  // ========================================

  /**
   * User clicks phone number to call provider
   */
  providerCallClick: (params?: {
    provider_id?: string
    provider_name?: string
    phone?: string
    source_page?: string
  }) => {
    trackEvent('provider_call_click', params)
  },

  /**
   * User clicks email to contact provider
   */
  providerEmailClick: (params?: {
    provider_id?: string
    provider_name?: string
    email?: string
    source_page?: string
  }) => {
    trackEvent('provider_email_click', params)
  },

  /**
   * User clicks to visit provider website
   */
  providerWebsiteClick: (params?: {
    provider_id?: string
    provider_name?: string
    url?: string
    source_page?: string
  }) => {
    trackEvent('provider_website_click', params)
  },

  // ========================================
  // LEGACY/OTHER EVENTS (Keep for backward compatibility)
  // ========================================

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
  }
}
