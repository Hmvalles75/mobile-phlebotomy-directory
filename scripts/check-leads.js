const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkLeads() {
  try {
    console.log('Checking leads in database...')

    const leads = await prisma.lead.findMany({
      include: {
        provider: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\nTotal leads: ${leads.length}`)

    if (leads.length > 0) {
      console.log('\nRecent leads:')
      leads.forEach((lead, i) => {
        console.log(`\n${i + 1}. ${lead.fullName}`)
        console.log(`   City: ${lead.city}, ${lead.state} ${lead.zip}`)
        console.log(`   Status: ${lead.status}`)
        console.log(`   Created: ${lead.createdAt}`)
        console.log(`   Provider: ${lead.provider?.name || 'None (Unserved)'}`)
      })
    } else {
      console.log('\nNo leads found in database.')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLeads()
