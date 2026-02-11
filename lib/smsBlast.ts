import { prisma } from './prisma'
import twilio from 'twilio'
import { isLeadInServiceRadius, getDistanceBetweenZips } from './zip-geocode'

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

interface Lead {
  id: string
  zip: string
  urgency: 'STANDARD' | 'STAT'
  city: string
  state: string
}

/**
 * Send SMS blast to all eligible providers within service radius of the lead
 * Returns the number of SMS messages sent
 */
export async function sendSMSBlastToEligibleProviders(lead: Lead): Promise<number> {
  if (!twilioClient || !process.env.TWILIO_MESSAGING_SERVICE_SID) {
    console.error('Twilio not configured - cannot send SMS blast')
    return 0
  }

  try {
    // Find all eligible providers within service radius
    const eligibleProviders = await findEligibleProvidersForSMS(lead.zip)

    if (eligibleProviders.length === 0) {
      console.log(`No eligible providers found for SMS blast near ZIP ${lead.zip} (${lead.city}, ${lead.state})`)
      return 0
    }

    console.log(`Found ${eligibleProviders.length} eligible providers for SMS blast near ZIP ${lead.zip}`)

    // Determine pricing based on urgency
    const price = lead.urgency === 'STAT' ? '$50' : '$20'

    // Construct claim URL
    const claimUrl = `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/claim/${lead.id}`

    // Send SMS to each provider
    const sendPromises = eligibleProviders.map(async (provider) => {
      if (!provider.phonePublic) {
        console.log(`Provider ${provider.id} has no phone number - skipping SMS`)
        return null
      }

      try {
        // Determine if provider is on trial
        const isTrial = provider.trialStatus === 'ACTIVE' && provider.trialExpiresAt && provider.trialExpiresAt > new Date()

        // Include distance in message if available
        const distanceInfo = provider.distance ? ` (~${Math.round(provider.distance)} mi)` : ''

        const message = isTrial
          ? `New request in ${lead.city}, ${lead.state}${distanceInfo}. Reply YES if you can contact and schedule the patient now. Claim for $0 (Trial): ${claimUrl}`
          : `New request in ${lead.city}, ${lead.state}${distanceInfo}. Reply YES if you can contact and schedule the patient now. Claim for ${price}: ${claimUrl}`

        const result = await twilioClient!.messages.create({
          to: provider.phonePublic,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
          body: message
        })

        console.log(`✅ SMS sent to provider ${provider.name} (${provider.phonePublic})${distanceInfo}: ${result.sid}`)
        return result
      } catch (error: any) {
        console.error(`Failed to send SMS to provider ${provider.id}:`, error.message)
        return null
      }
    })

    const results = await Promise.allSettled(sendPromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length

    console.log(`SMS Blast complete: ${successCount}/${eligibleProviders.length} messages sent`)

    return successCount
  } catch (error) {
    console.error('SMS blast error:', error)
    return 0
  }
}

interface EligibleProvider {
  id: string
  name: string
  phonePublic: string | null
  zipCodes: string | null
  serviceRadiusMiles: number | null
  trialStatus: string | null
  trialExpiresAt: Date | null
  distance?: number
}

/**
 * Find all providers eligible to receive SMS for this lead
 * Uses radius-based matching with the provider's service area
 *
 * Criteria:
 * 1. eligibleForLeads === true (activated for lead routing)
 * 2. Has a ZIP code set
 * 3. Lead is within the provider's service radius
 * 4. Has a phone number
 */
async function findEligibleProvidersForSMS(leadZip: string): Promise<EligibleProvider[]> {
  const providers = await prisma.provider.findMany({
    where: {
      eligibleForLeads: true,
      zipCodes: {
        not: null
      },
      phonePublic: {
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      phonePublic: true,
      zipCodes: true,
      serviceRadiusMiles: true,
      trialStatus: true,
      trialExpiresAt: true
    }
  })

  // Filter by radius-based coverage
  const eligibleProviders: EligibleProvider[] = []

  for (const provider of providers) {
    if (!provider.zipCodes) continue

    // Get provider's primary ZIP (first one in the list)
    const serviceZips = provider.zipCodes
      .split(',')
      .map(z => z.trim())
      .filter(z => z.length >= 5)

    if (serviceZips.length === 0) continue

    const primaryZip = serviceZips[0]
    const radius = provider.serviceRadiusMiles || 25 // Default 25 mile radius

    // Check if lead is within service radius using geocoding
    if (isLeadInServiceRadius(primaryZip, leadZip, radius)) {
      const distance = getDistanceBetweenZips(primaryZip, leadZip)
      eligibleProviders.push({
        ...provider,
        distance: distance ?? undefined
      })
      continue
    }

    // Fallback: Check explicit ZIP coverage (wildcard/range matching)
    const isExplicitMatch = serviceZips.some(serviceZip => {
      // Exact match
      if (serviceZip === leadZip) return true

      // Wildcard match (e.g., "902*" matches "90210")
      if (serviceZip.includes('*')) {
        const prefix = serviceZip.replace('*', '')
        return leadZip.startsWith(prefix)
      }

      // Range match (e.g., "90210-90220")
      if (serviceZip.includes('-') && !serviceZip.startsWith('-')) {
        const [start, end] = serviceZip.split('-').map(z => z.trim())
        if (start.length >= 5 && end.length >= 5) {
          return leadZip >= start && leadZip <= end
        }
      }

      return false
    })

    if (isExplicitMatch) {
      const distance = getDistanceBetweenZips(primaryZip, leadZip)
      eligibleProviders.push({
        ...provider,
        distance: distance ?? undefined
      })
    }
  }

  // Sort by distance (closest first)
  eligibleProviders.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))

  return eligibleProviders
}
