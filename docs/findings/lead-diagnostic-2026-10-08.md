# Lead diagnostic, 2026-10-08

Read-only. Window 2026-09-08 to 2026-10-08 vs the prior 30 days. Reproduce with
`npx tsx scripts/lead-diagnostic-30d.ts` and `npx tsx scripts/lead-monetization-cuts.ts`.
Previous report: lead-diagnostic-2026-09-21.md.

## Funnel

| | 30d | prior 30d |
|---|---|---|
| Leads | 88 | 107 |
| Claimed | 46 (52%) | 63 (59%) |
| Booked or completed | 20 (23%) | 18 (17%) |
| Claimed to booked | 43% | 29% |
| Completed | 12 (14%) | 10 (9%) |
| Never reached a provider | 20 (23%) | 16% on 9/21 |
| Reached, never claimed | 14 | 16 on 9/21 |
| Median time to claim | 8 min | |

Fewer leads, better conversion. Monthly volume: July 173, August 104, September 95, October on pace for about 80.
Weekly volume over the last five weeks: 10, 25, 20, 14, 19.

## What moved since 9/21

- **Claimed to booked rose from 29% to 43%.** Soft-outcome parking fell from 85 to 70 leads. The day-2 nudge and patient check-in are firing: 22 of each in 30 days, 5 patient answers (4 "in touch", 1 "no contact").
- **More bookings go to paying providers, mostly because more providers pay.** 8 payers now. In this window they took 26% of claims and 9 of 20 bookings. In the prior window, providers who pay today took 1 of 18. See the note on comparisons below.
- **New patient tools are live but barely used yet.** 24 leads since 9/29 got a status page; 0 cancels, 0 reroutes, 8 "we couldn't find a provider" emails, 1 waitlisted.

## Note on comparing with the 9/21 report

The two reports measure different windows, so their numbers do not line up directly.

| | Window | Leads | Booked | Booked by a payer |
|---|---|---|---|---|
| 9/21 report, as published | 8/22 to 9/21 | 105 | 16 (15%) | 4 of 16 |
| Same window, recounted 10/08 | 8/22 to 9/21 | 102 | 19 (19%) | 7 of 19 |
| This report, prior window | 8/09 to 9/08 | 105 to 107 | 18 (17%) | 1 of 18 |
| This report | 9/08 to 10/08 | 88 to 89 | 20 (22 to 23%) | 9 of 20 |

Four things move the numbers:

- **Different windows.** The 9/21 report covered 8/22 to 9/21. This report's prior window is 8/09 to 9/08. They overlap for only 17 days.
- **Outcomes arrive late.** Both scripts count a lead as booked by its outcome today, so an old window gains bookings as providers log them. The 9/21 window rose from 16 to 19.
- **"Paying" means paying today.** Providers who upgraded after a window count as payers for it, and providers who stopped do not. Sheppard and Bayford, both top bookers, became payers during these windows.
- **Lead counts drift by one to three** because duplicates get merged and the window edges move with the time of day the script runs.

Read the trend from the same-window rows, not across reports: booked share 17% to 22%, claimed-to-booked 29% to 43%.

## Leaks, largest first

1. **No ground truth, third report running.** The patient outcome survey has still sent zero emails. `PATIENT_OUTCOME_ENABLED` is not set in Vercel. Every booked number above is the provider's word.
2. **No coverage is growing.** 20 leads (23%) reached nobody, up from 16%: Visalia, Dinuba, Truckee CA; Reno, Sparks NV; Pasco, Lake Tapps WA; Honolulu x2; Belgrade, Billings MT; Stringer, Forest MS; plus single towns in NE, IN, VA, AZ, TN, NC.
3. **Insurance still does not book.** 17 insurance leads, 59% claimed, 0 booked. Out-of-pocket books at 32%. The 9/23 intake copy did not change the result.
4. **One high-value lead untouched for a month.** Pamala Patrick, Forest MS, est. $1,500, in institutional review since 9/9 with no note.
5. **Booked but never completed.** 9 leads booked more than 7 days ago are not marked completed. Inflates "booked", hides real completions.
6. **Thin states.** 90 days: PA 24 leads, 38% claimed, 2 won, 0 payers. IN 9 leads, 22% claimed, 0 won. IL 12 leads, 42% claimed.
7. **Providers who never claim keep getting leads.** 46 providers notified 3+ times in 30 days with zero claims. Top: Precision Point 9, Moore Mobile 9, Bloodline 7, Optimal Paramedical 6, Priester-Nichols 6, Express Labs 6.

## Money

- 8 payers. Steve's Gentle Touch got 0 requests in 30 days (3 in 90). Proknostix got 1 (2 of the promised 3 so far).
- Upgrade targets, free providers by 90-day claims and wins: Boujee Sticks NC 6/5, AccuDraw FL 6/3, Life of Charliee's Angels MI 5/2, Allstar VA 4/2, Precision Care WA 4/2.
- States with real demand and zero payers: PA 24, TX 20, NC 18, NY 15, OH 13, NJ 13, IL 12, MI 11.
- Institutional: 5 high-value leads in 90 days, est. $5,325. Vibrant Wellness (Santa Clara) booked.
- Attribution, 30 days: Google 28 leads (18% booked), Bing 20 (25%), direct 20 (15%), DuckDuckGo 12 (25%), ChatGPT 2 (50%).

