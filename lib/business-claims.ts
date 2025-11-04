/**
 * Manage business claim submissions and verifications
 *
 * IMPORTANT: This module uses Node.js fs module and can ONLY be imported in server components.
 * For client components, use the provider-tiers.ts module which includes cached verification data.
 */

import fs from 'fs'
import path from 'path'

export interface BusinessClaim {
  id: string
  submittedAt: string
  status: 'pending' | 'registered' | 'rejected'

  // Provider information
  providerId: string
  providerName: string

  // Claimant information
  claimantName: string
  claimantEmail: string
  claimantPhone: string
  requestedUpdates: string
  isOwnerConfirmed: boolean

  // Verification
  verifiedAt?: string
  verificationMethod?: 'email_reply' | 'phone_call' | 'manual'
  verificationNotes?: string

  // Metadata
  ipAddress?: string
  userAgent?: string
}

const CLAIMS_FILE = path.join(process.cwd(), 'data', 'business-claims.json')

/**
 * Ensure the data directory and file exist
 */
function ensureDataFile() {
  const dataDir = path.dirname(CLAIMS_FILE)

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(CLAIMS_FILE)) {
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify([], null, 2))
  }
}

/**
 * Get all business claims
 */
export function getAllClaims(): BusinessClaim[] {
  ensureDataFile()

  try {
    const data = fs.readFileSync(CLAIMS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading business claims:', error)
    return []
  }
}

/**
 * Add a new business claim
 */
export function addBusinessClaim(claim: Omit<BusinessClaim, 'id' | 'submittedAt' | 'status'>): BusinessClaim {
  ensureDataFile()

  const newClaim: BusinessClaim = {
    id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    ...claim
  }

  const claims = getAllClaims()
  claims.push(newClaim)

  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2))

  return newClaim
}

/**
 * Update claim status
 */
export function updateClaimStatus(
  id: string,
  status: 'pending' | 'registered' | 'rejected',
  verificationData?: {
    verificationMethod?: 'email_reply' | 'phone_call' | 'manual'
    verificationNotes?: string
  }
): boolean {
  ensureDataFile()

  const claims = getAllClaims()
  const index = claims.findIndex(claim => claim.id === id)

  if (index === -1) {
    return false
  }

  claims[index].status = status

  if (status === 'registered') {
    claims[index].verifiedAt = new Date().toISOString()
    if (verificationData?.verificationMethod) {
      claims[index].verificationMethod = verificationData.verificationMethod
    }
    if (verificationData?.verificationNotes) {
      claims[index].verificationNotes = verificationData.verificationNotes
    }
  }

  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2))

  return true
}

/**
 * Get a single claim by ID
 */
export function getClaimById(id: string): BusinessClaim | null {
  const claims = getAllClaims()
  return claims.find(claim => claim.id === id) || null
}

/**
 * Get claims by provider ID
 */
export function getClaimsByProviderId(providerId: string): BusinessClaim[] {
  const claims = getAllClaims()
  return claims.filter(claim => claim.providerId === providerId)
}

/**
 * Check if a provider has a registered claim
 */
export function isProviderRegistered(providerId: string): boolean {
  const claims = getClaimsByProviderId(providerId)
  return claims.some(claim => claim.status === 'registered')
}

/**
 * Delete a claim
 */
export function deleteClaim(id: string): boolean {
  ensureDataFile()

  const claims = getAllClaims()
  const filtered = claims.filter(claim => claim.id !== id)

  if (filtered.length === claims.length) {
    return false // No claim found
  }

  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(filtered, null, 2))
  return true
}
