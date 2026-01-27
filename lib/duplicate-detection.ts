import { prisma } from '@/lib/prisma'

/**
 * Duplicate Detection Utility
 *
 * Detects and removes duplicate providers based on:
 * 1. Exact name match (case-insensitive)
 * 2. Similar name match (fuzzy)
 * 3. Same website/phone/email
 */

interface DuplicateGroup {
  name: string
  providers: Array<{
    id: string
    name: string
    website: string | null
    phone: string | null
    email: string | null
    createdAt: Date
    primaryCity: string | null
    primaryState: string | null
  }>
}

/**
 * Normalize provider name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[,.]$/, '') // Remove trailing punctuation
    .replace(/\s+(llc|inc|corp|ltd|co)$/i, '') // Remove common business suffixes
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    // Remove www., protocol, and query params for comparison
    return parsed.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '')
  }
}

/**
 * Find all duplicate provider groups
 */
export async function findDuplicates(): Promise<DuplicateGroup[]> {
  const allProviders = await prisma.provider.findMany({
    select: {
      id: true,
      name: true,
      website: true,
      phone: true,
      email: true,
      createdAt: true,
      primaryCity: true,
      primaryState: true
    },
    orderBy: {
      createdAt: 'desc' // Most recent first
    }
  })

  // Group by normalized name
  const nameGroups = new Map<string, typeof allProviders>()

  for (const provider of allProviders) {
    const normalizedName = normalizeName(provider.name)
    const existing = nameGroups.get(normalizedName) || []
    existing.push(provider)
    nameGroups.set(normalizedName, existing)
  }

  // Also check for website/email matches
  const websiteGroups = new Map<string, typeof allProviders>()

  for (const provider of allProviders) {
    if (provider.website) {
      const normalizedWebsite = normalizeUrl(provider.website)
      if (normalizedWebsite) {
        const existing = websiteGroups.get(normalizedWebsite) || []
        existing.push(provider)
        websiteGroups.set(normalizedWebsite, existing)
      }
    }
  }

  // Find groups with 2+ providers
  const duplicateGroups: DuplicateGroup[] = []

  for (const [name, providers] of nameGroups) {
    if (providers.length > 1) {
      duplicateGroups.push({
        name,
        providers
      })
    }
  }

  // Add website-based duplicates (if not already in name groups)
  for (const [website, providers] of websiteGroups) {
    if (providers.length > 1) {
      const normalizedNames = providers.map(p => normalizeName(p.name))
      const allSameName = normalizedNames.every(n => n === normalizedNames[0])

      if (!allSameName) {
        duplicateGroups.push({
          name: `website:${website}`,
          providers
        })
      }
    }
  }

  return duplicateGroups
}

/**
 * Remove duplicates, keeping the most recent entry
 */
export async function removeDuplicates(dryRun = false): Promise<{
  groupsFound: number
  providersDeleted: number
  details: Array<{ kept: string; deleted: string[] }>
}> {
  const duplicateGroups = await findDuplicates()
  const details: Array<{ kept: string; deleted: string[] }> = []
  let totalDeleted = 0

  for (const group of duplicateGroups) {
    if (group.providers.length < 2) continue

    // Keep the most recent provider (first in array since we ordered by createdAt desc)
    const keepProvider = group.providers[0]
    const deleteProviders = group.providers.slice(1)

    const deletedIds: string[] = []

    for (const provider of deleteProviders) {
      if (!dryRun) {
        await prisma.provider.delete({
          where: { id: provider.id }
        })
      }
      deletedIds.push(`${provider.name} (${provider.id})`)
      totalDeleted++
    }

    details.push({
      kept: `${keepProvider.name} (${keepProvider.id})`,
      deleted: deletedIds
    })
  }

  return {
    groupsFound: duplicateGroups.length,
    providersDeleted: totalDeleted,
    details
  }
}

/**
 * Check if a provider name would create a duplicate
 * Checks both Provider table AND PendingSubmission table
 */
export async function checkForDuplicate(
  name: string,
  website?: string | null,
  excludeId?: string,
  email?: string | null,
  phone?: string | null
): Promise<{ isDuplicate: boolean; existingProvider?: any }> {
  const normalizedName = normalizeName(name)
  const normalizedWebsite = website ? normalizeUrl(website) : null
  const normalizedEmail = email?.toLowerCase().trim()
  const normalizedPhone = phone?.replace(/\D/g, '') // Remove non-digits

  // Check existing providers in Provider table
  const providers = await prisma.provider.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined
    }
  })

  for (const provider of providers) {
    const providerNormalizedName = normalizeName(provider.name)

    // Exact name match
    if (providerNormalizedName === normalizedName) {
      return { isDuplicate: true, existingProvider: provider }
    }

    // Website match
    if (normalizedWebsite && provider.website) {
      const providerNormalizedWebsite = normalizeUrl(provider.website)
      if (providerNormalizedWebsite === normalizedWebsite) {
        return { isDuplicate: true, existingProvider: provider }
      }
    }
  }

  // NEW: Also check PendingSubmission table to prevent duplicate submissions
  const pendingSubmissions = await prisma.pendingSubmission.findMany({
    where: {
      status: 'PENDING' // Only check pending submissions
    }
  })

  for (const submission of pendingSubmissions) {
    const submissionNormalizedName = normalizeName(submission.businessName)
    const submissionNormalizedEmail = submission.email.toLowerCase().trim()
    const submissionNormalizedPhone = submission.phone.replace(/\D/g, '')

    // Check name match
    if (submissionNormalizedName === normalizedName) {
      return {
        isDuplicate: true,
        existingProvider: {
          name: submission.businessName,
          status: 'PENDING_SUBMISSION'
        }
      }
    }

    // Check email match (prevents same provider from submitting multiple times)
    if (normalizedEmail && submissionNormalizedEmail === normalizedEmail) {
      return {
        isDuplicate: true,
        existingProvider: {
          name: submission.businessName,
          status: 'PENDING_SUBMISSION_EMAIL_MATCH'
        }
      }
    }

    // Check phone match
    if (normalizedPhone && submissionNormalizedPhone === normalizedPhone) {
      return {
        isDuplicate: true,
        existingProvider: {
          name: submission.businessName,
          status: 'PENDING_SUBMISSION_PHONE_MATCH'
        }
      }
    }

    // Check website match
    if (normalizedWebsite && submission.website) {
      const submissionNormalizedWebsite = normalizeUrl(submission.website)
      if (submissionNormalizedWebsite === normalizedWebsite) {
        return {
          isDuplicate: true,
          existingProvider: {
            name: submission.businessName,
            status: 'PENDING_SUBMISSION_WEBSITE_MATCH'
          }
        }
      }
    }
  }

  return { isDuplicate: false }
}