## Where the volume went, July to October

Reproduce with `npx tsx scripts/lead-volume-by-source.ts`. October is 7 days, so compare per day.

| | Jul | Aug | Sep | Oct (7 days) | Per day, Jul to Oct |
|---|---|---|---|---|---|
| All leads | 173 | 106 | 96 | 21 | 5.6 to 3.0 |
| Google | 60 | 30 | 30 | 9 | 1.9 to 1.3 |
| Bing | 44 | 21 | 21 | 6 | 1.4 to 0.9 |
| Direct | 20 | 20 | 22 | 3 | 0.6 to 0.4 |
| DuckDuckGo | 22 | 20 | 12 | 2 | 0.7 to 0.3 |
| Yahoo | 17 | 6 | 6 | 0 | 0.6 to 0 |
| ChatGPT | 8 | 6 | 1 | 1 | 0.3 to 0.1 |

By page type:

| | Jul | Aug | Sep | Oct (7 days) |
|---|---|---|---|---|
| State pages | 82 | 49 | 41 | 8 |
| Home page | 51 | 31 | 17 | 3 |
| City pages | 11 | 13 | 31 | 7 |
| Guides and service pages | 12 | 5 | 4 | 1 |
| Provider pages | 4 | 5 | 1 | 1 |

Home-page leads by source:

| | Jul | Aug | Sep | Oct (7 days) |
|---|---|---|---|---|
| Bing | 24 | 10 | 2 | 3 |
| DuckDuckGo | 9 | 7 | 1 | 0 |
| Yahoo | 6 | 2 | 1 | 0 |
| Direct | 7 | 6 | 8 | 0 |
| Google | 3 | 2 | 3 | 0 |

Bing alone, split by where the visitor landed:

| Bing requests | Total | Home page | State or city page | Other |
|---|---|---|---|---|
| July | 44 | 24 | 15 | 5 |
| August | 21 | 10 | 6 | 5 |
| September | 21 | 2 | 17 | 2 |

What this shows (corrected 2026-10-08; an earlier version of this section called the home page the biggest single loss):

- **July was inflated by one week.** The week of 7/12 alone had 53 leads, about 15 more than an ordinary week, almost all Bing, DuckDuckGo and Yahoo visitors landing on the home page. Claims and bookings that week matched an ordinary week.
- **The home-page decline from August to September is a shift between pages, not a loss.** Bing Webmaster Tools shows site-wide Bing clicks flat (607, 588, 577 for July to September), and Bing-sourced requests were flat from August to September at 21. Those visitors now land on state and city pages instead of the home page. The shift began in the week of 8/30, a month before the 9/24 URL consolidation, so that is not the cause; it follows the 8/25 domain outage and canonical-host restore. Weekly Bing counts are small (3 to 8), so treat the timing as approximate. DuckDuckGo did fall from 20 to 12.
- **July was the outlier, not August.** Requests per month: April 101, May 112, June 124, July 173, August 106, September 96. Bing requests per 100 Bing clicks: May 4.9, June 3.2, July 7.1, August 3.4, September 3.5. August and September are back at the spring level; July ran about twice it, on Google and Bing alike.
- **July was not inflated by junk.** Today's intake rules would reject or suppress 7 of July's 173 requests (4 duplicates within 6 hours, 1 unassigned area code, 1 email domain that takes no mail, 1 provider test), fewer than April to June (13 to 20 a month, before the 7/10 and 7/16 dedupe rules). Nine July requests repeated a phone number within 7 days, a looser test than today's rule. No spam filter, dedupe or captcha was added between 7/20 and 8/10, and the 7/27 attribution change did not alter how patient requests are recorded. Reproduce with `npx tsx scripts/lead-quality-by-todays-rules.ts`.
- **Not a recording artifact.** Source and landing page are captured on the visitor's first page view and sent with the request; patient forms have used the same capture since 7/27. Requests recorded as direct stayed at 20 to 22 a month, none lack a source, and none record the form page as the landing page. No change to the home page, its ZIP form or the request page since July 1 sends visitors elsewhere before they submit. The request page's coverage banner was made more cautious on 8/25, but weekly counts show no step change after it.
- **State and city pages together:** 93 in July, 62 in August, 72 in September.

Worth checking next: Bing Webmaster Tools' Pages report, to confirm home-page clicks fell as state and city pages rose; and Google Search Console clicks for July against August. If Google clicks held flat while Google requests halved, the July-to-August drop is in how many visitors request a draw, not in traffic.

## Recommendations

1. Set `PATIENT_OUTCOME_ENABLED=true` in Vercel. Free, built, asked for in every report since 9/04.
2. Answer or close the Forest MS lead.
3. Insurance: started 10/08 as an intake disclosure, shown before the patient chooses, that home draws are almost always self-pay. Over 90 days the full request form drew 48% insurance answers against 9% on the city-page form, which already framed the question around self-pay.
4. Run the response-score revisit (due 10/06). Item (a) is the one this report keeps showing: providers like Moore and Bloodline get many leads and never claim.
5. Ask providers to mark booked visits completed: the day-2 nudge could carry a "done" tap for BOOKED leads.
6. Recruit: Central Valley CA, Reno/Sparks, Pasco WA, Honolulu, PA. Use the no-coverage list as the pitch.
7. Upgrade outreach to the five heavy free claimers above, with their own numbers.
