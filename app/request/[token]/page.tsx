import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CancelRequestButton from './CancelRequestButton'
import NoAnswerButton from './NoAnswerButton'
import { rerouteEligibility } from '@/lib/patientReroute'
import { stateUtcOffsetHours } from '@/lib/notificationTiming'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your blood draw request',
  robots: { index: false, follow: false },
}

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/
const BOOKED = new Set(['APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED'])

/**
 * The requester's own view of a consumer request (2026-09-29): a five-step
 * timeline read off columns that already existed, plus cancel. Reached only
 * by the token in the confirmation email and the success screen.
 *
 * Institutional / B2B leads never get a token (see /api/lead/submit), and the
 * page refuses them anyway: provider identity on those runs through Hector.
 */
export default async function RequestStatusPage({ params }: { params: { token: string } }) {
  if (!TOKEN_RE.test(params.token)) notFound()
  const lead = await prisma.lead.findFirst({
    where: { patientToken: params.token },
    select: {
      id: true, status: true, outcome: true, fullName: true, city: true, state: true, urgency: true,
      createdAt: true, routedAt: true, claimedAt: true, appointmentDate: true, outcomeUpdatedAt: true, patientCancelledAt: true,
      routedToId: true, patientRerouteCount: true, patientRerouteAt: true, waitlistedAt: true,
      isHighValue: true,
      provider: { select: { name: true, phonePublic: true, phone: true } },
      leadNotifications: { where: { status: { in: ['SENT', 'QUEUED'] } }, select: { createdAt: true }, orderBy: { createdAt: 'asc' }, take: 1 },
      _count: { select: { leadNotifications: true } },
    },
  })
  if (!lead || lead.isHighValue || lead.status === 'INSTITUTIONAL_REVIEW') notFound()

  // Every time on this page is shown in the patient's local time (by state,
  // same table as quiet hours). Vercel renders in UTC, so without this the
  // page said "8:12 PM" for a 4:12 PM ET request.
  const off = stateUtcOffsetHours(lead.state, new Date()) ?? 0
  const fmt = (d: Date | null) => d ? new Date(d.getTime() + off * 3600e3).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) : null
  const first = (lead.fullName || '').trim().split(/\s+/)[0]
  const sentAt = lead.leadNotifications[0]?.createdAt || lead.routedAt || null
  const accepted = !!lead.claimedAt && !['OPEN', 'NEEDS_COVERAGE'].includes(lead.status)
  const dateConfirmed = !!lead.appointmentDate || (!!lead.outcome && BOOKED.has(lead.outcome))
  const visited = lead.status === 'COMPLETED' || lead.outcome === 'APPOINTMENT_COMPLETED'
  const cancelled = lead.status === 'CLOSED_PATIENT_CANCELLED'
  const expired = lead.status === 'EXPIRED_NO_RESPONSE'
  const closedOther = ['CLOSED_DECLINED', 'CLOSED_DUPLICATE', 'CLOSED_UNCONFIRMED', 'CLOSED_PRICING_ONLY'].includes(lead.status)
  const live = ['OPEN', 'CLAIMED', 'NEEDS_COVERAGE'].includes(lead.status)
  const providerPhone = lead.provider?.phonePublic || lead.provider?.phone || null
  const providerName = lead.provider?.name?.trim() || 'the provider'
  // "I haven't heard from them": shown once the claim is old enough (lib/patientReroute.ts).
  const reroute = accepted && !dateConfirmed && !visited ? rerouteEligibility(lead) : null

  const steps: { title: string; detail: string; done: boolean; when?: string | null }[] = [
    { title: 'Request received', done: true, when: fmt(lead.createdAt), detail: `Mobile blood draw in ${lead.city}, ${lead.state}${lead.urgency === 'STAT' ? ' · marked urgent' : ''}.` },
    {
      title: 'Sent to providers', done: lead._count.leadNotifications > 0, when: fmt(sentAt),
      detail: lead._count.leadNotifications > 0
        ? `Your request went to ${lead._count.leadNotifications} independent provider${lead._count.leadNotifications === 1 ? '' : 's'} covering your area. The first one to accept it gets your details.`
        : lead.status === 'NEEDS_COVERAGE'
          ? (lead.waitlistedAt
            ? `We don't have a provider covering your area yet. You're on the list: we email you the moment a provider covers ${lead.city}.`
            : "We don't have a provider covering your area yet. Hector has been notified and is looking.")
          : 'Not sent yet.',
    },
    {
      title: 'Provider accepted', done: accepted, when: accepted ? fmt(lead.claimedAt) : null,
      detail: accepted && lead.provider
        ? `${lead.provider.name.trim()} accepted your request and will call you${providerPhone ? ` from ${providerPhone}` : ' from a number you may not recognize'}. They are an independent provider; timing and pricing are confirmed directly with them.`
        : 'We email you the moment a provider accepts.',
    },
    { title: 'Date confirmed with the provider', done: dateConfirmed, when: dateConfirmed ? fmt(lead.appointmentDate || lead.outcomeUpdatedAt) : null, detail: dateConfirmed ? (lead.appointmentDate ? `Appointment: ${fmt(lead.appointmentDate)}.` : 'The provider has marked this as booked.') : 'The provider confirms the exact date and time with you directly.' },
    { title: 'Visit', done: visited, detail: visited ? 'Marked completed. Thank you for using MobilePhlebotomy.org.' : "Have your lab order or kit, and any fasting instructions from your doctor, ready." },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Your request</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {cancelled ? 'Request cancelled' : expired ? "We couldn't find a provider" : closedOther ? 'Request closed' : accepted ? 'A provider has accepted' : 'Waiting for a provider to accept'}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {first ? `Hi ${first}. ` : ''}MobilePhlebotomy.org connects you with independent providers; pricing, timing and clinical suitability are confirmed directly with them.
        </p>

        <ol className="space-y-5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className={`mt-0.5 flex-none w-5 h-5 rounded-full border-2 flex items-center justify-center ${s.done ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300'}`} aria-hidden>
                {s.done ? <svg viewBox="0 0 20 20" className="w-3 h-3" fill="currentColor"><path d="M7.6 13.2 4 9.6l1.4-1.4 2.2 2.2 6.6-6.6L15.6 5z" /></svg> : null}
              </span>
              <div>
                <div className="font-semibold text-gray-900">{s.title}{s.when ? <span className="ml-2 text-xs font-normal text-gray-500">{s.when}</span> : null}</div>
                <div className="text-sm text-gray-600">{s.detail}</div>
              </div>
            </li>
          ))}
        </ol>

        {cancelled && (
          <p className="mt-6 text-sm text-gray-700">You cancelled this request{lead.patientCancelledAt ? ` on ${fmt(lead.patientCancelledAt)}` : ''}. If you need a draw after all, <a href="/request-blood-draw" className="text-primary-700 underline">submit a new request</a>.</p>
        )}
        {expired && (
          <p className="mt-6 text-sm text-gray-700">None of the providers we asked was able to take this. Reply to the email we sent you with a nearby larger city or a more flexible time and we will send it again.</p>
        )}

        {!accepted && lead.patientRerouteAt && lead.status === 'OPEN' && (
          <p className="mt-6 text-sm text-gray-700">You sent this request on to other providers on {fmt(lead.patientRerouteAt)}. We email you the moment one accepts.</p>
        )}

        {reroute && (reroute.ok || reroute.code === 'too_early' || reroute.code === 'cap') && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="font-semibold text-gray-900 mb-2">Haven&apos;t heard from {providerName}?</h2>
            {reroute.ok && (
              <>
                <p className="text-sm text-gray-700 mb-3">Most providers call within a few hours of accepting. If you have had no call or text, you can send your request to other providers in your area. {providerName} will be told, and the first provider to accept will contact you.</p>
                <NoAnswerButton token={params.token} providerName={providerName} />
              </>
            )}
            {!reroute.ok && reroute.code === 'too_early' && (
              <p className="text-sm text-gray-700">Give them until about {fmt(reroute.availableAt || null)}. If you have had no call or text by then, you will be able to send your request to other providers from this page.</p>
            )}
            {!reroute.ok && reroute.code === 'cap' && (
              <p className="text-sm text-gray-700">This request has already been sent on twice. Hector has been notified and will place it by hand; reply to your confirmation email if you have not heard from him.</p>
            )}
          </div>
        )}

        {live && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-700 mb-3">Changed your mind, or already sorted? Cancelling closes the request{accepted ? ' and lets the provider know' : ' before any provider takes it'}.</p>
            <CancelRequestButton token={params.token} />
          </div>
        )}

        <p className="mt-8 text-xs text-gray-500">
          Need to change the date instead? Reply to your confirmation email. Not for emergencies — if this is a medical emergency, call 911.
        </p>
      </div>
    </div>
  )
}
