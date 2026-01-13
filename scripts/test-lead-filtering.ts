import { prisma } from '../lib/prisma'
import { isLeadInServiceRadius } from '../lib/zip-geocode'

async function testLeadFiltering() {
  console.log('🧪 Testing Lead Filtering for Test Provider\n')

  const provider = await prisma.provider.findFirst({
    where: { name: 'Test Provider' },
    select: {
      id: true,
      name: true,
      zipCodes: true,
      serviceRadiusMiles: true,
      operatingDays: true,
      operatingHoursStart: true,
      operatingHoursEnd: true
    }
  })

  if (!provider) {
    console.log('❌ Test Provider not found')
    return
  }

  console.log(`Provider: ${provider.name}`)
  const providerZipCodes = provider.zipCodes ? provider.zipCodes.split(',').map(z => z.trim()) : []
  const primaryZip = providerZipCodes[0] || null
  const serviceRadius = provider.serviceRadiusMiles || 25

  console.log(`Primary ZIP: ${primaryZip}`)
  console.log(`Service Radius: ${serviceRadius} miles`)
  console.log(`Operating Days: ${provider.operatingDays}`)
  console.log(`Operating Hours: ${provider.operatingHoursStart} - ${provider.operatingHoursEnd}\n`)

  // Check if provider would be "available now"
  if (!provider.operatingDays || !provider.operatingHoursStart || !provider.operatingHoursEnd) {
    console.log('✓ No availability settings - provider is always available (backwards compatibility)\n')
  } else {
    const now = new Date()
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const currentDay = dayNames[now.getDay()]
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const operatingDays = provider.operatingDays.split(',')
    const isOperatingToday = operatingDays.includes(currentDay)
    const isWithinHours = currentTime >= provider.operatingHoursStart && currentTime <= provider.operatingHoursEnd

    console.log(`Current: ${currentDay} at ${currentTime}`)
    console.log(`Operating today? ${isOperatingToday ? '✓ Yes' : '✗ No'}`)
    console.log(`Within hours? ${isWithinHours ? '✓ Yes' : '✗ No'}`)
    console.log(`Provider available now? ${isOperatingToday && isWithinHours ? '✓ YES' : '✗ NO'}\n`)
  }

  // Fetch all OPEN leads
  const allOpenLeads = await prisma.lead.findMany({
    where: { status: 'OPEN' },
    select: {
      id: true,
      fullName: true,
      city: true,
      state: true,
      zip: true,
      urgency: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`📊 Found ${allOpenLeads.length} total OPEN leads\n`)

  if (primaryZip && allOpenLeads.length > 0) {
    console.log('🔍 Filtering by radius...\n')

    allOpenLeads.forEach((lead) => {
      const inRadius = isLeadInServiceRadius(primaryZip, lead.zip, serviceRadius)
      const symbol = inRadius ? '✓' : '✗'
      console.log(`${symbol} ${lead.city}, ${lead.state} ${lead.zip}`)
      console.log(`   ${lead.fullName} - ${lead.urgency}`)
      console.log(`   In radius? ${inRadius}`)
      console.log()
    })

    const filteredLeads = allOpenLeads.filter(lead =>
      isLeadInServiceRadius(primaryZip, lead.zip, serviceRadius)
    )

    console.log(`\n✅ RESULT: ${filteredLeads.length} lead(s) within ${serviceRadius} miles of ${primaryZip}`)

    if (filteredLeads.length > 0) {
      console.log('\nThese leads SHOULD be visible on the dashboard!')
    }
  } else if (!primaryZip) {
    console.log('❌ No primary ZIP code set - cannot filter by radius')
  }
}

testLeadFiltering()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
