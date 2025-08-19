// Environment variable validation
// This file ensures all required environment variables are present

export function validateEnvironment() {
  const required = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  }

  const optional = {
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    YELP_API_KEY: process.env.YELP_API_KEY,
    NPI_BASE_URL: process.env.NPI_BASE_URL,
  }

  const missing = []
  
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }

  // Log warnings for optional variables
  for (const [key, value] of Object.entries(optional)) {
    if (!value) {
      console.warn(`Warning: Optional environment variable ${key} is not set`)
    }
  }

  return {
    siteUrl: required.NEXT_PUBLIC_SITE_URL,
    googlePlacesApiKey: optional.GOOGLE_PLACES_API_KEY,
    yelpApiKey: optional.YELP_API_KEY,
    npiBaseUrl: optional.NPI_BASE_URL || 'https://npiregistry.cms.hhs.gov/api/',
  }
}

// Validate on import (will run during build)
if (process.env.NODE_ENV === 'production') {
  validateEnvironment()
}