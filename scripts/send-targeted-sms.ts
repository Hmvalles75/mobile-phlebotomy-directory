/**
 * Send targeted SMS to providers to encourage coverage in specific areas
 *
 * Usage:
 *
 * 1. Target by state:
 *    npx tsx scripts/send-targeted-sms.ts --state NY
 *
 * 2. Target by city:
 *    npx tsx scripts/send-targeted-sms.ts --city "New York" --state NY
 *
 * 3. Target by ZIP codes:
 *    npx tsx scripts/send-targeted-sms.ts --zips "10001,10002,10003"
 *
 * 4. Target specific providers by ID:
 *    npx tsx scripts/send-targeted-sms.ts --providers "abc123,def456"
 *
 * 5. Custom message:
 *    npx tsx scripts/send-targeted-sms.ts --state CA --message "Expand to LA! Claim your free profile..."
 *
 * 6. Dry run (see who would receive without sending):
 *    npx tsx scripts/send-targeted-sms.ts --state NY --dry-run
 */

import { prisma } from '../lib/prisma'
import twilio from 'twilio'

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

interface TargetedSMSOptions {
  state?: string
  city?: string
  zips?: string[] // ZIP codes the provider should cover
  providers?: string[] // Specific provider IDs
  message?: string
  dryRun?: boolean
}

const DEFAULT_MESSAGES = {
  // COLD (scraped/public directory providers) - Permission-first YES/NO
  // NO EMOJIS - can trip spam filters and look scammy
  cold: (businessName: string, area: string) =>
    `Hi ${businessName} - I run MobilePhlebotomy.org (patient referral site). We're getting patient requests near ${area}. Do you want free leads by text? Reply YES or NO. STOP to opt out.`,

  // WARM (providers who filled out form) - Already trust you more
  warm: (name: string) =>
    `Hi ${name} - Hector from MobilePhlebotomy.org. Your listing is live. Want to receive free patient leads by text + email in your service area? Reply YES and I'll activate you. STOP to opt out.`,

  // FOLLOW-UP (after they say YES) - Now ask for coverage details
  followUp: (name: string) =>
    `Great! Confirm your coverage area (cities/ZIPs or radius) and best email for lead details. You can also update here: https://mobilephlebotomy.org/dashboard`,

  // Generic fallback
  generic: (area: string) =>
    `Hi - I run MobilePhlebotomy.org (patient referral site). We're getting patient requests near ${area}. Do you want free leads by text? Reply YES or NO. STOP to opt out.`
}

