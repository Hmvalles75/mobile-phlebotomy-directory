/**
 * Stale Lead Cleanup Cron
 *
 * POST /api/cron/expire-stale-leads
 *
 * Closes OPEN leads older than 14 days. Those patients most likely got
 * service elsewhere long ago; keeping them OPEN clutters provider
 * dashboards and misleads admins about current demand.
 *
 * Runs daily at 6am Pacific (13:00 UTC).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const STALE_DAYS = 14

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)

    // Find stale OPEN leads (for logging)
    const staleLeads = await prisma.lead.findMany({
      where: {
        status: 'OPEN',
        createdAt: { lt: cutoff },
      },
      select: { id: true, city: true, state: true, zip: true, createdAt: true }
    })

    if (staleLeads.length === 0) {
      console.log('[ExpireStaleLeads] No stale leads found')
      return NextResponse.json({
        ok: true,
        closed: 0,
        message: 'No stale leads to close',
      })
    }

    console.log(`[ExpireStaleLeads] Closing ${staleLeads.length} stale OPEN leads (older than ${STALE_DAYS} days):`)
    for (const l of staleLeads) {
      const ageDays = Math.floor((Date.now() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      console.log(`  ${l.id} | ${l.city}, ${l.state} ${l.zip} | ${ageDays} days old`)
    }

    // Close them all
    const result = await prisma.lead.updateMany({
      where: {
        status: 'OPEN',
        createdAt: { lt: cutoff },
      },
      data: {
        status: 'CLOSED_UNCONFIRMED',
        outcomeNotes: `Auto-closed after ${STALE_DAYS} days with no provider claim.`,
      }
    })

    console.log(`[ExpireStaleLeads] ✅ Closed ${result.count} stale leads`)

    return NextResponse.json({
      ok: true,
      closed: result.count,
      staleDays: STALE_DAYS,
      cutoff: cutoff.toISOString(),
    })

  } catch (error: any) {
    console.error('[ExpireStaleLeads] Error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Cleanup failed' },
      { status: 500 }
    )
  }
}
