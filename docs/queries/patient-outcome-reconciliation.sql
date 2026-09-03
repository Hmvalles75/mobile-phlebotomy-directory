-- Patient completion confirmation — reconciliation
--
-- Compares what the provider said happened against what the patient said
-- happened, per provider, plus one aggregate line.
--
-- Run around 2026-11-05, after ~60 days of collection. Reporting it earlier
-- means reading noise: at ~11 completions a month the per-provider rows need
-- time before any of them mean anything.
--
--   psql "$POSTGRES_URL_NON_POOLING" -f docs/queries/patient-outcome-reconciliation.sql
--
-- Column notes:
--
--   provider_silent    Leads the provider claimed and then logged NO outcome
--                      for at all. 56 of 286 claimed leads were in this state
--                      when the feature was built. These are NOT disagreement
--                      -- there is nothing to disagree with -- and folding them
--                      into the agreement rate would quietly punish providers
--                      who report honestly but late. Kept as its own column
--                      because it measures reporting discipline, which is most
--                      of the point.
--
--   no_patient_response
--                      Asked, never answered, more than 7 days ago. Derived
--                      rather than stored; there is no NO_RESPONSE enum value.
--
--   agreement_rate     Only over leads where BOTH sides said something. A
--                      provider with two answers and two agreements shows
--                      100%, so read it next to both_answered, never alone.

WITH scoped AS (
  SELECT
    l.id,
    p.name AS provider,
    p."primaryState" AS state,
    l.outcome,
    l."patientOutcome",
    l."outcomeRequestSentAt",
    -- The provider's claim, reduced to the same yes/no the patient answered.
    CASE
      WHEN l.outcome IS NULL THEN NULL
      WHEN l.outcome = 'APPOINTMENT_COMPLETED' THEN 'COMPLETED'
      ELSE 'NOT_COMPLETED'
    END AS provider_says
  FROM leads l
  JOIN providers p ON p.id = l."routedToId"
  WHERE l."claimedAt" IS NOT NULL
    AND l."outcomeRequestSentAt" IS NOT NULL
),
rolled AS (
  SELECT
    provider,
    state,
    COUNT(*)                                                       AS claimed_and_asked,
    COUNT(*) FILTER (WHERE outcome = 'APPOINTMENT_COMPLETED')      AS provider_says_completed,
    COUNT(*) FILTER (WHERE outcome IS NULL)                        AS provider_silent,
    COUNT(*) FILTER (WHERE "patientOutcome" = 'COMPLETED')         AS patient_says_completed,
    COUNT(*) FILTER (WHERE "patientOutcome" = 'NOT_COMPLETED')     AS patient_says_not_completed,
    COUNT(*) FILTER (
      WHERE "patientOutcome" IS NULL
        AND "outcomeRequestSentAt" < NOW() - INTERVAL '7 days'
    )                                                              AS no_patient_response,
    COUNT(*) FILTER (
      WHERE provider_says IS NOT NULL AND "patientOutcome" IS NOT NULL
    )                                                              AS both_answered,
    COUNT(*) FILTER (
      WHERE provider_says IS NOT NULL
        AND "patientOutcome" IS NOT NULL
        AND provider_says = "patientOutcome"::text
    )                                                              AS agreed
  FROM scoped
  GROUP BY provider, state
)
SELECT
  provider,
  state,
  claimed_and_asked,
  provider_says_completed,
  provider_silent,
  patient_says_completed,
  patient_says_not_completed,
  no_patient_response,
  both_answered,
  CASE WHEN both_answered = 0 THEN NULL
       ELSE ROUND(100.0 * agreed / both_answered, 1)
  END AS agreement_rate_pct
FROM rolled
ORDER BY claimed_and_asked DESC, provider;


-- Aggregate across all providers.
WITH scoped AS (
  SELECT
    l.outcome,
    l."patientOutcome",
    l."outcomeRequestSentAt",
    CASE
      WHEN l.outcome IS NULL THEN NULL
      WHEN l.outcome = 'APPOINTMENT_COMPLETED' THEN 'COMPLETED'
      ELSE 'NOT_COMPLETED'
    END AS provider_says
  FROM leads l
  JOIN providers p ON p.id = l."routedToId"
  WHERE l."claimedAt" IS NOT NULL
    AND l."outcomeRequestSentAt" IS NOT NULL
)
SELECT
  'ALL PROVIDERS'                                                AS provider,
  COUNT(*)                                                       AS claimed_and_asked,
  COUNT(*) FILTER (WHERE outcome = 'APPOINTMENT_COMPLETED')      AS provider_says_completed,
  COUNT(*) FILTER (WHERE outcome IS NULL)                        AS provider_silent,
  COUNT(*) FILTER (WHERE "patientOutcome" = 'COMPLETED')         AS patient_says_completed,
  COUNT(*) FILTER (WHERE "patientOutcome" = 'NOT_COMPLETED')     AS patient_says_not_completed,
  COUNT(*) FILTER (
    WHERE "patientOutcome" IS NULL
      AND "outcomeRequestSentAt" < NOW() - INTERVAL '7 days'
  )                                                              AS no_patient_response,
  COUNT(*) FILTER (
    WHERE provider_says IS NOT NULL AND "patientOutcome" IS NOT NULL
  )                                                              AS both_answered,
  CASE WHEN COUNT(*) FILTER (WHERE provider_says IS NOT NULL AND "patientOutcome" IS NOT NULL) = 0
       THEN NULL
       ELSE ROUND(
         100.0 * COUNT(*) FILTER (
           WHERE provider_says IS NOT NULL
             AND "patientOutcome" IS NOT NULL
             AND provider_says = "patientOutcome"::text
         ) / COUNT(*) FILTER (WHERE provider_says IS NOT NULL AND "patientOutcome" IS NOT NULL),
         1)
  END                                                            AS agreement_rate_pct,
  -- The headline the whole feature exists to produce.
  CASE WHEN COUNT(*) FILTER (WHERE "patientOutcome" IS NOT NULL) = 0 THEN NULL
       ELSE ROUND(
         100.0 * COUNT(*) FILTER (WHERE "patientOutcome" = 'COMPLETED')
         / COUNT(*) FILTER (WHERE "patientOutcome" IS NOT NULL), 1)
  END                                                            AS patient_confirmed_completion_pct
FROM scoped;
