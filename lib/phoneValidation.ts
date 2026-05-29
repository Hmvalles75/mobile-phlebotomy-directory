// Shared US phone validation + normalization. Used by both the server-side
// lead submit route (the hard gate) and the client-side forms (immediate UX
// feedback). Keeping a single source of truth prevents client/server drift
// where one accepts a number the other rejects.

export function digitsOnly(s: string | null | undefined): string {
  return (s || '').replace(/\D/g, '')
}

/** A valid US number is 10 digits, or 11 with a leading country-code 1. */
export function isValidUSPhone(s: string | null | undefined): boolean {
  const d = digitsOnly(s)
  return d.length === 10 || (d.length === 11 && d.startsWith('1'))
}

/** Normalize to a consistent (XXX) XXX-XXXX display shape. Assumes valid input. */
export function normalizeUSPhone(s: string): string {
  const d = digitsOnly(s)
  const ten = d.length === 11 ? d.slice(1) : d
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`
}

export const PHONE_VALIDATION_MESSAGE = 'Enter a valid 10-digit US phone number'