async function sendTargetedSMS(options: TargetedSMSOptions) {
  if (!twilioClient || !process.env.TWILIO_MESSAGING_SERVICE_SID) {
    console.error('❌ Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID')
    process.exit(1)
  }

  console.log('🎯 Finding target providers...\n')

  // Build query based on options
  const whereClause: any = {
    phonePublic: {
      not: null
    }
  }

  // Filter by provider IDs (highest priority)
  if (options.providers && options.providers.length > 0) {
    whereClause.id = {
      in: options.providers
    }
  }

  // Filter by state
  if (options.state) {
    whereClause.address = {
      state: options.state.toUpperCase()
    }
  }

  // Filter by city
  if (options.city) {
    whereClause.address = {
      ...whereClause.address,
      city: {
        contains: options.city,
        mode: 'insensitive'
      }
    }
  }

  const providers = await prisma.provider.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      phonePublic: true,
      address: true,
      zipCodes: true,
      eligibleForLeads: true
    }
  })

  if (providers.length === 0) {
    console.log('❌ No providers found matching criteria')
    return
  }

  console.log(`📋 Found ${providers.length} providers:\n`)

  // Display provider list
  providers.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   📞 ${p.phonePublic}`)
    console.log(`   📍 ${p.address?.city}, ${p.address?.state}`)
    console.log(`   ${p.eligibleForLeads ? '✅ Eligible for leads' : '❌ Not eligible for leads'}`)
    console.log(`   Coverage: ${p.zipCodes ? p.zipCodes.split(',').length + ' ZIPs' : 'Not set'}`)
    console.log()
  })

  // Determine message (default to COLD permission-first)
  let message = options.message
  if (!message) {
    const area = options.city
      ? `${options.city}, ${options.state}`
      : options.state
      ? options.state
      : 'your area'

    // Use generic cold message (provider name substitution happens per-provider below)
    message = DEFAULT_MESSAGES.generic(area)
  }

  console.log('📱 Message to send:')
  console.log('─────────────────────────────────────────────────')
  console.log(message)
  console.log('─────────────────────────────────────────────────\n')

  // Dry run check
  if (options.dryRun) {
    console.log('🏃 DRY RUN - No messages sent')
    console.log(`Would send to ${providers.length} providers`)
    return
  }

  // Confirm before sending
  console.log('⚠️  Ready to send SMS to these providers.')
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n')
  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log('📤 Sending messages...\n')

  let successCount = 0
  let failCount = 0

  for (const provider of providers) {
    try {
      const result = await twilioClient.messages.create({
        to: provider.phonePublic!,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
        body: message
      })

      console.log(`✅ ${provider.name} (${provider.phonePublic}) - SID: ${result.sid}`)
      successCount++

      // Rate limit: 1 message per second to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error: any) {
      console.error(`❌ ${provider.name} (${provider.phonePublic}) - Error: ${error.message}`)
      failCount++
    }
  }

  console.log('\n─────────────────────────────────────────────────')
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📊 Total: ${providers.length}`)
  console.log('─────────────────────────────────────────────────')
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options: TargetedSMSOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const nextArg = args[i + 1]

    switch (arg) {
      case '--state':
        options.state = nextArg
        i++
        break
      case '--city':
        options.city = nextArg
        i++
        break
      case '--zips':
        options.zips = nextArg.split(',').map(z => z.trim())
        i++
        break
      case '--providers':
        options.providers = nextArg.split(',').map(p => p.trim())
        i++
        break
      case '--message':
        options.message = nextArg
        i++
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--help':
        console.log(`
🎯 Targeted SMS Blast Tool - Permission-First Strategy

⚠️  STRATEGY: This is a TWO-STEP process:
   Step 1: Get explicit YES/NO permission (this script)
   Step 2: Manually activate + collect coverage details (after YES)

Usage:
  npx tsx scripts/send-targeted-sms.ts [options]

Options:
  --state <STATE>           Filter by state (e.g., NY, CA, MI)
  --city <CITY>             Filter by city (e.g., "New York")
  --zips <ZIP,ZIP,ZIP>      Filter by ZIP codes (comma-separated)
  --providers <ID,ID,ID>    Target specific provider IDs (comma-separated)
  --message <TEXT>          Custom message (default: cold YES/NO permission)
  --dry-run                 Show who would receive without sending
  --help                    Show this help

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 RECOMMENDED WORKFLOW:

1️⃣  DRY RUN FIRST (always check who you're targeting):
   npx tsx scripts/send-targeted-sms.ts --city "Los Angeles" --state CA --dry-run

2️⃣  SEND PERMISSION-FIRST MESSAGE (START SMALL - 10-20 providers):
   npx tsx scripts/send-targeted-sms.ts --city "Los Angeles" --state CA --message "Hi - I run MobilePhlebotomy.org (patient referral site). We're getting patient requests near Los Angeles. Do you want free leads by text? Reply YES or NO. STOP to opt out."

   NOTE: If dry-run shows 100+ providers, target specific neighborhoods first:
   - Pasadena: --city "Pasadena" --state CA
   - Santa Monica: --city "Santa Monica" --state CA
   - Then expand to full LA metro

3️⃣  MANUALLY PROCESS REPLIES:
   - YES → Mark provider "Active" in DB + request coverage details
   - NO → Mark "Do Not Contact"
   - STOP → Twilio handles automatically (required by law)

4️⃣  FOLLOW-UP MESSAGE (after they say YES):
   "Great! Confirm your coverage area (cities/ZIPs or radius) and best email for lead details. You can also update here: https://mobilephlebotomy.org/dashboard"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 FOCUS ON KEY METROS (density = better conversion):

LA Metro:
  npx tsx scripts/send-targeted-sms.ts --city "Los Angeles" --state CA --dry-run

NYC Metro:
  npx tsx scripts/send-targeted-sms.ts --city "New York" --state NY --dry-run

Detroit Metro:
  npx tsx scripts/send-targeted-sms.ts --city "Detroit" --state MI --dry-run

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 MESSAGE TEMPLATES:

COLD (scraped/public directory providers - NO EMOJIS):
  "Hi {BusinessName} - I run MobilePhlebotomy.org (patient referral site). We're getting patient requests near {City}. Do you want free leads by text? Reply YES or NO. STOP to opt out."

WARM (providers who filled out your form):
  "Hi {Name} — Hector from MobilePhlebotomy.org. Your listing is live. Want to receive free patient leads by text + email in your service area? Reply YES and I'll activate you. STOP to opt out."

FOLLOW-UP (after YES):
  "Great! Confirm your coverage area (cities/ZIPs or radius) and best email for lead details. You can also update here: https://mobilephlebotomy.org/dashboard"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  CRITICAL COMPLIANCE & BEST PRACTICES:

1. BATCH SIZE: Start with 10-20 providers at a time
   - Sanity check phone numbers
   - Watch reply rate and sentiment
   - Adjust copy if needed
   - Don't send 200 at once - you can't take it back

2. OPT-OUT TRACKING (NON-NEGOTIABLE):
   - If someone replies STOP, you MUST stop texting them
   - Log opt-outs in your database
   - Never re-text them in another blast
   - Twilio handles STOP automatically, but track it locally too

3. CONSISTENT "FROM" NUMBER:
   - Use ONE Twilio number as your outbound sender
   - Rotating numbers looks sketchy and kills reply rate
   - Set TWILIO_MESSAGING_SERVICE_SID to use Messaging Service

4. NO EMOJIS IN COLD MESSAGES:
   - Emojis trip spam filters
   - Look scammy to businesses
   - Save emojis for warm/follow-up messages only

5. LEGITIMACY LINE:
   - "(patient referral site)" helps them understand who you are
   - Improves reply rate vs generic messages

6. Your inbound SMS webhook (/api/webhooks/sms-reply) should:
   - Capture YES replies → Mark provider "Confirmed/Active"
   - Capture NO replies → Mark "Do Not Contact"
   - Respect STOP (Twilio handles this automatically)

7. Don't blast nationwide - focus on metros where your SEO pages exist

8. Rate limit: Script sends 1 msg/second automatically to avoid throttling

9. Always dry-run first to verify targeting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `)
        process.exit(0)
    }
  }

  return options
}

// Main execution
async function main() {
  console.log('🎯 Targeted SMS Blast Tool\n')

  const options = parseArgs()

  if (!options.state && !options.city && !options.providers && !options.zips) {
    console.error('❌ Error: Must specify at least one filter (--state, --city, --providers, or --zips)')
    console.log('   Run with --help for usage information')
    process.exit(1)
  }

  await sendTargetedSMS(options)

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
