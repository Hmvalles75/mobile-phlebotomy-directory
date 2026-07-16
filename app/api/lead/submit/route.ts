import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { priceFor } from '@/lib/leadPricing'
import { notifyAdminUnservedLead, reachOutToNearbyProviders, sendExpansionEmailToLead } from '@/lib/notifyProvider'
import { sendSMSBlastToEligibleProviders } from '@/lib/smsBlast'
import { notifyFeaturedProvidersForLead } from '@/lib/leadNotifications'
import { normalizeCity } from '@/lib/normalizeCity'
import { notifyHighValueLead } from '@/lib/notifyHighValueLead'
import { isValidUSPhone, normalizeUSPhone, PHONE_VALIDATION_MESSAGE } from '@/lib/phoneValidation'
import { getZipInfo } from '@/lib/zip-geocode'

// Updated draw-count buckets (2026-04-22): 1-3 standard, 4-19 medium, 20+ high.
// Also keep backward-compat for the older bucket values submitted by the LeadFormModal /
// ZipCodeLeadForm / InlineLeadForm paths until those are updated.
// Intake abuse guards (P0 #4). Rate limit mirrors the corporate route.
const LEAD_RATE_LIMIT_PER_HOUR = 5
// Same phone + name within this window is treated as a duplicate re-submission.
const DUPLICATE_WINDOW_HOURS = 6

const DRAW_COUNTS = ['1-3', '4-19', '20+', '1', '2-5', '6-20'] as const
const REQUEST_TYPES = ['individual', 'organization', 'business'] as const
const DOCTOR_ORDER = ['yes', 'no', 'need_help'] as const
const PAYMENT_METHOD = ['insurance', 'out_of_pocket', 'not_sure'] as const
type DrawCount = typeof DRAW_COUNTS[number]
type RequestType = typeof REQUEST_TYPES[number]

// US phone validation + normalization. The old `min(7)` rule let malformed
// numbers through — e.g. Jenn Gallo's 8-digit "63147634" (2026-05) created a
// lead a provider could never actually call. We now require a real 10-digit
// US number (optionally with a leading 1), strip formatting, and store a
// consistent (XXX) XXX-XXXX shape. Bad numbers are rejected at the boundary
// instead of becoming a dead claimed lead + a WRONG_NUMBER/INVALID_CONTACT_INFO
// outcome downstream.
const phoneSchema = z.string()
  .min(1, 'Phone number is required')
  .refine(isValidUSPhone, PHONE_VALIDATION_MESSAGE)
  .transform(normalizeUSPhone)

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  address1: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().min(5, 'ZIP code must be at least 5 characters'),
  labPreference: z.string().min(1, 'Lab preference is required'),
  urgency: z.enum(['STANDARD', 'STAT']),
  notes: z.string().optional(),
  source: z.string().optional(),
  preferredProviderId: z.string().optional(),
  // Lead-screening capture (all optional so legacy form paths keep working)
  drawCount: z.enum(DRAW_COUNTS).optional(),
  requestType: z.enum(REQUEST_TYPES).optional(),
  hasDoctorOrder: z.enum(DOCTOR_ORDER).optional(),
  paymentMethod: z.enum(PAYMENT_METHOD).optional(),
  organizationName: z.string().optional(),
  timeframe: z.string().optional(),
  // Attribution (2026-04-22) — where the patient came from
  attribution: z.object({
    attributionSource: z.string().optional(),
    utmSource: z.string().nullable().optional(),
    utmMedium: z.string().nullable().optional(),
    utmCampaign: z.string().nullable().optional(),
    referrer: z.string().nullable().optional(),
    landingPage: z.string().nullable().optional(),
  }).optional(),
})

