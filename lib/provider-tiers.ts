/**
 * Provider tier management system
 *
 * TIER 1: Basic Listing (No badge)
 * - Providers added without their knowledge
 * - Not engaged
 *
 * TIER 2: Registered Provider ("✓ Registered" badge)
 * - Submitted add-provider form OR claimed their listing
 * - Actively engaged
 *
 * TIER 3: Featured Provider ("⭐ Featured" badge)
 * - Paying customers ($100/month)
 * - Premium placement
 */

export type ProviderTier = 'basic' | 'registered' | 'featured'

interface ProviderTierData {
  providerId: string
  tier: ProviderTier
  registeredAt?: string
  featuredUntil?: string
  notes?: string
}

// Cache for tier data - loaded at module initialization
let tierDataCache: Record<string, ProviderTierData> | null = null

/**
 * Load tier data from JSON file (server-side only)
 */
function loadTierDataFromFile(): Record<string, ProviderTierData> {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    return tierDataCache || {}
  }

  try {
    const fs = require('fs')
    const path = require('path')
    const TIERS_FILE = path.join(process.cwd(), 'data', 'provider-tiers.json')

    if (fs.existsSync(TIERS_FILE)) {
      const data = fs.readFileSync(TIERS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading provider tiers:', error)
  }

  return {}
}

/**
 * Get all provider tier data
 */
export function getAllProviderTiers(): Record<string, ProviderTierData> {
  if (!tierDataCache) {
    tierDataCache = loadTierDataFromFile()
  }
  return tierDataCache
}

/**
 * Get provider tier
 */
export function getProviderTier(providerId: string): ProviderTier {
  const tiers = getAllProviderTiers()
  return tiers[providerId]?.tier || 'basic'
}

/**
 * Check if provider is registered (submitted form or claimed)
 */
export function isProviderRegistered(providerId: string): boolean {
  const tier = getProviderTier(providerId)
  return tier === 'registered' || tier === 'featured'
}

/**
 * Check if provider is featured (paying customer)
 */
export function isProviderFeatured(providerId: string): boolean {
  const tier = getProviderTier(providerId)
  if (tier !== 'featured') return false

  const tiers = getAllProviderTiers()
  const providerData = tiers[providerId]

  // Check if featured subscription is still active
  if (providerData.featuredUntil) {
    return new Date(providerData.featuredUntil) > new Date()
  }

  return true
}

/**
 * Set provider tier (server-side only)
 */
export function setProviderTier(
  providerId: string,
  tier: ProviderTier,
  options?: {
    featuredUntil?: string
    notes?: string
  }
): boolean {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    console.error('setProviderTier can only be called on the server')
    return false
  }

  try {
    const fs = require('fs')
    const path = require('path')
    const TIERS_FILE = path.join(process.cwd(), 'data', 'provider-tiers.json')
    const dataDir = path.dirname(TIERS_FILE)

    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Read existing data
    let tiers: Record<string, ProviderTierData> = {}
    if (fs.existsSync(TIERS_FILE)) {
      const data = fs.readFileSync(TIERS_FILE, 'utf-8')
      tiers = JSON.parse(data)
    }

    // Update tier data
    tiers[providerId] = {
      providerId,
      tier,
      registeredAt: tiers[providerId]?.registeredAt || new Date().toISOString(),
      featuredUntil: options?.featuredUntil,
      notes: options?.notes
    }

    // Write to file
    fs.writeFileSync(TIERS_FILE, JSON.stringify(tiers, null, 2))

    // Update cache
    tierDataCache = tiers

    return true
  } catch (error) {
    console.error('Error setting provider tier:', error)
    return false
  }
}

/**
 * Mark provider as registered (when they submit form or claim listing)
 */
export function markProviderAsRegistered(providerId: string): boolean {
  return setProviderTier(providerId, 'registered')
}

/**
 * Mark provider as featured (when they pay for premium)
 */
export function markProviderAsFeatured(
  providerId: string,
  monthsDuration: number = 1
): boolean {
  const featuredUntil = new Date()
  featuredUntil.setMonth(featuredUntil.getMonth() + monthsDuration)

  return setProviderTier(providerId, 'featured', {
    featuredUntil: featuredUntil.toISOString()
  })
}

/**
 * Get badge info for a provider
 */
export function getProviderBadge(providerId: string): {
  show: boolean
  text: string
  color: string
  icon: string
} | null {
  const tier = getProviderTier(providerId)

  if (tier === 'featured' && isProviderFeatured(providerId)) {
    return {
      show: true,
      text: 'Featured Provider',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: '⭐'
    }
  }

  if (tier === 'registered') {
    return {
      show: true,
      text: 'Registered',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✓'
    }
  }

  // Tier 1 (basic) - no badge
  return null
}
