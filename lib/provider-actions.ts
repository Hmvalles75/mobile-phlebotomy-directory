// Provider action utilities with SEO best practices
import { type Provider } from './schemas'
import { secureStorage } from './crypto'
import { formatPhoneNumber } from './format-phone'

// Fallback function to copy text to clipboard for older browsers
function copyToClipboardFallback(text: string) {
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand('copy')
    textArea.remove()
    alert(`Phone number ${text} copied to clipboard!`)
  } catch (error) {
    // If all else fails, just show the number
    alert(`Please call: ${text}`)
  }
}

export interface ProviderInteractionEvent {
  action: 'contact' | 'website' | 'details' | 'save' | 'unsave' | 'rating_filter' | 'rating_view' | 'top_rated_view'
  providerId: string
  providerName: string
  method?: string
  timestamp: number
  location?: string
  rating?: number
  filterValue?: string
}

// Analytics tracking for provider interactions
export async function trackProviderInteraction(event: ProviderInteractionEvent) {
  // Store interaction in encrypted localStorage for analytics
  try {
    const interactions = await secureStorage.getItem('providerInteractions') || []
    interactions.push(event)
    
    // Keep only last 100 interactions to avoid storage bloat
    if (interactions.length > 100) {
      interactions.splice(0, interactions.length - 100)
    }
    
    await secureStorage.setItem('providerInteractions', interactions)
    
    // Send to analytics service (Google Analytics, etc.)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'provider_interaction', {
        event_category: 'Provider',
        event_label: event.action,
        custom_parameter_1: event.providerId,
        custom_parameter_2: event.providerName
      })
    }
  } catch (error) {
    console.warn('Failed to track provider interaction:', error)
  }
}

// Contact provider with multiple fallback methods
export function contactProvider(provider: Provider, currentLocation?: string): boolean {
  const event: ProviderInteractionEvent = {
    action: 'contact',
    providerId: provider.id,
    providerName: provider.name,
    timestamp: Date.now(),
    location: currentLocation
  }

  // Priority order: phone, email, website contact form, website
  if (provider.phone) {
    event.method = 'phone'
    trackProviderInteraction(event)

    // Show phone number in a user-friendly way instead of using tel: link
    // which can cause "Pick an app" popups on Windows
    const phoneNumber = provider.phone
    const formattedPhone = formatPhoneNumber(phoneNumber)
    const message = `Call ${provider.name} at:\n\n${formattedPhone}\n\nClick OK to copy the phone number to your clipboard.`
    
    if (confirm(message)) {
      // Copy phone number to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(phoneNumber).then(() => {
          alert(`Phone number ${formattedPhone} copied to clipboard!`)
        }).catch(() => {
          // Fallback for older browsers
          copyToClipboardFallback(phoneNumber)
        })
      } else {
        copyToClipboardFallback(phoneNumber)
      }
    }
    return true
  }
  
  if (provider.email) {
    event.method = 'email'
    trackProviderInteraction(event)
    
    const subject = encodeURIComponent(`Mobile Phlebotomy Service Inquiry - ${provider.name}`)
    const body = encodeURIComponent(
      `Hello ${provider.name},\n\n` +
      `I found your mobile phlebotomy services on MobilePhlebotomy.org and would like to inquire about scheduling an appointment.\n\n` +
      `${currentLocation ? `Location: ${currentLocation}\n` : ''}` +
      `Please let me know your availability and rates.\n\n` +
      `Thank you!`
    )
    
    try {
      window.location.href = `mailto:${provider.email}?subject=${subject}&body=${body}`
    } catch (error) {
      // Fallback if mailto doesn't work
      const message = `Email ${provider.name} at:\n\n${provider.email}\n\nSubject: Mobile Phlebotomy Service Inquiry\n\nClick OK to copy the email address to your clipboard.`
      if (confirm(message)) {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(provider.email).then(() => {
            alert(`Email address ${provider.email} copied to clipboard!`)
          }).catch(() => {
            copyToClipboardFallback(provider.email!)
          })
        } else {
          copyToClipboardFallback(provider.email!)
        }
      }
    }
    return true
  }
  
  if (provider.website) {
    event.method = 'website'
    trackProviderInteraction(event)
    
    // Open website in new tab with proper SEO attributes
    const link = document.createElement('a')
    link.href = provider.website
    link.target = '_blank'
    link.rel = 'noopener noreferrer nofollow' // nofollow for external links
    link.setAttribute('aria-label', `Visit ${provider.name} website`)
    link.click()
    return true
  }
  
  // No contact method available
  alert(`Contact information not available for ${provider.name}. Please try searching for other providers in your area.`)
  return false
}

// Visit provider website with SEO best practices
export function visitProviderWebsite(provider: Provider, currentLocation?: string): boolean {
  if (!provider.website) {
    // Fallback to contact method
    return contactProvider(provider, currentLocation)
  }

  const event: ProviderInteractionEvent = {
    action: 'website',
    providerId: provider.id,
    providerName: provider.name,
    method: 'website',
    timestamp: Date.now(),
    location: currentLocation
  }
  
  trackProviderInteraction(event)
  
  // Create properly attributed link
  const link = document.createElement('a')
  link.href = provider.website
  link.target = '_blank'
  link.rel = 'noopener noreferrer nofollow sponsored' // sponsored for business listings
  link.setAttribute('aria-label', `Visit ${provider.name} official website`)
  
  // Add structured data attributes for better SEO
  link.setAttribute('data-provider-id', provider.id)
  link.setAttribute('data-provider-name', provider.name)
  link.setAttribute('data-action', 'website-visit')
  
  link.click()
  return true
}

