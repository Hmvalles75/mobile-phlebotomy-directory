/**
 * Formats a phone number to (XXX) XXX-XXXX format
 * @param phone - Phone number string (can be various formats)
 * @returns Formatted phone number or original if invalid
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Handle different lengths
  if (cleaned.length === 10) {
    // Standard US number: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // US number with country code: +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length > 10) {
    // International or other format: keep original
    return phone
  } else if (cleaned.length === 7) {
    // Local number: XXX-XXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  }

  // Return original if we can't format it
  return phone
}
