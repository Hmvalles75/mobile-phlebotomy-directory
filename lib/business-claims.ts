import { prisma } from './prisma'

export interface BusinessClaim {
  id: string
  createdAt: Date
  status: 'PENDING' | 'REGISTERED' | 'REJECTED'
  providerId: string
  providerName: string
  claimantName: string
  claimantEmail: string
  claimantPhone: string
  requestedUpdates: string
  isOwnerConfirmed: boolean
  verifiedAt?: Date | null
  verificationMethod?: string | null
  verificationNotes?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function getAllClaims(): Promise<BusinessClaim[]> {
  return prisma.businessClaim.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function addBusinessClaim(claim: {
  providerId: string
  providerName: string
  claimantName: string
  claimantEmail: string
  claimantPhone: string
  requestedUpdates: string
  isOwnerConfirmed: boolean
  ipAddress?: string
  userAgent?: string
}): Promise<BusinessClaim> {
  return prisma.businessClaim.create({
    data: claim
  })
}

export async function updateClaimStatus(
  id: string,
  status: 'PENDING' | 'REGISTERED' | 'REJECTED',
  verificationData?: {
    verificationMethod?: string
    verificationNotes?: string
  }
): Promise<boolean> {
  try {
    await prisma.businessClaim.update({
      where: { id },
      data: {
        status,
        ...(status === 'REGISTERED' ? {
          verifiedAt: new Date(),
          verificationMethod: verificationData?.verificationMethod,
          verificationNotes: verificationData?.verificationNotes,
        } : {})
      }
    })
    return true
  } catch {
    return false
  }
}

export async function getClaimById(id: string): Promise<BusinessClaim | null> {
  return prisma.businessClaim.findUnique({ where: { id } })
}

export async function getClaimsByProviderId(providerId: string): Promise<BusinessClaim[]> {
  return prisma.businessClaim.findMany({ where: { providerId } })
}

export async function isProviderRegistered(providerId: string): Promise<boolean> {
  const count = await prisma.businessClaim.count({
    where: { providerId, status: 'REGISTERED' }
  })
  return count > 0
}

export async function deleteClaim(id: string): Promise<boolean> {
  try {
    await prisma.businessClaim.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}
