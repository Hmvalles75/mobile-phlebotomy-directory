/**
 * Manage pending provider submissions using Prisma
 */

import { prisma } from '@/lib/prisma'
import { SubmissionStatus } from '@prisma/client'

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

/**
 * Get all pending submissions
 */
export async function getPendingSubmissions(): Promise<PendingProvider[]> {
  try {
    const submissions = await prisma.pendingSubmission.findMany({
      orderBy: {
        submittedAt: 'desc'
      }
    })

    return submissions.map(sub => ({
      id: sub.id,
      submittedAt: sub.submittedAt.toISOString(),
      status: sub.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
      businessName: sub.businessName,
      contactName: sub.contactName,
      email: sub.email,
      phone: sub.phone,
      website: sub.website || undefined,
      services: undefined, // Not stored in new schema
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
    console.error('Error reading pending submissions:', error)
    return []
  }
}

/**
 * Add a new pending submission
 */
export async function addPendingSubmission(
  submission: Omit<PendingProvider, 'id' | 'submittedAt' | 'status'>
): Promise<PendingProvider> {
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
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<boolean> {
  try {
    const statusMap: Record<string, SubmissionStatus> = {
      pending: 'PENDING',
      approved: 'APPROVED',
      rejected: 'REJECTED'
    }

    await prisma.pendingSubmission.update({
      where: { id },
      data: { status: statusMap[status] }
    })

    return true
  } catch (error) {
    console.error('Error updating submission status:', error)
    return false
  }
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(id: string): Promise<PendingProvider | null> {
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
    console.error('Error getting submission:', error)
    return null
  }
}

/**
 * Delete a submission
 */
export async function deleteSubmission(id: string): Promise<boolean> {
  try {
    await prisma.pendingSubmission.delete({
      where: { id }
    })
    return true
  } catch (error) {
    console.error('Error deleting submission:', error)
    return false
  }
}
