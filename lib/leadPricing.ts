export const BASE_PRICING = {
  STANDARD: 2000, // $20
  STAT: 5000      // $50
} as const

export function priceFor(urgency: 'STANDARD' | 'STAT') {
  return urgency === 'STAT' ? BASE_PRICING.STAT : BASE_PRICING.STANDARD
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
