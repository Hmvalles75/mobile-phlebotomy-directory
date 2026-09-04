# Lead diagnostic, 30 days (2026-08-05 to 2026-09-04)

Scripts: `scripts/lead-diagnostic-30d.ts` (funnel + failure modes) and
`scripts/lead-diagnostic-30d-followup.ts` (root-causes the unreached/ignored leads).
Both read-only. Prior window in brackets.

## Funnel

| stage | 30d | prior 30d |
|---|---|---|
| created | 110 | 168 |
| claimed | 63 (57%) | 78 (46%) |
| booked | 18 (16%) | 27 (16%) |
| completed | 10 (9%) | 15 (9%) |

Volume is down a third. Claim rate is up, booking and completion rates are flat.
Claim latency is healthy: median 2 minutes, 90% inside 6 hours. Speed is not the problem.

## Where the leads go

44 of 110 leads (40%) are still OPEN. They split into two different failures:

**1. Never reached a provider (28 leads, 25%).** Zero SENT notifications.

| cause | leads |
|---|---|
| provider now in radius, but signed up or expanded AFTER the lead arrived | 13 |
| nearest eligible provider more than 100 miles away (true coverage gap) | 11 |
| provider within 100 mi but outside their own radius | 3 |
| unrecognised ZIP (86000, "Los Angles", the only high-value lead, $1500) | 1 |

Structural cause: the live submit path (`app/api/lead/submit/route.ts`) creates
every lead as OPEN. When zero providers match it sends the patient an expansion
email and an admin alert, but never flips status to NEEDS_COVERAGE. That status
is only written by the SMS-qualification flow, which is not the live path. So
"no coverage" and "providers ignored it" are indistinguishable in the DB, and
the weekly `nocov` count reads 0 forever.

The 13 "should have matched" leads are the queued rematch-on-activation item:
Precision Point, Priester-Nichols, Proline, Vein Connoisseurs, Veins to Vein,
Superior all signed up between 8/18 and 9/4; Kalm Kare, LNL, Sticks R Us,
Salina's, Exceptional, Gentle Trace were edited (radius) after the lead.
Nothing re-routes an existing OPEN lead when that happens, and the 4-day age cap
in `notifyFeaturedProvidersForLead` blocks a manual re-notify on all but one of
them. Four leads in this bucket were claimed anyway (Hampton VA x2, Shelburne VT,
Naples ME) with no notification rows, i.e. manual rescue by email. The rescue
works; it just isn't systematic.

**2. Reached, ignored (20 leads).** Notified 1 to 4 providers, nobody claimed.
Fan-out predicts claim rate almost perfectly:

| providers reached | leads | claimed |
|---|---|---|
| 1 | 5 | 20% |
| 2 | 14 | 50% |
| 3-4 | 21 | 62% |
| 5-8 | 18 | 100% |
| 9+ | 23 | 87% |

Below 3 providers a lead is a coin flip. 60 providers were notified 3+ times
with zero claims. The worst are opening the emails and not acting:

| provider | notified | opens/clicks | last claim ever |
|---|---|---|---|
| On Call Phlebotomy | 17 | 18 | 2026-05-18 (paused in May, still being notified) |
| Ponce Mobile (PREMIUM) | 15 | 20 | 2026-03-19 |
| Resolute Mobile lab | 12 | 10 | 2026-07-22 |
| Traveling Tubes | 12 | 2 | never |
| Mom Vic's | 11 | 4 | 2026-07-14 |
| Optimal Paramedical | 9 | 19 | 2026-05-01 |
| FDP Phlebotomy | 8 | 20 | never |
| Vena Pro Solutions | 9 | 8 | never |

Rosamond CA was notified 18 times to the same 4 providers across 3 stale-release
cycles; none of the 4 ever claims. That is the dormant-provider problem showing
up as provider spam.

## After the claim

Of 63 claimed: 18 won (29%), 20 stuck mid-funnel (WORKING_IT / TEXT_SENT /
EMAIL_SENT, 32%), 10 failed contact (16%), 8 PATIENT_FOUND_OTHER (13%).
Seven leads booked more than 7 days ago were never marked completed.
Stale-release: 30 releases, 12 re-claimed by someone else, 2 of those booked.

## Intake

Intent gates are not discriminating: doctor-order yes/no/need_help all claim
53-58% and book 13-17%. Insurance vs out-of-pocket likewise. 106 of 110 are
1-3 draws. One high-value lead in 30 days and it was never routed (bad ZIP).

Bing referrals book at 36% vs Google 15% and direct 9% (n=22/33/23). Small,
but consistent with the prior window's read that search intent quality varies
by engine.

## Deploy note (resolved 2026-09-04)

The patient-confirmation columns were missing from prod when this ran; `prisma db push`
was applied the same day and the diff is now empty. Item 8 below is done.

## Dead mailboxes still being notified

precisionmobilephlebotomyllc.com (provider cmoqfcq4h0002l404d9ewsipp) and
treeoflifelabgroup.com (cmm71q1kf0000lh04hjlkku4k) hard-bounce. Their
notifications count as "sent" and inflate the fan-out for their leads.

## Fixes, in order of leverage

1. BUILT 2026-09-04 (branch rematch-and-coverage-detection, lib/leadRematch.ts).
   **Rematch OPEN leads on provider activation or radius change** (queued item;
   now 13 lost leads in 30 days). One-shot admin action plus a hook on the
   activation/coverage-edit paths. Bypass the 4-day cap for this path only,
   with an upper bound of ~14 days.
2. BUILT 2026-09-04 (same branch, lib/coverageGap.ts + /api/cron/coverage-sweep).
   **Set NEEDS_COVERAGE from the live submit path** when `emailCount === 0`,
   and add a daily sweep that moves OPEN leads with zero SENT notifications
   into NEEDS_COVERAGE. Restores the coverage/ignored split and makes the
   recruitment inventory real again.
3. **Dormant-provider auto-deactivation** (queued): flip `eligibleForLeads`
   off after N notified-with-no-claim (say 8) or 60 days without a claim.
   Exempt paying tiers, but flag Ponce (PREMIUM, 15 notified, 0 claims since
   March) for a direct conversation. Confirm On Call's May pause actually
   stops notifications; it doesn't appear to.
4. **Minimum fan-out floor**: when a lead matches fewer than 3 providers,
   widen to the next providers within 100 mi regardless of their radius, and
   copy the admin. Turns the 1-2 provider coin flips into the 5+ bracket.
5. **ZIP validation at intake**: reject ZIPs that don't geocode and re-prompt.
   Would have caught the $1500 lead.
6. **Bounce-to-notifyEnabled**: on hard bounce, set `notifyEnabled=false` and
   alert admin, so dead mailboxes stop counting as coverage.
7. **Mid-funnel nudge**: 20 leads sit at WORKING_IT/TEXT_SENT. A 48h email to
   the provider asking for a real outcome would move the 7 stale bookings too.
8. ~~Run `prisma db push` before the next deploy.~~ Done 2026-09-04.

## Found while building (2026-09-04), not fixed here

- `/api/cron/expire-stale-leads` exports only POST. Vercel crons call GET, so the
  14-day auto-close has never run: 166 OPEN leads with no notification row go
  back 108 days. Separate one-line fix.
- No audit trail for provider flag changes. On Call was re-enabled between 5/21
  and 7/27 and nothing records by whom; the admin PATCH only console.logs.
- Commit 1b7626e (8/25, state filter removed) was intentional and correct, but
  no rematch followed it; 5 of the 9 rematchable leads were that.