/**
 * B2B / research-study keyword patterns. When ANY of these match the
 * notes field, the lead is flagged isHighValue regardless of what the
 * user selected for drawCount/requestType in the form.
 *
 * Why: the form's discrete choices ("individual" + "1-3") miss B2B
 * patterns where one contact represents an organization with multiple
 * clients/employees/study participants. Marah Doria from NeuroAge
 * Therapeutics submitted via the form on 2026-04-30 with notes that
 * clearly described a multi-state research study, but selected
 * individual+1-3 — the lead routed to a paramedical exam provider for $0
 * before anyone realized it was a high-value B2B opportunity. This
 * classifier closes that gap.
 *
 * Patterns are intentionally narrow — single-keyword matches like
 * "company" or "study" alone would over-trigger on patient requests
 * (e.g. "my company's insurance" or "the study my doctor ordered").
 * Each pattern below must read as B2B/research in nearly all contexts.
 */
const B2B_NOTE_PATTERNS: ReadonlyArray<RegExp> = [
  /\bbiotech\b/i,
  /\bpharmaceutical\b/i,
  /\bpharma\s+(company|corp|inc|llc)\b/i,
  /\bresearch\s+study\b/i,
  /\bresearch\s+studies\b/i,
  /\bclinical\s+trial/i,
  /\bclinical\s+research\b/i,
  // "clinical study" / "clinical studies" — added 2026-05-14 after Michael
  // McKee's U-Mich research-coordinator lead leaked through to free providers
  // and sat unclaimed for 24 days. The old patterns only matched "research
  // study" (not "clinical study") and "clinical trial" (not "clinical study").
  /\bclinical\s+stud(y|ies)\b/i,
  // Research-vocabulary tells — IRB and study coordinator are research-only
  // language, never used by individual patients. Pattern "study participants"
  // and "research participants" catch B2B phrasing that doesn't include a
  // top-level signal word like "clinical" or "research study".
  /\bstudy\s+participants\b/i,
  /\bresearch\s+participants\b/i,
  /\bstudy\s+coordinator\b/i,
  /\b(IRB|institutional\s+review\s+board)\b/i,
  /\bdrug\s+discovery\b/i,
  /\bdrug\s+development\b/i,
  /\bbiometric\s+screening\b/i,
  /\bwellness\s+program\b/i,
  /\bhealth\s+fair\b/i,
  /\bcorporate\s+event\b/i,
  /\bon\s+behalf\s+of\b/i,           // strong signal — "I'm reaching out on behalf of X"
  /\bour\s+(clients|employees|team|staff|patients|participants)\b/i,
  /\b(employees|participants)\s+(in|across|at)\b/i,
]

function notesMatchB2B(notes: string | null | undefined): boolean {
  if (!notes) return false
  return B2B_NOTE_PATTERNS.some(re => re.test(notes))
}

/**
 * Classifies a lead from the submitted drawCount + requestType + notes.
 * Returns the derived fields to persist on the lead row.
 *
 * - isHighValue: true when drawCount == "20+" OR requestType is
 *   organization/business OR notes contain B2B/research keywords.
 * - estimatedValueCents: draws × $75 using the low/mid of each bucket:
 *     "1-3"   → $0       (standard individual, not a value lead)
 *     "4-19"  → $825     (midpoint 11 × $75)
 *     "20+"   → $1,500   (conservative low 20 × $75)
 *   Legacy buckets ("2-5", "6-20", "1") are mapped to the closest new bucket.
 *   When the notes-scanner triggers high-value but drawCount=1-3, we use
 *   $825 as a placeholder so the admin email shows it deserves attention.
 */
