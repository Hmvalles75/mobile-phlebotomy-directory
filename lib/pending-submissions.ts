/**
 * Manage pending provider submissions
 * Fallback to JSON file storage when database is unavailable (Vercel production)
 */

import fs from 'fs'
import path from 'path'

// Try to import Prisma, but handle if it's unavailable
let prisma: any = null
let SubmissionStatus: any = null

try {
  const prismaModule = require('@/lib/prisma')
  const prismaClient = require('@prisma/client')
  prisma = prismaModule.prisma
  SubmissionStatus = prismaClient.SubmissionStatus
} catch (error) {
  console.warn('Prisma not available, using JSON file fallback')
}

export interface PendingProvider {
  id: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'

  // Form data
  businessName: string
  contactName: string
  email: string
  phone: string
  website?: string
  services?: string[]
  description: string
  address?: string
  city: string
  state: string
  zipCode?: string
  serviceArea?: string
  yearsExperience?: string
  licensed?: boolean
  insurance?: boolean
  certifications?: string
  specialties?: string
  emergencyAvailable?: boolean
  weekendAvailable?: boolean
  logo?: string

  // Metadata
  ipAddress?: string
  userAgent?: string
}

const SUBMISSIONS_FILE = path.join(process.cwd(), 'data', 'pending-submissions.json')

/**
 * Ensure the data directory and file exist
 */
function ensureDataFile() {
  const dataDir = path.dirname(SUBMISSIONS_FILE)

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2))
  }
}

/**
 * Read submissions from JSON file
 */
function readSubmissionsFromFile(): PendingProvider[] {
  try {
    ensureDataFile()
    const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading submissions file:', error)
    return []
  }
}

/**
 * Write submissions to JSON file
 */
function writeSubmissionsToFile(submissions: PendingProvider[]) {
  try {
    ensureDataFile()
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2))
  } catch (error) {
    console.error('Error writing submissions file:', error)
    throw error
  }
}

/**
 * Get all pending submissions
 */
export async function getPendingSubmissions(): Promise<PendingProvider[]> {
  // Try database first
  if (prisma) {
    try {
      const submissions = await prisma.pendingSubmission.findMany({
        orderBy: {
          submittedAt: 'desc'
        }
      })

      return submissions.map((sub: any) => ({
        id: sub.id,
        submittedAt: sub.submittedAt.toISOString(),
        status: sub.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
        businessName: sub.businessName,
        contactName: sub.contactName,
        email: sub.email,
        phone: sub.phone,
        website: sub.website || undefined,
        services: undefined,
        description: sub.description,
        address: sub.address || undefined,
        city: sub.city,
        state: sub.state,
        zipCode: sub.zipCode || undefined,
        serviceArea: sub.serviceArea || undefined,
        yearsExperience: sub.yearsExperience || undefined,
        licensed: sub.licensed,
        insurance: sub.insurance,
        certifications: sub.certifications || undefined,
        specialties: sub.specialties || undefined,
        emergencyAvailable: sub.emergencyAvailable,
        weekendAvailable: sub.weekendAvailable,
        logo: sub.logo || undefined,
        ipAddress: sub.ipAddress || undefined,
        userAgent: sub.userAgent || undefined
      }))
    } catch (error) {
      console.warn('Database error, falling back to file storage:', error)
    }
  }

  // Fallback to file storage
  return readSubmissionsFromFile()
}

/**
 * Add a new pending submission
 */
