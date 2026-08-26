# Phase 2 — Legacy City URL Consolidation

Changes are **staged, not committed**. Nothing pushed, nothing deployed.

---

## Files changed

| File | Change |
|---|---|
| `next.config.mjs` | +90 legacy redirects, `permanent: true`, in one commented block. Existing 14 untouched. |
| `data/city-longform.ts` | +4 entries (boston, dallas, houston, miami). 4 → 8 keys. |
| `app/sitemap.ts` | −90 legacy entries. 102 → 12 remaining, deliberately. |
| `CONSOLIDATION_FINDINGS.md` | Phase 1 deliverable (untracked, staged with this work). |
| `PHASE2_SUMMARY.md` | This file. |

**Final redirect count: 90 new** (109 rules total in `next.config.mjs`; 94 match the
legacy pattern, of which 4 pre-existed). All `permanent: true` → 308. Every
destination begins `/us/`.

---

## Item 1 — the 8 unmapped cities

**No `CITY_MAPPING` entries were added.** Your section title says "Add the 8 missing
CITY_MAPPING entries", but every arrow you gave points at a *different, existing*
city (`manhattan → /us/new-york/new-york`, not `→ /us/new-york/manhattan`). Adding
mapping entries would have created eight new pages that the redirects then bypass —
incoherent, and it would conflict with "do not invent one". I followed the arrows.
**Flagging in case you meant the title.**

All four target pages verified present in `CITY_MAPPING` and returning 200:

| Legacy city | Target as written | Target verified |
|---|---|---|
| manhattan-ny | `/us/new-york/new-york` | ✅ 200 |
| queens-ny | `/us/new-york/new-york` | ✅ 200 |
| beverly-hills-ca | `/us/california/los-angeles` | ✅ 200 |
| west-hollywood-ca | `/us/california/los-angeles` | ✅ 200 |
| livonia-mi | `/us/michigan/detroit` | ✅ 200 |
| southfield-mi | `/us/michigan/detroit` | ✅ 200 |
| troy-mi | `/us/michigan/detroit` | ✅ 200 |
| bayonne-nj | `/us/new-jersey/jersey-city` | ✅ 200 — **no fallback to newark needed** |

### Disagreement worth your review: Manhattan and Queens

