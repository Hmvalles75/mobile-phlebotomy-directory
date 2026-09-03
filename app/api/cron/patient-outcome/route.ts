import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOutcomeToken, sendOutcomeRequest } from '@/lib/patientOutcomeRequest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Patient completion confirmation — hourly.
 *
 * GET /api/cron/patient-outcome
 *
 * Asks patients whether the draw a provider claimed actually happened, so the
 * provider's own reporting can be checked against something. See
 * docs/findings/patient-confirmation.md.
 *
 * Security: requires `Authorization: Bearer ${CRON_SECRET}`. GET rather than
 * POST because that is what Vercel Cron issues — app/api/cron/lead-followups
 * is a POST route and has consequently never run once.
 *
 * Gated on PATIENT_OUTCOME_ENABLED. Absent or anything but "true" means the
 * job reports what it *would* do and sends nothing, which is also how the
 * dry run works.
 *
 * `?dry=1` forces that same behaviour with the flag on.
 */

const BATCH_CAP = 200
const FIRST_SEND_AFTER_CLAIM_MS = 48 * 60 * 60 * 1000
const FIRST_SEND_AFTER_APPOINTMENT_MS = 24 * 60 * 60 * 1000
const REMINDER_AFTER_REQUEST_MS = 72 * 60 * 60 * 1000

/**
 * Leads whose lead is over and was never worked. A patient whose request
 * expired or had no coverage was never promised a draw, so asking them how it
 * went is a confusing question about something that did not happen.
 */
const TERMINAL_NEGATIVE = ['EXPIRED_NO_RESPONSE', 'NEEDS_COVERAGE', 'CLOSED_DUPLICATE', 'REFUNDED'] as const

/** Send time: appointment + 24h when one exists, otherwise claim + 48h. */
function dueAt(claimedAt: Date, appointmentDate: Date | null): number {
  // appointmentDate is populated on zero of 784 leads today -- providers can
  // set it through the update-status route and never have. Kept because it is
  // correct if that ever changes, but claim + 48h is the live path.
  if (appointmentDate) return appointmentDate.getTime() + FIRST_SEND_AFTER_APPOINTMENT_MS
  return claimedAt.getTime() + FIRST_SEND_AFTER_CLAIM_MS
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enabled = process.env.PATIENT_OUTCOME_ENABLED === 'true'
    const dry = req.nextUrl.searchParams.get('dry') === '1' || !enabled

    const now = new Date()
    const result = {
      dryRun: dry,
      sent: 0,
      reminded: 0,
      skippedNoEmail: 0,
      errors: [] as string[],
    }

    // ---- first send -------------------------------------------------------
    // Selected in SQL where possible, but the due-time rule branches on a
    // nullable column, so the window is widened here and narrowed in code.
    const firstCandidates = await prisma.lead.findMany({
      where: {
        claimedAt: { not: null, lte: new Date(now.getTime() - FIRST_SEND_AFTER_APPOINTMENT_MS) },
        outcomeRequestSentAt: null,
        status: { notIn: TERMINAL_NEGATIVE as unknown as any },
      },
      select: {
        id: true, fullName: true, email: true,
        claimedAt: true, appointmentDate: true,
      },
      orderBy: { claimedAt: 'asc' },
      take: BATCH_CAP,
    })

    const due = firstCandidates.filter(
      l => l.claimedAt && dueAt(l.claimedAt, l.appointmentDate) <= now.getTime()
    )

    for (const lead of due) {
      if (!lead.email) {
        // Phone-only leads, ~7% of claimed. Counted so the size of the blind
        // spot is visible rather than inferred. SMS is out of scope, and after
        // the A2P rejection it is not an option anyway.
        result.skippedNoEmail++
        continue
      }
      if (dry) { result.sent++; continue }

      const token = generateOutcomeToken()
      const err = await sendOutcomeRequest({
        leadId: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        claimedAt: lead.claimedAt!,
        token,
      })

      if (err) {
        // Timestamp stays null so the next run retries this lead.
        result.errors.push(`${lead.id}: ${err}`.slice(0, 200))
        continue
      }

      await prisma.lead.update({
        where: { id: lead.id },
        data: { patientOutcomeToken: token, outcomeRequestSentAt: new Date() },
      })
      result.sent++
    }

    // ---- reminder ---------------------------------------------------------
    // Exactly one, ever. After this the patient hears nothing further.
    const reminderCandidates = await prisma.lead.findMany({
      where: {
        outcomeRequestSentAt: { not: null, lte: new Date(now.getTime() - REMINDER_AFTER_REQUEST_MS) },
        outcomeReminderSentAt: null,
        patientOutcome: null,
        patientOutcomeToken: { not: null },
        status: { notIn: TERMINAL_NEGATIVE as unknown as any },
      },
      select: { id: true, fullName: true, email: true, claimedAt: true, patientOutcomeToken: true },
      orderBy: { outcomeRequestSentAt: 'asc' },
      take: BATCH_CAP,
    })

    for (const lead of reminderCandidates) {
      if (!lead.email || !lead.claimedAt || !lead.patientOutcomeToken) continue
      if (dry) { result.reminded++; continue }

      const err = await sendOutcomeRequest({
        leadId: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        claimedAt: lead.claimedAt,
        token: lead.patientOutcomeToken, // same token; the first link stays valid
        isReminder: true,
      })

      if (err) {
        result.errors.push(`${lead.id} (reminder): ${err}`.slice(0, 200))
        continue
      }

      await prisma.lead.update({
        where: { id: lead.id },
        data: { outcomeReminderSentAt: new Date() },
      })
      result.reminded++
    }

    console.log(
      `[patient-outcome] dry=${dry} sent=${result.sent} reminded=${result.reminded} ` +
      `skippedNoEmail=${result.skippedNoEmail} errors=${result.errors.length}`
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[patient-outcome] job failed:', error?.message || error)
    return NextResponse.json(
      { error: 'Job failed', detail: String(error?.message || error).slice(0, 300) },
      { status: 500 }
    )
  }
}