function classifyLead(
  drawCount: DrawCount | undefined,
  requestType: RequestType | undefined,
  notes: string | null | undefined
) {
  const rawDc = drawCount || '1-3'
  // Legacy bucket normalization — map old values to new buckets
  const dc: '1-3' | '4-19' | '20+' =
    rawDc === '20+' ? '20+' :
    rawDc === '6-20' ? '20+' :             // old "6-20" -> treat as 20+ for classification
    rawDc === '4-19' ? '4-19' :
    rawDc === '2-5' ? '4-19' :             // old "2-5" -> treat as medium
    rawDc === '1-3' ? '1-3' :
    '1-3'                                  // old "1" -> standard

  const rt = requestType || 'individual'
  const isOrganization = rt === 'organization' || rt === 'business'
  const notesB2B = notesMatchB2B(notes)
  const isHighValue = dc === '20+' || isOrganization || notesB2B
  const estimatedValueCents =
    dc === '20+' ? 150000 :                // 20 × $75 = $1,500 conservative low
    dc === '4-19' ? 82500 :                // 11 × $75 = $825 midpoint
    notesB2B ? 82500 :                     // B2B-flagged via notes — placeholder pending admin review
    0

  return { drawCount: dc, requestType: rt, isHighValue, estimatedValueCents, notesB2B }
}

/**
 * Reject lead submissions where the patient phone matches a known provider's
 * own phone. Catches both (a) provider self-submitting their own form to "test"
 * and (b) spam/garbage submissions where the only contact info is scraped from
 * the displayed provider profile. Without this guard, every other notified
 * provider in the area calls the bad number and reaches another phlebotomist
 * (the source provider), which has happened in production — see Khadine lead
 * cmoujjpd00001l70417slw3jp on 2026-05-06.
 */
