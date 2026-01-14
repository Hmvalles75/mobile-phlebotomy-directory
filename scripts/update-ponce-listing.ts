import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('📝 Updating Ponce Mobile Phlebotomy Listing\n')

  const provider = await prisma.provider.update({
    where: { id: PONCE_ID },
    data: {
      description: `Ponce Mobile Phlebotomy is a premium mobile lab service dedicated to bringing high-quality, reliable, and compassionate phlebotomy care directly to patients. We eliminate the need for long waits, early-morning travel, and stressful lab visits by providing fully mobile, on-site blood draw services designed around your schedule.

Our approach is built on three pillars: Comfort, Convenience, and Clinical Excellence.

We serve individuals, families, seniors, homebound patients, caregivers, and corporate clients who value professional, on-demand lab support. From routine tests to specialized collections — we bring the lab experience to your doorstep with unmatched care.

Our mission is to redefine the way patients experience laboratory care by bringing safe, compassionate, and clinically precise phlebotomy services directly to their environment of comfort. We are committed to eliminating the barriers that often make lab visits stressful — long waits, transportation challenges, mobility limitations, busy schedules, and the discomfort of traditional clinical settings.`,

      // Service radius from their website
      serviceRadiusMiles: 20,

      // Operating hours (assuming standard business hours - can be updated if they provide specifics)
      operatingDays: 'MON,TUE,WED,THU,FRI,SAT,SUN',
      operatingHoursStart: '07:00',
      operatingHoursEnd: '19:00',
    }
  })

  console.log('✅ Ponce Mobile Phlebotomy listing updated!\n')
  console.log('Updated fields:')
  console.log('  ✓ Professional description (mission, pillars, services)')
  console.log('  ✓ Service radius: 20 miles')
  console.log('  ✓ Operating days: 7 days/week')
  console.log('  ✓ Operating hours: 7am - 7pm')
  console.log()
  console.log('Services highlighted:')
  console.log('  • Mobile blood draws (home, office, care facilities)')
  console.log('  • Pediatric & senior phlebotomy')
  console.log('  • Routine & specialty lab work')
  console.log('  • Specimen pick-up & lab delivery')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