// Save/unsave provider functionality
export async function toggleSaveProvider(providerId: string, providerName: string): Promise<boolean> {
  try {
    const savedProviders = await secureStorage.getItem('savedProviders') || []
    const isCurrentlySaved = savedProviders.includes(providerId)
    
    let newSavedProviders: string[]
    if (isCurrentlySaved) {
      newSavedProviders = savedProviders.filter((id: string) => id !== providerId)
    } else {
      newSavedProviders = [...savedProviders, providerId]
    }
    
    await secureStorage.setItem('savedProviders', newSavedProviders)
    
    // Track the interaction
    trackProviderInteraction({
      action: isCurrentlySaved ? 'unsave' : 'save',
      providerId,
      providerName,
      timestamp: Date.now()
    })
    
    return !isCurrentlySaved // Return new saved state
  } catch (error) {
    console.error('Failed to save provider:', error)
    return false
  }
}

// Check if provider is saved
export async function isProviderSaved(providerId: string): Promise<boolean> {
  try {
    const savedProviders = await secureStorage.getItem('savedProviders') || []
    return savedProviders.includes(providerId)
  } catch (error) {
    return false
  }
}

// Get all saved providers
export async function getSavedProviders(): Promise<string[]> {
  try {
    return await secureStorage.getItem('savedProviders') || []
  } catch (error) {
    return []
  }
}

// Generate structured data for provider
export function generateProviderStructuredData(provider: Provider, currentLocation?: string) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": provider.name,
    "description": provider.description || `Mobile phlebotomy services by ${provider.name}`,
    "url": provider.website,
    "telephone": provider.phone,
    "email": provider.email,
    "priceRange": "$$", // Could be made dynamic based on provider data
    "paymentAccepted": provider.payment || ["Cash", "Credit Card", "Insurance"],
    "currenciesAccepted": "USD",
    "serviceType": "Mobile Phlebotomy",
    "medicalSpecialty": "Phlebotomy",
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "addressCountry": "US"
      }
    },
    "areaServed": provider.coverage.states || provider.coverage.cities || [],
    "hasCredential": provider.badges || ["Licensed", "Certified"],
    "availableService": provider.services.map(service => ({
      "@type": "MedicalProcedure",
      "name": service,
      "description": `Professional ${service.toLowerCase()} services`
    }))
  }

  // Add address if available
  if (provider.address?.city && provider.address?.state) {
    (structuredData as any).address = {
      "@type": "PostalAddress",
      "addressLocality": provider.address.city,
      "addressRegion": provider.address.state,
      "addressCountry": "US"
    }
  }

  // Add rating if available
  if (provider.rating && provider.reviewsCount) {
    (structuredData as any).aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": provider.rating,
      "reviewCount": provider.reviewsCount,
      "bestRating": 5,
      "worstRating": 1
    }
  }

  return structuredData
}

// Format provider contact information for display
export function formatProviderContact(provider: Provider): {
  primary: string
  secondary: string[]
  methods: ('phone' | 'email' | 'website')[]
} {
  const methods: ('phone' | 'email' | 'website')[] = []
  const secondary: string[] = []
  
  let primary = 'Contact for details'

  if (provider.phone) {
    primary = formatPhoneNumber(provider.phone)
    methods.push('phone')
  } else if (provider.email &&
             provider.email !== '' &&
             provider.email !== 'nan' &&
             provider.email.toLowerCase() !== 'no' &&
             provider.email.toLowerCase() !== 'false') {
    primary = provider.email
    methods.push('email')
  } else if (provider.website) {
    primary = 'Visit website'
    methods.push('website')
  }

  if (provider.phone && methods[0] !== 'phone') {
    secondary.push(formatPhoneNumber(provider.phone))
    methods.push('phone')
  }

  if (provider.email &&
      provider.email !== '' &&
      provider.email !== 'nan' &&
      provider.email.toLowerCase() !== 'no' &&
      provider.email.toLowerCase() !== 'false' &&
      methods[0] !== 'email') {
    secondary.push(provider.email)
    methods.push('email')
  }

  if (provider.website && methods[0] !== 'website') {
    secondary.push('Website available')
    methods.push('website')
  }

  return { primary, secondary, methods }
}

// Generate canonical URL for provider
export function getProviderCanonicalUrl(provider: Provider, baseUrl: string = ''): string {
  // Create SEO-friendly provider URL
  const slug = provider.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
  
  const state = provider.address?.state || provider.coverage.states?.[0] || 'nationwide'
  const stateSlug = state.toLowerCase().replace(/\s+/g, '-')
  
  return `${baseUrl}/providers/${stateSlug}/${slug}-${provider.id}`
}

// Rating-specific analytics functions
export function trackRatingFilter(filterValue: string, location?: string) {
  trackProviderInteraction({
    action: 'rating_filter',
    providerId: 'system',
    providerName: 'Rating Filter',
    filterValue,
    timestamp: Date.now(),
    location
  })
}

export function trackRatingView(provider: Provider, location?: string) {
  if (provider.rating) {
    trackProviderInteraction({
      action: 'rating_view',
      providerId: provider.id,
      providerName: provider.name,
      rating: provider.rating,
      timestamp: Date.now(),
      location
    })
  }
}

export function trackTopRatedView(location?: string) {
  trackProviderInteraction({
    action: 'top_rated_view',
    providerId: 'system',
    providerName: 'Top Rated Section',
    timestamp: Date.now(),
    location
  })
}

// Declare global gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}