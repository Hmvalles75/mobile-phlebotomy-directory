// Server-only strict US number check (libphonenumber-js with full metadata).
//
// lib/phoneValidation.ts only checks shape (10 digits, or 11 with a leading 1)
// because it is shared with the client bundle. That lets numbers with an area
// code that does not exist through: Geraldine Wong 2026-06-09 submitted
// (180) 878-2649 four times, Margaret Bambury 2026-07-28 submitted
// (191) 731-9147 and the claiming provider logged WRONG_NUMBER. Both are a
// real patient dropping a digit after a leading "1"; the form accepted it, so
// nobody could call them back.
//
// The check runs on the submit route only. Replayed over the 735 leads since
// 2026-03-01 it rejects 10: those two patients (5 rows), 3 pre-validation rows
// where the phone field held a name, and 2 rows with 8/11-digit typos. No
// working number is rejected. Metadata is passed explicitly: the package's
// default entry fails to load its metadata under tsx/ESM.
import { isValidPhoneNumber } from 'libphonenumber-js/core'
import metadata from 'libphonenumber-js/metadata.max.json'
import { digitsOnly } from './phoneValidation'

/** True when the number is a possible, assigned US number (area code + exchange in the plan). */
export function isAssignedUSNumber(s: string | null | undefined): boolean {
  const d = digitsOnly(s)
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d
  if (ten.length !== 10) return false
  try {
    return isValidPhoneNumber(ten, 'US', metadata as any)
  } catch {
    // Never let a library fault block a submission.
    return true
  }
}

export const UNASSIGNED_NUMBER_MESSAGE =
  "That doesn't look like a working US number — please check the area code (the first three digits) and try again."
