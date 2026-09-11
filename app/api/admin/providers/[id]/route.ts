import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { rematchForProviderAfterChange } from '@/lib/leadRematch'
import { resumeLeads } from '@/lib/dormantProviders'
import { runAsActor } from '@/lib/providerAudit'

async function __PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie')
    const isAuthenticated = verifyAdminSessionFromCookies(authHeader || cookieHeader)

    if (!isAuthenticated) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()

    // Only allow updating specific fields
    const allowedFields = ['eligibleForLeads']
    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const provider = await prisma.provider.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        eligibleForLeads: true
      }
    })

    console.log(`[Admin] Updated provider ${provider.slug}: eligibleForLeads=${provider.eligibleForLeads}`)

    // A provider switched on now covers whatever is already sitting OPEN in
    // their radius. Scoped to leads they were never sent, so re-saving an
    // already-eligible provider is a no-op. See lib/leadRematch.ts.
    if (provider.eligibleForLeads) {
      // Counts as a resume: clears any dormant warning/pause and starts the
      // grace period, so the sweep does not re-pause someone admin just re-enabled.
      await resumeLeads(provider.id, 'admin')
      await rematchForProviderAfterChange(provider.id, 'admin_eligible_on')
    }

    return NextResponse.json({
      ok: true,
      provider
    })

  } catch (error: any) {
    console.error('[Admin Providers] Update error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update provider' },
      { status: 500 }
    )
  }
}

// Provider writes inside these handlers are attributed in provider_change_log. See lib/providerAudit.ts.
export const PATCH = (...args: Parameters<typeof __PATCH>) => runAsActor('admin', 'admin/providers/[id]', () => __PATCH(...args))
