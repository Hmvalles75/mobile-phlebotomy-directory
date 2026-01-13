import { prisma } from '../lib/prisma'
import { encodeSession, getSessionExpiration } from '../lib/auth'

async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API Response\n')

  // Get test provider
  const provider = await prisma.provider.findFirst({
    where: { name: 'Test Provider' }
  })

  if (!provider) {
    console.log('❌ Test Provider not found')
    return
  }

  // Create a mock session
  const session = {
    providerId: provider.id,
    email: provider.claimEmail || provider.email || '',
    name: provider.name,
    status: provider.status,
    expiresAt: getSessionExpiration()
  }

  console.log('Session:', session)
  console.log('Provider ID:', provider.id)
  console.log()

  // Simulate what the API does
  const now = new Date()
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const currentDay = dayNames[now.getDay()]
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

  console.log('🕐 Time Check:')
  console.log(`Current day: ${currentDay}`)
  console.log(`Current time: ${currentTime}`)
  console.log(`Operating days: ${provider.operatingDays}`)
  console.log(`Operating hours: ${provider.operatingHoursStart} - ${provider.operatingHoursEnd}`)

  const operatingDaysList = provider.operatingDays?.split(',').map(d => d.trim()) || []
  const isOperatingToday = operatingDaysList.includes(currentDay)
  const isWithinHours = provider.operatingHoursStart && provider.operatingHoursEnd
    ? currentTime >= provider.operatingHoursStart && currentTime <= provider.operatingHoursEnd
    : true

  console.log(`Is operating today? ${isOperatingToday}`)
  console.log(`Is within hours? ${isWithinHours}`)
  console.log(`Provider available? ${isOperatingToday && isWithinHours}\n`)

  if (!isOperatingToday || !isWithinHours) {
    console.log('❌ PROBLEM FOUND: Provider is NOT available right now!')
    console.log('This is why leads are not showing.')
    console.log()
    if (!isOperatingToday) {
      console.log(`Today is ${currentDay}, but operating days are: ${provider.operatingDays}`)
    }
    if (!isWithinHours) {
      console.log(`Current time ${currentTime} is outside operating hours ${provider.operatingHoursStart}-${provider.operatingHoursEnd}`)
    }
    return
  }

  // Test lead filtering
  const providerZipCodes = provider.zipCodes ? provider.zipCodes.split(',').map(z => z.trim()) : []
  const primaryZip = providerZipCodes[0] || null
  const serviceRadius = provider.serviceRadiusMiles || 25

  console.log('📍 Location Settings:')
  console.log(`Primary ZIP: ${primaryZip}`)
  console.log(`Service Radius: ${serviceRadius} miles\n`)

  const allOpenLeads = await prisma.lead.findMany({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Found ${allOpenLeads.length} OPEN leads total\n`)

  if (primaryZip) {
    const { isLeadInServiceRadius } = await import('../lib/zip-geocode')
    const filteredLeads = allOpenLeads.filter(lead =>
      isLeadInServiceRadius(primaryZip, lead.zip, serviceRadius)
    )

    console.log(`✅ ${filteredLeads.length} leads within ${serviceRadius} miles`)

    if (filteredLeads.length > 0) {
      console.log('\nLeads that SHOULD be visible:')
      filteredLeads.slice(0, 5).forEach(lead => {
        console.log(`  - ${lead.city}, ${lead.state} ${lead.zip}`)
      })
    }
  }
}

testDashboardAPI()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
