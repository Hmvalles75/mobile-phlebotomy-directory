'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getClientSessionFromCookieStore, logClientAuthEvent } from '@/lib/client-auth'
import { isValidUSPhone, normalizeUSPhone } from '@/lib/phoneValidation'
import { normalizeCity } from '@/lib/normalizeCity'
import { getZipInfo } from '@/lib/zip-geocode'

// Institutional users may legitimately submit a burst, but a runaway
// script/bug shouldn't flood the review queue. Cap per portal user per hour.
const SUBMIT_RATE_LIMIT_PER_HOUR = 25

export interface SubmitState {
  ok: boolean
  error?: string
}

// Field length caps — reject oversized input at the boundary (defense against
// junk / abuse), mirroring the spirit of the lead-intake guards.
const CAP = {
  name: 120,
  contact: 120,
  email: 200,
  address: 200,
  city: 80,
  zip: 10,
  window: 200,
  notes: 2000,
}

function clean(v: FormDataEntryValue | null, cap: number): string {
  return String(v ?? '').trim().slice(0, cap)
}

/**
 * Client-facing order submission. SECURITY-CRITICAL:
 *  - clientId is taken ONLY from the signed session, never from the form.
 *  - No pricing (clientRate/providerRate) or provider assignment is accepted
 *    or set from client input. clientRate is a required column, so we set it
 *    to 0 server-side; admin sets the real rate during review.
 *  - Orders land in PENDING_REVIEW — they do NOT enter the kit workflow until
 *    an admin reviews them.
 *  - The response never contains the order object — only { ok, error? }; on
 *    success we redirect to a confirmation carrying just the public tracking
 *    token.
 *  - Validation error messages never reference pricing, providers, or any
 *    other client's data.
 */
export async function submitClientOrder(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const session = await getClientSessionFromCookieStore()
  if (!session) {
    // Session missing/expired — bounce to login, preserving the destination.
    redirect('/orders/login?next=/orders/submit')
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || null
  const userAgent = h.get('user-agent')

  // Honeypot — a real user never fills the hidden "company" field. Bots do.
  // Silently succeed (don't tell the bot it was caught, don't create a row).
  if (String(formData.get('company') || '').trim() !== '') {
    redirect('/orders/submit?ok=1')
  }

  // Rate limit per portal user (in addition to the honeypot).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recent = await prisma.institutionalOrder.count({
    where: { submittedByClientUserId: session.clientUserId, createdAt: { gte: oneHourAgo } },
  })
  if (recent >= SUBMIT_RATE_LIMIT_PER_HOUR) {
    return { ok: false, error: 'You’ve submitted several orders in a short time. Please wait a bit, or email hector@mobilephlebotomy.org if you need to submit a batch.' }
  }

  // ── Collect + validate. Never trust clientId/pricing/provider from the form.
  const patientName = clean(formData.get('patientName'), CAP.name)
  const patientContactName = clean(formData.get('patientContactName'), CAP.contact) || null
  const patientPhoneRaw = clean(formData.get('patientPhone'), 40)
  const patientEmail = clean(formData.get('patientEmail'), CAP.email) || null
  const patientAddress = clean(formData.get('patientAddress'), CAP.address)
  const patientCityRaw = clean(formData.get('patientCity'), CAP.city)
  const patientState = clean(formData.get('patientState'), 2).toUpperCase()
  const patientZip = clean(formData.get('patientZip'), CAP.zip)
  const requestedWindow = clean(formData.get('requestedWindow'), CAP.window) || null
  const patientNotes = clean(formData.get('patientNotes'), CAP.notes) || null

  if (patientName.length < 2) return { ok: false, error: 'Please enter the patient’s name.' }
  if (!patientAddress) return { ok: false, error: 'Please enter the patient’s street address.' }
  if (!patientCityRaw) return { ok: false, error: 'Please enter the patient’s city.' }
  if (patientState.length !== 2) return { ok: false, error: 'Please enter the 2-letter state.' }
  if (patientZip.length < 5) return { ok: false, error: 'Please enter a valid ZIP code.' }
  if (patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
    return { ok: false, error: 'The patient email doesn’t look valid. Leave it blank if you don’t have one.' }
  }

  if (!isValidUSPhone(patientPhoneRaw)) {
    return { ok: false, error: 'Please enter a valid 10-digit US phone number for the patient.' }
  }
  const patientPhone = normalizeUSPhone(patientPhoneRaw)

  // Reject obvious fake/placeholder 555-exchange numbers (mirrors lead intake).
  const phoneDigits = patientPhone.replace(/\D/g, '').slice(-10)
  if (phoneDigits.slice(3, 6) === '555') {
    return { ok: false, error: 'Please enter a phone number where the patient can be reached — that number doesn’t appear to be a working line.' }
  }

  // ZIP <-> state consistency — a mismatch mis-routes downstream. Reject clear
  // conflicts; unresolvable ZIPs are allowed through (admin will catch during review).
  const zipInfo = getZipInfo(patientZip)
  if (zipInfo?.state && zipInfo.state.toUpperCase() !== patientState) {
    return { ok: false, error: `The ZIP code ${patientZip} is in ${zipInfo.state}${zipInfo.city ? ` (${zipInfo.city})` : ''}, but you selected ${patientState}. Please double-check the ZIP and state.` }
  }

  const patientCity = normalizeCity(patientCityRaw)

  // Create the order. clientId from session ONLY. Status PENDING_REVIEW keeps
  // it out of the kit workflow. clientRate=0 placeholder (required column) —
  // admin sets the real rate on review. No provider assignment.
  const order = await prisma.institutionalOrder.create({
    data: {
      clientId: session.clientId,
      patientName,
      patientContactName,
      patientPhone,
      patientEmail,
      patientAddress,
      patientCity,
      patientState,
      patientZip,
      requestedWindow,
      patientNotes,
      status: 'PENDING_REVIEW',
      clientRate: '0',
      submittedByClientUserId: session.clientUserId,
      submittedFromIp: ip,
    },
    select: { publicShareToken: true }, // never read back the full object
  })

  await logClientAuthEvent('order_submitted', {
    clientUserId: session.clientUserId,
    email: session.email,
    ip,
    userAgent,
  })

  // Response carries only the public tracking token — never the order object.
  redirect(`/orders/submit?ok=1&ref=${encodeURIComponent(order.publicShareToken)}`)
}
