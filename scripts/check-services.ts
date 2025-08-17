#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkServices() {
  try {
    const services = await prisma.service.findMany({
      include: {
        providers: {
          include: {
            provider: true
          }
        }
      }
    })
    
    console.log('Services in database:')
    services.forEach(service => {
      console.log(`- ${service.name}: ${service.providers.length} providers`)
    })
    
    // Check some sample providers
    const sampleProviders = await prisma.provider.findMany({
      take: 5,
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    })
    
    console.log('\nSample providers and their services:')
    sampleProviders.forEach(provider => {
      console.log(`${provider.name}: ${provider.services.map(s => s.service.name).join(', ')}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkServices()