# Findings — Patient Completion Confirmation

Investigation only. No code written, no schema changed, nothing sent.
Ground rule 1 of the spec: this file exists to be reviewed *before* the build.

Date: 2026-09-03

---

## 1. Blocker — the Neon branch cannot be created from this session

Ground rule 2 requires the migration to run on a branch off production before
main is touched. The project ID in `.env.local` is `curly-night-78999764`,
matching the spec exactly. But:

- `neonctl` is not installed
- there is no `NEON_API_KEY` in any `.env` file
- `DATABASE_URL` points at production

So a branch can only be created by you, either in the Neon console
(Branches → New branch off `main`) or by issuing an API key I can use. Until
one exists there is nothing to migrate against, and per the ground rule I have
not run `db push` or `migrate` anywhere.

This is the one item that blocks the build starting. Everything below is
settled.

Note for whoever runs the migration: `prisma/migrations` is severely out of
sync with production and `migrate dev` wants to reset the database. Additive
changes have been going in with `db push`. Every field in spec §4 is additive
and nullable, so `db push` against the branch is the safe path — but this is
exactly why the branch matters.

---

## 2. Lead schema — what exists today

All in `prisma/schema.prisma`, model `Lead`, mapped to table `leads`.

Relevant existing fields:

| Field | Type | Populated? |
|---|---|---|
| `email` | `String?` | 266 of 286 claimed leads (93%) |
| `claimedAt` | `DateTime?` | 286 |
| `routedToId` | `String?` | the claiming provider (relation `provider`) |
| `outcome` | `LeadOutcome?` | 235 of 784 |
| `completedAt` | `DateTime?` | 45, exactly matching `APPOINTMENT_COMPLETED` |
| `appointmentDate` | `DateTime?` | **0 of 784** |

None of the six fields in spec §4 exist yet. No name collisions.

### 2.1 `appointmentDate` is dead — §5's first timing branch will never fire

The spec says send time is `appointmentDate + 24h` if set, otherwise
`claimedAt + 48h`. `appointmentDate` is populated on **zero** of 784 leads.

It is writable: `app/api/leads/[leadId]/update-status/route.ts:74` sets it when
the caller supplies one. No provider ever has. So in practice 100% of sends
will use the `claimedAt + 48h` branch.

Recommendation: keep the branch as specified — it is three lines, it is correct
if the field ever starts being populated, and removing it would need adding
back. But do not expect it to do anything, and do not use it as the primary
timing story when reasoning about behaviour.

### 2.2 Patient email coverage is good, and the gap is measurable

```
claimed leads                286
  with a usable email        266   (93%)  — no empty strings, so a null check suffices
  no email (phone-only)       20   (7%)   — §9 says skip and count these

backfill window (claimed in last 14 days)
  total                       28
  with email                  26
```

So the first run after deploy sends at most 26 emails — a comfortable first
batch, well under the 200 cap.

---

## 3. `lib/patientClaimNotice.ts` — what it does and how it fires

Sends the patient a note the moment a provider claims, naming the provider and
their phone so the incoming call is recognised.

- Triggered from `app/api/lead/claim/route.ts:150`, after the transaction that
  sets `status: 'CLAIMED'`, `routedToId`, and `claimedAt`.
- Fire-and-forget; a send failure does not fail the claim.
- Returns early when `input.email` is falsy.
- Exports `buildPatientClaimNotice()` separately from `sendPatientClaimNotice()`
  specifically so copy can be rendered and reviewed without a live credential.

**Follow that split for the new email.** It is the reason the copy in §6 can be
checked before anything reaches a real patient.

It is also the precedent for tone: the patient has already had one email from
`hector@` about this lead. The confirmation is the second, and should read as
the same person following up.

---

## 4. Email helper — `sendTransactionalEmail` is text-only

```ts
export interface TransactionalEmail {
  to: string
  subject: string
  text: string
  replyTo?: string
}
export async function sendTransactionalEmail(m: TransactionalEmail): Promise<string | null>
```

Returns `null` on success, an error string on failure. **There is no `html`
field.**

Spec §6 requires two tappable buttons, which is HTML. Two options:

1. Add an optional `html?: string` to `TransactionalEmail` — small, additive,
   benefits future callers, touches a shared file.
2. Send directly via `@sendgrid/mail` the way `patientClaimNotice.ts` already
   does for exactly this reason.

Recommend (1). The helper's error-string return is the thing worth keeping — it
is what lets the cron decide whether to set `outcomeRequestSentAt`, which is the
spec's idempotency rule. Reimplementing that in a second place invites drift.
The change is one optional property and cannot affect existing callers.

Sender is fixed: `hector@mobilephlebotomy.org` is the only verified sender on
the account. `noreply@` and `leads@` were both rejected by SendGrid. Do not
introduce a new from-address for this feature.

