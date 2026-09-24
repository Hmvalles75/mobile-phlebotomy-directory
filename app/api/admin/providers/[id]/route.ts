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

    // Only allow updating specific fields. Coverage fields added 2026-09-18 so
    // carve-outs, ZIP lists and radius can be set from the admin panel instead
    // of a script; writes go through the change-log trigger as 'admin'.
    const allowedFields = ['eligibleForLeads', 'zipCodes', 'serviceRadiusMiles', 'excludedZipCodes', 'excludedStates', 'tagline']
    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }
    if ('serviceRadiusMiles' in updateData) {
      const r = Number(updateData.serviceRadiusMiles)
      if (!Number.isInteger(r) || r < 1 || r > 200) return NextResponse.json({ ok: false, error: 'serviceRadiusMiles must be 1-200' }, { status: 400 })
      updateData.serviceRadiusMiles = r
    }
    for (const f of ['zipCodes', 'excludedZipCodes'] as const) {
      if (f in updateData) {
        const tokens = String(updateData[f] ?? '').split(/[,\n;]+/).map(t => t.trim()).filter(Boolean)
        // The include list needs the star on a prefix ("112*"); bare 3-4 digit
        // fragments there are typos or phone numbers. Exclusions accept either.
        const grammar = f === 'zipCodes'
          ? /^(\d{5}(-\d{4})?|\d{3,4}\*|\d{5}\s*-\s*\d{5})$/
          : /^(\d{5}(-\d{4})?|\d{3,4}\*?|\d{5}\s*-\s*\d{5})$/
        const bad = tokens.find(t => !grammar.test(t))
        if (bad) return NextResponse.json({ ok: false, error: `${f}: "${bad}" is not a ZIP, a prefix like 112*, or a range like 10000-10499` }, { status: 400 })
        updateData[f] = tokens.length ? tokens.join(', ') : null
      }
    }
    if ('excludedStates' in updateData) {
      const tokens = String(updateData.excludedStates ?? '').split(/[,\s;]+/).map(t => t.trim().toUpperCase()).filter(Boolean)
      const bad = tokens.find(t => !/^[A-Z]{2}$/.test(t))
      if (bad) return NextResponse.json({ ok: false, error: `excludedStates: "${bad}" is not a two-letter state code` }, { status: 400 })
      updateData.excludedStates = tokens.length ? tokens.join(',') : null
    }
    if ('tagline' in updateData) {
      const t = String(updateData.tagline ?? '').replace(/\s+/g, ' ').trim()
      if (t.length > 160) return NextResponse.json({ ok: false, error: 'tagline must be 160 characters or fewer' }, { status: 400 })
      updateData.tagline = t || null
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
        eligibleForLeads: true,
        zipCodes: true,
        serviceRadiusMiles: true,
        excludedZipCodes: true,
        excludedStates: true,
        tagline: true,
      }
    })

    console.log(`[Admin] Updated provider ${provider.slug}: ${Object.keys(updateData).join(', ')}`)

    // A provider switched on now covers whatever is already sitting OPEN in
    // their radius. Scoped to leads they were never sent, so re-saving an
    // already-eligible provider is a no-op. See lib/leadRematch.ts.
    if ('eligibleForLeads' in body && provider.eligibleForLeads) {
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
