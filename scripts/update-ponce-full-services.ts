import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('📝 Updating Ponce Mobile Phlebotomy with Complete Services List\n')

  const provider = await prisma.provider.update({
    where: { id: PONCE_ID },
    data: {
      description: `Ponce Mobile Phlebotomy is a premium mobile lab service dedicated to bringing high-quality, reliable, and compassionate phlebotomy care directly to patients. We eliminate the need for long waits, early-morning travel, and stressful lab visits by providing fully mobile, on-site blood draw services designed around your schedule.

Our approach is built on three pillars: Comfort, Convenience, and Clinical Excellence.

We serve individuals, families, seniors, homebound patients, caregivers, and corporate clients who value professional, on-demand lab support. From routine tests to specialized collections — we bring the lab experience to your doorstep with unmatched care.

Our Services Include:

• Mobile blood draws (home, office, or facility visits)
• Routine and specialty laboratory specimen collection
• STAT and time-sensitive collections
• Wellness and preventive lab panels
• Doctor-ordered laboratory collections
• Specialty lab kits (client or lab provided)
• Senior and mobility-limited patient services
• Corporate and workplace collections
• Residential care facility collections

Our mission is to redefine the way patients experience laboratory care by bringing safe, compassionate, and clinically precise phlebotomy services directly to their environment of comfort. We are committed to eliminating the barriers that often make lab visits stressful — long waits, transportation challenges, mobility limitations, busy schedules, and the discomfort of traditional clinical settings.`
    }
  })

  console.log('✅ Services list updated!\n')
  console.log('Provider:', provider.name)
  console.log()
  console.log('Updated services now include:')
  console.log('  • Mobile blood draws (home, office, or facility visits)')
  console.log('  • Routine and specialty laboratory specimen collection')
  console.log('  • STAT and time-sensitive collections')
  console.log('  • Wellness and preventive lab panels')
  console.log('  • Doctor-ordered laboratory collections')
  console.log('  • Specialty lab kits (client or lab provided)')
  console.log('  • Senior and mobility-limited patient services')
  console.log('  • Corporate and workplace collections')
  console.log('  • Residential care facility collections')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