`CITY_MAPPING` already contains `new-york/bronx`, `new-york/brooklyn` and
`new-york/staten-island`, and all three render 200 (this also closes Phase 1 risk
#6, which I had left unverified). Manhattan and Queens are the only two boroughs
without entries.

As written, three boroughs keep dedicated pages and two get folded into
`/us/new-york/new-york`. The consistent alternative is to add `new-york/manhattan`
and `new-york/queens` to `CITY_MAPPING` and point each legacy URL at its own
borough page — which is also what your section title literally describes. That is
a 2-line data change requiring no database access. **I recommend it, and it is not
in the staged diff.**

The other six are a different case and I'd leave them as approved: Beverly Hills,
West Hollywood, Livonia, Southfield, Troy and Bayonne are **independent
municipalities**, not neighbourhoods of their targets. Someone searching "mobile
phlebotomy Troy MI" now lands on Detroit. That is still better than leaving a
self-canonical duplicate live, but it is a real trade and worth naming.

---

## Item 2 — prose ported

**4 cities ported, not 9.** Two findings changed the list.

### Correction to my own Phase 1 §6 table

Phase 1 ranked pages by a character-count proxy, and it was wrong about Detroit.
`detroit-mi/mobile-phlebotomy` contains **no city-specific prose at all**; the 807
characters came from `detroit-mi/blood-draw-at-home`, which is a generic
how-it-works explainer ("Your physician provides a lab requisition…") that appears
across many legacy pages. **Detroit needed nothing ported.** The real list was 8,
not 9.

### Blocker: CITY_LONGFORM only renders through a static override

`CITY_LONGFORM` is imported by the 18 generated override pages and by
`scripts/upgrade-city-page.ts` — **never by the dynamic `/us/[state]/[city]` route**
(verified: 0 references in `page.tsx` and `CityPageClient.tsx`). A city with an
entry but no override renders nothing.

Splitting the 8 accordingly:

| City | Has override? | Ported |
|---|---|---|
| boston | ✅ | ✅ |
| dallas | ✅ | ✅ |
| houston | ✅ | ✅ |
| miami | ✅ | ✅ |
| worcester | ❌ | **held** |
| lowell | ❌ | **held** |
| charlotte | ❌ | **held** |
| columbus | ❌ | **held** |
| detroit | ✅ | n/a — nothing to port |

The fix for the four held cities is to generate overrides with
`scripts/upgrade-city-page.ts`. **That script reads the database, which this phase
forbids.** So the four cannot be ported, which means their prose has nowhere to
render, which means — under your own ordering rule — **their 12 redirects must not
go live.** They are excluded from `next.config.mjs` and left in the sitemap.

Porting followed the existing pattern exactly: verbatim text, HTML entities
(`&apos;` `&ndash;` `&amp;`) converted to real characters as the Chicago entry
does, source noted in a comment per city. Hero subtitles ("Professional at-home
blood draw services in Boston — request same-day…") were **not** ported; they are
page furniture, and no existing entry contains one.

**No conflicts** — none of the four canonical pages had competing prose. All four
had no `CITY_LONGFORM` entry at all before this change.

---

## Item 3 — redirects

90 entries added after items 1 and 2, in a single block with a comment explaining
the tier, the port-then-redirect ordering, the parent-city mappings and the four
exclusions. The existing 14 redirects were not touched.

Validated by loading the config directly:

```
total redirect rules:              109
legacy-pattern rules:               94   (90 new + 4 pre-existing)
all permanent:                      true
destinations not /us/:                 0
held cities present (expect 0):        0
```

`layout.tsx` files on redirected pages were left alone. A 308 fires before the
route renders, so their self-canonical tags are now unreachable — removing them
would be a no-op.

Redirected page directories were **not** deleted. Redirects fire first, so this is
tidiness rather than correctness; Phase 1 §9 step 5 marked it optional.

---

## Item 4 — sitemap

90 legacy entries removed, 12 retained. Metro filtering untouched.

**Deviation from your verification criterion.** You asked for zero legacy-pattern
URLs. The generated sitemap has **12** — the held cities, which still serve 200 and
must stay submitted until they are redirected. Submitting them is correct; removing
them while they still resolve would orphan four ranking pages.

---

## Verification output

**Build** — `npx next build`, exit 0, 993/993 static pages.

The first attempt failed with two provider-page export errors. Root cause was
Neon-side, not code: `PostgresError 53200: out of memory` under concurrent static
generation. A clean retry passed. Worth knowing it can recur on a cold build.

**10 legacy URLs as Googlebot** (local production server):

```
/boston-ma/mobile-phlebotomy         308 -> /us/massachusetts/boston      dest:200
/dallas-tx/in-home-blood-draw        308 -> /us/texas/dallas              dest:200
/miami-fl/blood-draw-at-home         308 -> /us/florida/miami             dest:200
/houston-tx/mobile-phlebotomy        308 -> /us/texas/houston             dest:200
/manhattan-ny/mobile-phlebotomy      308 -> /us/new-york/new-york         dest:200
/queens-ny/in-home-blood-draw        308 -> /us/new-york/new-york         dest:200
/beverly-hills-ca/mobile-phlebotomy  308 -> /us/california/los-angeles    dest:200
/troy-mi/blood-draw-at-home          308 -> /us/michigan/detroit          dest:200
/bayonne-nj/mobile-phlebotomy        308 -> /us/new-jersey/jersey-city    dest:200
/detroit-mi/mobile-phlebotomist      308 -> /us/michigan/detroit          dest:200
```

**Ported prose in rendered HTML:**

```
/us/massachusetts/boston   'Longwood Medical Area'    RENDERS
/us/texas/dallas           'Medical City Healthcare'  RENDERS
/us/texas/houston          'Texas Medical Center'     RENDERS
/us/florida/miami          'Cleveland Clinic Florida' RENDERS
```

**Held cities still serve** (must not 308 yet):

```
/worcester-ma/mobile-phlebotomy  200
/lowell-ma/mobile-phlebotomy     200
/charlotte-nc/mobile-phlebotomy  200
/columbus-oh/mobile-phlebotomy   200
```

**Generated sitemap:**

```
total URLs                1328
legacy-pattern              12   (the 4 held cities x 3 slugs)
metro URLs                   2   /us/metro/new-york-city, /us/metro/washington-dc
```

Metro tier unchanged, as required.

---

## Constraint conflict, disclosed

Your constraints forbid "any database read or write", while the verification step
requires `npm run build`. This codebase's build performs read-only Neon queries
during static generation (sitemap, provider pages, the 18 overrides) and cannot be
run without them. I treated the constraint's intent as *no writes and no mutating
scripts* and ran the build.

**No write of any kind occurred in this phase.** No script was run against Neon,
Vercel or Stripe. All city structure was read from `data/cities-full.ts`.

---

## Out-of-scope items — confirmed untouched

- No new longform written for any city outside the ported set.
- The 18 static overrides were not edited.
- Metro routes, canonicals and sitemap filtering unchanged.
- No `layout.tsx` changes.
- City page template and styling unchanged.

---

## Recommended follow-up (not done)

1. **Decide Manhattan/Queens** — add the two `CITY_MAPPING` entries, or keep the
   fold to `/us/new-york/new-york` as staged.
2. **Phase 3 for the 4 held cities** — needs a database connection: generate
   overrides via `scripts/upgrade-city-page.ts`, port the prose, add the 12
   redirects, remove the 12 sitemap entries.
3. **Repoint the 13 homepage legacy links** (plus `SearchContent.tsx`,
   `StatePageClient.tsx`, `app/us/metro/[metro]/page.tsx`) at canonical `/us/`
   URLs. Phase 1 §4 flagged these and they were **not** in Phase 2's approved
   scope — they now all point into 308s, which works but wastes link equity.

---

## Stopped as instructed

Staged with `git add`. Not committed. Not pushed. Not deployed.
