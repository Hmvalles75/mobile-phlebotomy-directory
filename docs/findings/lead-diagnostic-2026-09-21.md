# Lead diagnostic, 2026-09-21

Read-only. Window 2026-08-22 to 2026-09-21 vs the prior 30 days. Reproduce with
`npx tsx scripts/lead-diagnostic-30d.ts` and `npx tsx scripts/lead-monetization-cuts.ts`.

## Funnel

| | 30d | prior 30d |
|---|---|---|
| Leads | 105 | 117 |
| Claimed | 60 (57%) | 63 (54%) |
| Booked or completed | 16 (15%) | 25 (21%) |
| Claimed to booked | 27% | 40% |
| Never reached a provider | 17 (16%) | |
| Reached, never claimed | 16 | |

Volume is flat at 22 to 35 leads a week since June. July's 173 was one Bing-driven week (53 leads, week of 7/12), not a level.

## Leaks, largest first

1. **Soft outcomes park leads forever.** 85 claimed leads in 90 days sit on TEXT_SENT, NO_ANSWER, WORKING_IT, EMAIL_SENT or VOICEMAIL for more than three days. Any logged outcome stops the stale release, so these are neither won, lost nor re-offered. 27 of the last 30 days' 60 claims are in this state.
2. **No ground truth.** The patient outcome survey is built and scheduled (`/api/cron/patient-outcome`) and has never sent one email: `PATIENT_OUTCOME_ENABLED` is not set in Vercel, so it runs dry every day. Every booked number here is provider-reported.
3. **Insurance leads do not book.** 16 in 30 days, 44% claimed, 0 booked. Out-of-pocket books at 18%.
4. **No coverage.** 17 leads (16%) reached nobody: rural TN, MS, MT, ND, ME, HI, NV, plus Tucson, Green Bay, Reno. Two were high-value ($1,500 each).
5. **Thin states.** 90 days: PA 23 leads, 35% claimed, 1 won. CT 11 leads, 9% claimed. IN 11 leads, 18% claimed. Rochester NY has one provider.
6. **Release recovery is weak.** 28 stale releases, 9 re-claimed by someone else, 1 booked.

## Money

- 7 paying providers, about $500 MRR. They take 13% of claims and 25% of wins (4 of 16).
- In the 22 leads where a payer was in the batch: payer claimed 8, a free provider 6, nobody 8.
- 3 of 7 payers received one lead or fewer in 30 days (Proknostix 1, Steve's 0, Dynamic Stix 3). Churn risk is supply of leads, not product.
- 86 distinct free providers claimed in 90 days. 19 claimed three or more; 36 logged at least one win. AccuDraw (FL) 8 claims 5 wins, Boujee Sticks (NC) 6 and 5, Sheppard (CA) 4 and 3, all paying nothing.
- States with real demand and zero payers: PA 23, TX 21, NY 20, NC 17, IL 15, NJ 15, MI 14, OH 13, GA 9.
- Institutional: 6 high-value leads in 90 days, estimated $7,650, one closed at $2,000.

## Recommendations

Improve:
1. Set `PATIENT_OUTCOME_ENABLED=true` in Vercel. Free, already built.
2. Soft-outcome expiry: provider nudge on day 2 with one-tap booked / lost / release, patient check-in at 48h, auto-release on day 5.
3. Insurance intake: say up front that most mobile draws are self-pay, and route insurance requests only to providers who bill it.
4. Recruit PA, CT, IN, Rochester and the no-coverage list.

Monetize, in order of confidence:
1. Convert the 19 heavy free claimers with their own numbers. No build. Five conversions doubles MRR.
2. Claim allowance on the free tier: two free claims a month, then a per-claim fee or the $79 plan. Pay-per-lead plumbing already exists. Price it only after the patient survey gives a real booking rate.
3. Institutional stays the highest dollar per hour. Work the two uncovered high-value leads.

Not recommended: charging patients.
