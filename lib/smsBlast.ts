import { prisma } from './prisma'
import twilio from 'twilio'

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
 * Send SMS blast to all eligible providers in the lead's ZIP code
 * Returns the number of SMS messages sent
 */
export async function sendSMSBlastToEligibleProviders(lead: Lead): Promise<number> {
  if (!twilioClient || !process.env.TWILIO_MESSAGING_SERVICE_SID) {
    console.error('Twilio not configured - cannot send SMS blast')
    return 0
  }

  try {
    // Find all eligible providers in the ZIP code
    const eligibleProviders = await findEligibleProvidersForSMS(lead.zip)

    if (eligibleProviders.length === 0) {
      console.log(`No eligible providers found for SMS blast in ZIP ${lead.zip}`)
      return 0
    }

    console.log(`Found ${eligibleProviders.length} eligible providers for SMS blast in ZIP ${lead.zip}`)

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

        const message = isTrial
          ? `New request in ${lead.city}, ${lead.state}. Reply YES if you can contact and schedule the patient now. Claim for $0 (Trial): ${claimUrl}`
          : `New request in ${lead.city}, ${lead.state}. Reply YES if you can contact and schedule the patient now. Claim for ${price}: ${claimUrl}`

        const result = await twilioClient!.messages.create({
          to: provider.phonePublic,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
          body: message
        })

        console.log(`✅ SMS sent to provider ${provider.id} (${provider.phonePublic}): ${result.sid}`)
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

/**
 * Find all providers eligible to receive SMS for this lead
 * Criteria:
 * 1. eligibleForLeads === true (has saved payment method)
 * 2. Service area includes the lead's ZIP code
 * 3. Has a phone number
 */
async function findEligibleProvidersForSMS(zipCode: string) {
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
      trialStatus: true,
      trialExpiresAt: true
    }
  })

  // Filter by ZIP code coverage
  const eligibleProviders = providers.filter(provider => {
    if (!provider.zipCodes) return false

    // Parse comma-separated ZIP codes
    const serviceZips = provider.zipCodes
      .split(',')
      .map(z => z.trim())
      .filter(z => z.length > 0)

    // Check if any service ZIP matches the lead ZIP
    return serviceZips.some(serviceZip => {
      // Exact match
      if (serviceZip === zipCode) return true

      // Wildcard match (e.g., "902*" matches "90210")
      if (serviceZip.includes('*')) {
        const prefix = serviceZip.replace('*', '')
        return zipCode.startsWith(prefix)
      }

      // Range match (e.g., "90210-90220")
      if (serviceZip.includes('-')) {
        const [start, end] = serviceZip.split('-').map(z => z.trim())
        return zipCode >= start && zipCode <= end
      }

      return false
    })
  })

  return eligibleProviders
}
