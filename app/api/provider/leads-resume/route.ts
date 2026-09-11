import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { resumeLeads } from '@/lib/dormantProviders'
import { rematchForProviderAfterChange } from '@/lib/leadRematch'
import { runAsActor } from '@/lib/providerAudit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Provider turns lead routing back on after a dormant warning or pause.
 * Clears the stamps, starts the resume grace period, and hands them anything
 * already OPEN in their radius. See lib/dormantProviders.ts.
 */
async function __POST(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }
  try {
    const r = await resumeLeads(session.providerId, 'provider')
    await rematchForProviderAfterChange(session.providerId, 'leads_resumed')
    return NextResponse.json({ ok: true, ...r })
  } catch (err: any) {
    console.error('[leads-resume] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Failed to resume leads' }, { status: 500 })
  }
}

// Provider writes inside these handlers are attributed in provider_change_log. See lib/providerAudit.ts.
export const POST = (...args: Parameters<typeof __POST>) => runAsActor('provider', 'provider/leads-resume', () => __POST(...args))
