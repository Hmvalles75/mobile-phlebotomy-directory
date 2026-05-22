// Failed-contact outcomes: lead.outcome values that represent "provider could
// not connect with the patient." Distinct from declined/not-interested values
// where contact happened but didn't convert. Reporting queries that want to
// answer "how many leads never got a real conversation?" should aggregate over
// this whole bucket, not just NO_ANSWER.
//
// Membership reviewed 2026-05-22. See LeadOutcome enum in prisma/schema.prisma
// for the per-value semantic distinctions.
export const FAILED_CONTACT_OUTCOMES = [
  'NO_ANSWER',
  'VOICEMAIL',
  'BUSY_OR_DISCONNECTED',
  'WRONG_NUMBER',
  'INVALID_CONTACT_INFO',
  'UNABLE_TO_REACH',
] as const

export type FailedContactOutcome = (typeof FAILED_CONTACT_OUTCOMES)[number]