export async function addPendingSubmission(
  submission: Omit<PendingProvider, 'id' | 'submittedAt' | 'status'>
): Promise<PendingProvider> {
  // Try database first
  if (prisma) {
    try {
      const newSubmission = await prisma.pendingSubmission.create({
        data: {
          businessName: submission.businessName,
          contactName: submission.contactName,
          email: submission.email,
          phone: submission.phone,
          website: submission.website,
          description: submission.description,
          address: submission.address,
          city: submission.city,
          state: submission.state,
          zipCode: submission.zipCode,
          serviceArea: submission.serviceArea,
          yearsExperience: submission.yearsExperience,
          licensed: submission.licensed ?? false,
          insurance: submission.insurance ?? false,
          certifications: submission.certifications,
          specialties: submission.specialties,
          emergencyAvailable: submission.emergencyAvailable ?? false,
          weekendAvailable: submission.weekendAvailable ?? false,
          logo: submission.logo,
          ipAddress: submission.ipAddress,
          userAgent: submission.userAgent
        }
      })

      return {
        id: newSubmission.id,
        submittedAt: newSubmission.submittedAt.toISOString(),
        status: newSubmission.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
        businessName: newSubmission.businessName,
        contactName: newSubmission.contactName,
        email: newSubmission.email,
        phone: newSubmission.phone,
        website: newSubmission.website || undefined,
        description: newSubmission.description,
        address: newSubmission.address || undefined,
        city: newSubmission.city,
        state: newSubmission.state,
        zipCode: newSubmission.zipCode || undefined,
        serviceArea: newSubmission.serviceArea || undefined,
        yearsExperience: newSubmission.yearsExperience || undefined,
        licensed: newSubmission.licensed,
        insurance: newSubmission.insurance,
        certifications: newSubmission.certifications || undefined,
        specialties: newSubmission.specialties || undefined,
        emergencyAvailable: newSubmission.emergencyAvailable,
        weekendAvailable: newSubmission.weekendAvailable,
        logo: newSubmission.logo || undefined,
        ipAddress: newSubmission.ipAddress || undefined,
        userAgent: newSubmission.userAgent || undefined
      }
    } catch (error) {
      console.warn('Database error, falling back to file storage:', error)
    }
  }

  // Fallback to file storage
  const newSubmission: PendingProvider = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    businessName: submission.businessName,
    contactName: submission.contactName,
    email: submission.email,
    phone: submission.phone,
    website: submission.website,
    services: submission.services,
    description: submission.description,
    address: submission.address,
    city: submission.city,
    state: submission.state,
    zipCode: submission.zipCode,
    serviceArea: submission.serviceArea,
    yearsExperience: submission.yearsExperience,
    licensed: submission.licensed,
    insurance: submission.insurance,
    certifications: submission.certifications,
    specialties: submission.specialties,
    emergencyAvailable: submission.emergencyAvailable,
    weekendAvailable: submission.weekendAvailable,
    logo: submission.logo,
    ipAddress: submission.ipAddress,
    userAgent: submission.userAgent
  }

  const submissions = readSubmissionsFromFile()
  submissions.push(newSubmission)
  writeSubmissionsToFile(submissions)

  return newSubmission
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<boolean> {
  // Try database first
  if (prisma && SubmissionStatus) {
    try {
      const statusMap: Record<string, any> = {
        pending: SubmissionStatus.PENDING,
        approved: SubmissionStatus.APPROVED,
        rejected: SubmissionStatus.REJECTED
      }

      await prisma.pendingSubmission.update({
        where: { id },
        data: { status: statusMap[status] }
      })

      return true
    } catch (error) {
      console.warn('Database error, falling back to file storage:', error)
    }
  }

  // Fallback to file storage
  const submissions = readSubmissionsFromFile()
  const index = submissions.findIndex(sub => sub.id === id)

  if (index === -1) {
    return false
  }

  submissions[index].status = status
  writeSubmissionsToFile(submissions)

  return true
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(id: string): Promise<PendingProvider | null> {
  // Try database first
  if (prisma) {
    try {
      const sub = await prisma.pendingSubmission.findUnique({
        where: { id }
      })

      if (!sub) return null

      return {
        id: sub.id,
        submittedAt: sub.submittedAt.toISOString(),
        status: sub.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
        businessName: sub.businessName,
        contactName: sub.contactName,
        email: sub.email,
        phone: sub.phone,
        website: sub.website || undefined,
        description: sub.description,
        address: sub.address || undefined,
        city: sub.city,
        state: sub.state,
        zipCode: sub.zipCode || undefined,
        serviceArea: sub.serviceArea || undefined,
        yearsExperience: sub.yearsExperience || undefined,
        licensed: sub.licensed,
        insurance: sub.insurance,
        certifications: sub.certifications || undefined,
        specialties: sub.specialties || undefined,
        emergencyAvailable: sub.emergencyAvailable,
        weekendAvailable: sub.weekendAvailable,
        logo: sub.logo || undefined,
        ipAddress: sub.ipAddress || undefined,
        userAgent: sub.userAgent || undefined
      }
    } catch (error) {
      console.warn('Database error, falling back to file storage:', error)
    }
  }

  // Fallback to file storage
  const submissions = readSubmissionsFromFile()
  return submissions.find(sub => sub.id === id) || null
}

/**
 * Delete a submission
 */
export async function deleteSubmission(id: string): Promise<boolean> {
  // Try database first
  if (prisma) {
    try {
      await prisma.pendingSubmission.delete({
        where: { id }
      })
      return true
    } catch (error) {
      console.warn('Database error, falling back to file storage:', error)
    }
  }

  // Fallback to file storage
  const submissions = readSubmissionsFromFile()
  const filtered = submissions.filter(sub => sub.id !== id)

  if (filtered.length === submissions.length) {
    return false // No submission found
  }

  writeSubmissionsToFile(filtered)
  return true
}