---

## 5. Cron pattern

Registered jobs live in `vercel.json`; there are currently **7**. Adding an
hourly job makes 8.

Canonical shape, from `app/api/cron/stale-claim-release/route.ts`:

```ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) { /* 401 */ }
```

Two things to copy exactly:

- **`GET`, not `POST`.** Vercel Cron issues GET.
- The guard is `if (cronSecret && ...)` — it no-ops when `CRON_SECRET` is unset
  rather than locking the route out. Match it.

### 5.1 Two orphaned cron routes already exist — do not follow their lead

`app/api/cron/lead-followups/` and `app/api/cron/catch-missed-notifications/`
exist as routes but are **not** in `vercel.json`, so they never run.
`lead-followups` is `export async function POST` and depends on
`sendPatientReminder` from `patientSmsFlow` — SMS, a dead end after the A2P
10DLC rejection. It is a POST route for a GET-only scheduler, wired to a channel
that cannot be used.

Worth knowing because it is a plausible-looking file to copy from, and copying
it would reproduce both mistakes.

---

## 6. No rate-limiting utility exists

Spec §7 says to rate-limit `POST /api/confirm/[token]` "using whatever
middleware pattern exists". Searched `lib/` and `app/api/` — there is no rate
limiter, no Upstash, no in-memory bucket, nothing.

So this needs a decision rather than a lookup:

- **In-memory Map keyed by IP.** Zero dependencies. Resets on cold start and is
  per-instance, so on serverless it is weak — but the thing being protected is a
  single-use token that 409s on a second submission, so the blast radius of no
  limiter at all is small.
- **Skip it this ticket** and rely on the token being unguessable and single-use.

Recommend the in-memory Map. It satisfies the spec, costs nothing, and the
honest note is that it is a speed bump rather than a real limiter. Flagging
because the spec's phrasing assumes a pattern that is not there.

---

## 7. Route collisions

`app/confirm/` does not exist. No conflict with any existing route or with the
metro / city / provider dynamic segments.

### 7.1 Middleware will 301 a token containing "null" or "undefined"

`middleware.ts` matches `/((?!_next/static|_next/image|favicon.ico).*)` — so it
sees `/confirm/{token}` — and redirects to `/` on:

```ts
/\/undefined/i,
/\/null/i,
```

These are case-insensitive substring tests against the whole pathname. nanoid's
alphabet is `A-Za-z0-9_-`, so a token *can* contain the literal `null`. For a
32-character token the chance is roughly 1 in 600,000 — small, but it fails
silently and in the worst way: the patient taps, lands on the homepage, and
their answer is never recorded. Nobody would ever diagnose it.

Cheap fix: reject and regenerate any token matching `/null|undefined/i` at
generation time. One line, removes the class of bug entirely.

---

## 8. Token generation

`nanoid` is already a dependency and is the established pattern —
`lib/auth.ts:19` uses `nanoid(64)` for magic links, `lib/client-auth.ts` the
same for client sessions.

The spec asks for "random, 32 bytes url-safe". `nanoid(32)` gives ~190 bits of
entropy from a URL-safe alphabet — more than sufficient, and consistent with the
rest of the codebase. Recommend `nanoid(32)` over hand-rolling
`randomBytes(32).toString('base64url')`.

---

## 9. Admin area exists — §8 can be a real view later

`app/admin/` holds panels (`LeadsPanel`, `MessagesPanel`,
`ProvidersManagementPanel`, …) plus sub-routes including `lead-quality` and
`lead-diagnostic`. The spec says a SQL file alone is acceptable.

Recommend starting with the SQL file in `docs/queries/` as specified. The
reconciliation number is not needed until around Nov 5, and building a panel now
is work before the data exists to justify its shape.

---

## 10. One case the spec does not cover

Spec §9 says: if the provider marks `APPOINTMENT_COMPLETED` before the email
goes out, still send — "that's the whole point".

Agreed. But the reverse case is unhandled and is the more common one: **56 of
286 claimed leads never got any outcome logged at all.** For those the patient
email is the *only* signal that will ever exist, and the reconciliation table in
§8 will show them as "provider says nothing / patient says completed".

That is not a defect — it is arguably the most valuable row in the table, since
it measures provider reporting discipline, which is precisely what this feature
exists to find out. Worth making sure the §8 query counts provider-outcome-null
separately rather than folding it into disagreement.

---

## 11. Summary

Everything in the spec is buildable as written, with four adjustments:

1. `appointmentDate + 24h` is dead code in practice (§2.1) — keep, expect nothing.
2. `sendTransactionalEmail` needs an optional `html` field (§4).
3. No rate limiter exists to reuse; recommend an in-memory Map (§6).
4. Guard generated tokens against `null` / `undefined` substrings (§7.1).

Blocked on one thing: the Neon branch (§1).
