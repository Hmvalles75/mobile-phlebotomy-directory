# Deferred GA4 cleanups

Tracking events that are queued for removal but **must not be deployed
until explicitly approved**. The blocker each time is a different
measurement window we don't want to perturb with simultaneous changes.

---

## Remove redundant `lead_form_start` event

**Status:** Approved in concept by Hector 2026-05-22.
**Blocker:** Wait until the post-CTA-copy-change measurement window closes.
Hector will say when.

### Why

Our manual `lead_form_start` event (fired when the user touches the first
field of the lead form) duplicates GA4's built-in `form_start` event from
Enhanced Measurement. Both fire on the same trigger; only the param shape
differs. Keeping both is just analytics clutter.

### Files to change

1. **`lib/ga4.ts`** — delete the `leadFormStart` helper (currently around
   lines 79–81):
   ```ts
   leadFormStart: (params?: { first_field?: string }) => {
     trackEvent('lead_form_start', params)
   },
   ```

2. **`components/ui/LeadFormModal.tsx`** — delete the `ga4.leadFormStart(...)`
   call inside `handleChange` (currently around line 61) and the
   `formStarted` state machine that gates it. Currently:
   ```ts
   const [formStarted, setFormStarted] = useState(false)
   // ...
   if (!formStarted && value.trim().length > 0) {
     setFormStarted(true)
     ga4.leadFormStart({ first_field: name })
   }
   ```
   Remove all three: the state hook, the conditional, and the call.

3. **Search for any other callers** before removing — run:
   ```
   grep -rn "leadFormStart\|lead_form_start" --include='*.tsx' --include='*.ts'
   ```
   and confirm only the two files above remain.

### Why the delay

We're measuring the conversion impact of the routing-transparent CTA copy
change shipped 2026-05-21 (commit `b59aa8d`). If we also remove a tracking
event in the same measurement window, we've introduced two variables and
can't attribute any conversion-rate change cleanly to the copy.

The intent is to:
1. Hold for 30–45 days of clean post-copy-change data
2. Then remove `lead_form_start` and rely on GA4's automatic `form_start`

Hector will signal when the measurement window has closed. **Do not
deploy without that explicit go-ahead.**

### What GA4 dashboards will need updating after removal

Any funnel or report that references `lead_form_start` will need to be
re-pointed to GA4's automatic `form_start` event. Search GA4 explorations
and audiences for that string before deploying.
