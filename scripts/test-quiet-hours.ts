import { notificationDelaySeconds, providerLocalHour, quietHoursDeferralSeconds, QUIET_START_HOUR, QUIET_END_HOUR } from '../lib/notificationTiming'

/** Quiet-hours behaviour, checked against the cases that motivated it. */
const HEAD_START = 600
const fmt = (s: number) => s === 0 ? 'immediate' : s < 3600 ? `${Math.round(s / 60)}m` : `${(s / 3600).toFixed(1)}h`

function at(utcISO: string) { return new Date(utcISO) }

const cases: Array<[string, string, string, 'STANDARD' | 'STAT', boolean, number]> = [
  // label, state, utc time, urgency, isPaying, payingInBatch
  ['Mary 4:31am ET (the complaint)', 'PA', '2026-08-20T08:31:00Z', 'STANDARD', false, 1],
  ['Mary 5:30am ET (the complaint)', 'PA', '2026-08-20T09:30:00Z', 'STANDARD', false, 1],
  ['2am ET, paying provider',        'PA', '2026-08-20T06:00:00Z', 'STANDARD', true,  1],
  ['2am ET, STAT — must not wait',   'PA', '2026-08-20T06:00:00Z', 'STAT',     false, 1],
  ['10am ET, normal business hours', 'PA', '2026-08-20T14:00:00Z', 'STANDARD', false, 1],
  ['8:30pm ET, still allowed',       'PA', '2026-08-21T00:30:00Z', 'STANDARD', false, 1],
  ['9:30pm ET, now held',            'PA', '2026-08-21T01:30:00Z', 'STANDARD', false, 1],
  ['same instant, California',       'CA', '2026-08-21T01:30:00Z', 'STANDARD', false, 1],
  ['no paying provider in batch',    'PA', '2026-08-20T14:00:00Z', 'STANDARD', false, 0],
  ['unknown state — never guess',    null as any, '2026-08-20T06:00:00Z', 'STANDARD', false, 1],
]

console.log(`Quiet hours: held from ${QUIET_START_HOUR}:00 to ${QUIET_END_HOUR}:00 local\n`)
for (const [label, state, utc, urgency, paying, payingCount] of cases) {
  const when = at(utc)
  const hour = providerLocalHour(state, when)
  const d = notificationDelaySeconds({
    provider: { priorityRouting: paying, primaryState: state } as any,
    urgency, payingProviderCount: payingCount, headStartSeconds: HEAD_START, at: when,
  })
  console.log(`  ${label.padEnd(34)} local ${hour === null ? ' ?' : String(hour).padStart(2)}:00  ${paying ? 'PAID' : 'free'}  -> ${fmt(d)}`)
}

// The invariant that matters most.
const stat = notificationDelaySeconds({
  provider: { priorityRouting: false, primaryState: 'PA' } as any,
  urgency: 'STAT', payingProviderCount: 5, headStartSeconds: HEAD_START, at: at('2026-08-20T06:00:00Z'),
})
console.log(`\n  STAT at 2am with 5 paying providers in batch: ${fmt(stat)}  ${stat === 0 ? 'PASS' : 'FAIL — urgent patients must never be held'}`)