async function patientPhoneMatchesProvider(rawPhone: string): Promise<{ id: string; name: string } | null> {
  const digits = rawPhone.replace(/\D/g, '').slice(-10)
  if (digits.length !== 10) return null
  // Compare against the last 10 digits of provider phone fields.
  // Match on raw containment of the digit string OR the formatted variants
  // we commonly see in the DB.
  const last10 = digits
  const formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  const dashed = `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`
  const match = await prisma.provider.findFirst({
    where: {
      OR: [
        { phone: { contains: last10 } },
        { phonePublic: { contains: last10 } },
        { phone: formatted },
        { phonePublic: formatted },
        { phone: dashed },
        { phonePublic: dashed },
      ],
    },
    select: { id: true, name: true },
  })
  return match
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = schema.parse(body)

    // Reject self-submissions / scraped-provider-phone spam early.
    // The form may genuinely fail for the rare patient who happens to share a
    // number with a provider in our DB — they should email us. The cost of
    // routing fake leads to the network is much higher.
    const conflict = await patientPhoneMatchesProvider(payload.phone)
    if (conflict) {
      console.warn(`[lead/submit] Rejected — patient phone ${payload.phone} matches provider ${conflict.name} (${conflict.id})`)
      return NextResponse.json(
        {
          ok: false,
          error: 'PHONE_MATCHES_PROVIDER',
          message: 'The phone number you entered is registered to a service provider on our directory. Please enter the patient\'s own phone number, or email hector@mobilephlebotomy.org if you need help.',
        },
        { status: 400 }
      )
    }

    // ZIP <-> state consistency check. Provider routing keys on the ZIP's
    // physical location, so a ZIP that doesn't match the submitted state
    // silently mis-routes the lead — e.g. a Honolulu patient who typed NJ ZIP
    // 08550 got routed to New Jersey providers; "Groton, NE" carried the CT ZIP
    // 06340. We reject clear mismatches so the patient corrects it at the source
    // instead of wasting provider time on an unreachable lead. Unresolvable ZIPs
    // are allowed through: they simply match no providers and land in
    // NEEDS_COVERAGE, which is a non-harmful outcome (no mis-route).
    const zipInfo = getZipInfo(payload.zip)
    if (zipInfo?.state && zipInfo.state.toUpperCase() !== payload.state.toUpperCase()) {
      console.warn(`[lead/submit] Rejected ZIP_STATE_MISMATCH — ZIP ${payload.zip} is in ${zipInfo.state} but state=${payload.state} submitted (city="${payload.city}", name="${payload.fullName}")`)
      return NextResponse.json(
        {
          ok: false,
          error: 'ZIP_STATE_MISMATCH',
          message: `The ZIP code ${payload.zip} is in ${zipInfo.state}${zipInfo.city ? ` (${zipInfo.city})` : ''}, but you selected ${payload.state.toUpperCase()}. Please double-check your ZIP code and state so we can match you with a nearby phlebotomist.`,
        },
        { status: 400 }
      )
    }

    // Reject obvious fake / placeholder phone numbers. The 555 exchange
    // (e.g. 555-1212 directory assistance, the 555-01xx fictional range) passes
    // format validation but is never a real patient line — one slipped through
    // as a junk lead 2026-07-15. Extend this list as other fake patterns appear.
    const phoneDigits = payload.phone.replace(/\D/g, '').slice(-10)
    if (phoneDigits.length === 10 && phoneDigits.slice(3, 6) === '555') {
      console.warn(`[lead/submit] Rejected fake phone ${payload.phone} (555 exchange)`)
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_PHONE',
          message: 'Please enter a phone number where we can reach you — the number provided doesn\'t appear to be a working line.',
        },
        { status: 400 }
      )
    }

    // Rate-limit by IP — mirrors the corporate-request route. Sheds bots /
    // form-hammering before we do any DB writes or provider blasts.
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      null
    if (ipAddress) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentFromIp = await prisma.lead.count({
        where: { ipAddress, createdAt: { gte: oneHourAgo } },
      })
      if (recentFromIp >= LEAD_RATE_LIMIT_PER_HOUR) {
        console.warn(`[lead/submit] Rate limit hit for IP ${ipAddress} (${recentFromIp} in last hour)`)
        return NextResponse.json(
          {
            ok: false,
            error: 'RATE_LIMITED',
            message: 'We\'ve received several requests from your connection recently. If you still need help, please email hector@mobilephlebotomy.org directly.',
          },
          { status: 429 }
        )
      }
    }

    // Duplicate suppression — the same patient (phone + name) re-submitting
    // within the window created up to 12 duplicate leads AND 12 provider blasts
    // in production (Geraldine Wong 2026-06-09/10). Matching phone AND name
    // (not phone alone) still lets a caregiver submit for different people from
    // one phone. On a duplicate we return success (their request IS on file)
    // without creating another lead or re-notifying providers.
    const dupWindow = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000)
    // Match on phone OR email (each paired with name) so a patient who corrects
    // their phone and re-submits is still caught — Stefan A Smith 2026-07-15
    // submitted a junk 555 number then his real number 2 min later (same name +
    // email). Phone-only dedup missed it; email+name catches it.
    const identityMatch: Array<Record<string, unknown>> = [{ phone: payload.phone }]
    if (payload.email) {
      identityMatch.push({ email: { equals: payload.email, mode: 'insensitive' } })
    }
    const existingDup = await prisma.lead.findFirst({
      where: {
        fullName: { equals: payload.fullName, mode: 'insensitive' },
        createdAt: { gte: dupWindow },
        OR: identityMatch,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    })
    if (existingDup) {
      console.warn(`[lead/submit] Duplicate suppressed — ${payload.phone} / "${payload.fullName}" already submitted ${existingDup.id} within ${DUPLICATE_WINDOW_HOURS}h`)
      return NextResponse.json({ ok: true, duplicate: true, leadId: existingDup.id })
    }

    const priceCents = priceFor(payload.urgency)
    // Normalize city at write time so analytics + routing see consistent values
    const city = normalizeCity(payload.city)
    const { drawCount, requestType, isHighValue, estimatedValueCents, notesB2B } =
      classifyLead(payload.drawCount, payload.requestType, payload.notes)

    // Create the lead with OPEN status for Race to Claim
    const lead = await prisma.lead.create({
      data: {
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email || null,
        address1: payload.address1,
        city,
        state: payload.state,
        zip: payload.zip,
        labPreference: payload.labPreference,
        urgency: payload.urgency,
        notes: payload.notes,
        source: payload.source || 'web_form',
        preferredProviderId: payload.preferredProviderId || null,
        priceCents,
        status: 'OPEN',  // Ready for claiming
        drawCount,
        requestType,
        isHighValue,
        estimatedValueCents,
        organizationName: payload.organizationName || null,
        timeframe: payload.timeframe || null,
        hasDoctorOrder: payload.hasDoctorOrder || null,
        paymentMethod: payload.paymentMethod || null,
        // Attribution — tells us which page this lead originated from
        attributionSource: payload.attribution?.attributionSource || null,
        utmSource: payload.attribution?.utmSource || null,
        utmMedium: payload.attribution?.utmMedium || null,
        utmCampaign: payload.attribution?.utmCampaign || null,
        referrer: payload.attribution?.referrer || null,
        landingPage: payload.attribution?.landingPage || null,
        ipAddress,
      }
    })

    console.log(`✅ Lead created: ${lead.id} - ${lead.city}, ${lead.state} ${lead.zip}${isHighValue ? ' [HIGH VALUE]' : ''}${notesB2B ? ' [B2B-from-notes]' : ''}`)

    // High-value leads — immediate admin notification so group/org requests get
    // hands-on follow-up regardless of normal routing outcomes. Fire-and-forget;
    // don't block the patient response on this email delivering.
    if (isHighValue) {
      notifyHighValueLead({
        id: lead.id,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        urgency: lead.urgency,
        notes: lead.notes,
        drawCount: lead.drawCount,
        requestType: lead.requestType,
        organizationName: lead.organizationName,
        timeframe: lead.timeframe,
        estimatedValueCents: lead.estimatedValueCents,
        hasDoctorOrder: lead.hasDoctorOrder,
        paymentMethod: lead.paymentMethod,
      }).catch(err => console.error(`[Lead ${lead.id}] ❌ High-value admin email FAILED:`, err.message || err))
    }

    // Send notifications synchronously to ensure they complete before function terminates
    // This adds ~1-3 seconds to response time but guarantees delivery
    let emailCount = 0
    let smsCount = 0

    try {
      // Send email notifications to featured providers (Phase 1)
      emailCount = await notifyFeaturedProvidersForLead(lead.id)
      console.log(`[Lead ${lead.id}] ✅ Featured provider email: ${emailCount} sent`)
    } catch (err: any) {
      console.error(`[Lead ${lead.id}] ❌ Featured provider email FAILED:`, err.message || err)
    }

    try {
      // Send SMS blast to all eligible providers in the area (Race to Claim)
      smsCount = await sendSMSBlastToEligibleProviders({
        id: lead.id,
        zip: payload.zip,
        urgency: payload.urgency,
        city,
        state: payload.state
      })
      console.log(`[Lead ${lead.id}] ✅ SMS blast: ${smsCount} sent`)
    } catch (err: any) {
      console.error(`[Lead ${lead.id}] ❌ SMS blast FAILED:`, err.message || err)
    }

    // If NO providers were notified at all, this is an uncovered area
    // Send expansion email to the lead and notify admin
    if (emailCount === 0 && smsCount === 0) {
      console.log(`[Lead ${lead.id}] No coverage in ${city}, ${payload.state} - sending expansion email`)

      // Send expansion email to the lead
      await sendExpansionEmailToLead({
        id: lead.id,
        fullName: payload.fullName,
        email: payload.email,
        city,
        state: payload.state
      }).catch(console.error)

      // Still notify admin about unserved lead
      await notifyAdminUnservedLead(lead).catch(console.error)
    }

    // Return success
    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      status: 'open',
      message: 'Lead created and notifications sent to providers'
    })
  } catch (e: any) {
    console.error('Lead submission error:', e)

    if (e instanceof z.ZodError) {
      // Surface the first field-level message as `error` so client forms that
      // display data.error show something actionable ("Enter a valid 10-digit
      // US phone number") instead of a generic "Validation error".
      const firstMessage = e.errors[0]?.message || 'Validation error'
      return NextResponse.json(
        { ok: false, error: firstMessage, details: e.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ok: false, error: e.message || 'Failed to submit lead' },
      { status: 400 }
    )
  }
}
