/**
 * When a provider's lead notification is allowed to arrive.
 *
 * Two rules combine here, and they must live in one place because
 * lib/cancelLeadNotifications.ts reconstructs delivery times from this
 * calculation to decide who actually saw a lead before it was claimed. When the
 * sender and that reconstruction disagree, providers get told they lost leads
 * they were never shown — which generated two support complaints from Resolute
 * Mobile lab and took two separate fixes to stamp out. Any change here changes
 * who receives a courtesy email.
 *
 *   1. Paid head start — paying providers first, free listings held.
 *   2. Quiet hours — nobody is pinged in the middle of the night.
 *
 * Quiet hours exist because Mary Berry (Quick Labs) asked to be removed from
 * the list on 2026-08-20 and gave the reason: "I'm getting emails at 3am."
 * Her notifications had gone out at 4:31am and 5:30am her time. Nothing in the
 * notification path knew what time it was.
 */

import type { Provider as ProviderModel } from '@prisma/client'

/** 10 minutes. See PAID_HEAD_START_SECONDS in lib/leadNotifications.ts. */
export const QUIET_START_HOUR = 21   // 9pm — held from here
export const QUIET_END_HOUR = 8      // 8am — released here

/**
 * State to UTC offset in hours (standard time), with a DST flag.
 *
 * Deliberately coarse. Several states straddle two zones (FL, TX, TN, KY, IN,
 * ND, SD, NE, KS, OR, ID) and this picks the majority zone. Being an hour out
 * on a quiet-hours guard is harmless — the failure mode is sending at 7am or
 * holding until 9am, not waking someone at 3am.
 */
const STATE_UTC_OFFSET: Record<string, number> = {
  // Eastern
  CT: -5, DE: -5, DC: -5, FL: -5, GA: -5, IN: -5, KY: -5, ME: -5, MD: -5,
  MA: -5, MI: -5, NH: -5, NJ: -5, NY: -5, NC: -5, OH: -5, PA: -5, RI: -5,
  SC: -5, VT: -5, VA: -5, WV: -5,
  // Central
  AL: -6, AR: -6, IL: -6, IA: -6, KS: -6, LA: -6, MN: -6, MS: -6, MO: -6,
  NE: -6, ND: -6, OK: -6, SD: -6, TN: -6, TX: -6, WI: -6,
  // Mountain
  AZ: -7, CO: -7, ID: -7, MT: -7, NM: -7, UT: -7, WY: -7,
  // Pacific
  CA: -8, NV: -8, OR: -8, WA: -8,
  // Other
  AK: -9, HI: -10, PR: -4,
}

/** Arizona and Hawaii do not observe DST. */
const NO_DST = new Set(['AZ', 'HI'])

/** Rough US DST window: second Sunday in March to first Sunday in November. */
function isDST(d: Date): boolean {
  const m = d.getUTCMonth() // 0-11
  if (m > 2 && m < 10) return true
  if (m < 2 || m > 10) return false
  return true // March and November edges — close enough for an hours guard
}

/**
 * The provider's local hour (0-23) at a given instant.
 * Returns null when we can't tell, and callers treat that as "no quiet hours"
 * — never guess someone into a six-hour delay.
 */
export function providerLocalHour(state: string | null | undefined, at: Date): number | null {
  if (!state) return null
  const base = STATE_UTC_OFFSET[state.toUpperCase()]
  if (base === undefined) return null
  const offset = NO_DST.has(state.toUpperCase()) ? base : base + (isDST(at) ? 1 : 0)
  const local = new Date(at.getTime() + offset * 3600_000)
  return local.getUTCHours()
}

/** Seconds from `at` until the provider's local QUIET_END_HOUR. 0 if not in quiet hours. */
export function quietHoursDeferralSeconds(
  state: string | null | undefined,
  at: Date,
): number {
  const hour = providerLocalHour(state, at)
  if (hour === null) return 0
  const inQuiet = hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR
  if (!inQuiet) return 0

  // Hours until 8am local, counting forward across midnight.
  const hoursUntil = hour >= QUIET_START_HOUR
    ? (24 - hour) + QUIET_END_HOUR
    : QUIET_END_HOUR - hour

  // Subtract the minutes already elapsed in the current hour so a 7:59am lead
  // waits one minute rather than a full hour.
  const at2 = new Date(at.getTime())
  const partial = at2.getUTCMinutes() * 60 + at2.getUTCSeconds()
  return Math.max(0, hoursUntil * 3600 - partial)
}

export interface DelayInput {
  /** Only the fields that affect timing. */
  provider: Pick<ProviderModel, 'priorityRouting' | 'primaryState'>
  urgency: 'STANDARD' | 'STAT' | string
  /** How many paying providers are in this lead's batch, including the claimer. */
  payingProviderCount: number
  /** Head start length in seconds, injected so there is one constant, not two. */
  headStartSeconds: number
  /** When the notification was created. Defaults to now. */
  at?: Date
}

/**
 * Total seconds a provider's notification is held.
 *
 * STAT is never delayed for any reason — not for the head start, not for quiet
 * hours. An urgent patient must never wait on a monetisation window or on
 * someone's sleep.
 */
export function notificationDelaySeconds(input: DelayInput): number {
  const { provider, urgency, payingProviderCount, headStartSeconds } = input
  const at = input.at ?? new Date()

  if (urgency === 'STAT') return 0

  // Head start: only applies to free listings, and only when a paying provider
  // actually covers this area — otherwise the patient is delayed for nothing.
  const headStart = provider.priorityRouting || payingProviderCount === 0
    ? 0
    : headStartSeconds

  // Quiet hours apply to every tier. A 3am email is unwelcome whether or not
  // you pay, and holding everyone preserves the head start relative to each
  // other: a 2am lead reaches the paying provider at 8:00am and free listings
  // at 8:10am.
  const quiet = quietHoursDeferralSeconds(provider.primaryState, at)

  // Not additive. If we are deferring to 8am anyway, the head start is absorbed
  // unless it would push past the release — so take the later of the two, then
  // re-apply the head start on top of a quiet-hours release.
  return quiet > 0 ? quiet + headStart : headStart
}
