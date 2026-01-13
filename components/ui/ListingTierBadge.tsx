interface ListingTierBadgeProps {
  tier: 'BASIC' | 'PREMIUM' | 'FEATURED'
  isFeaturedCity?: boolean
}

export function ListingTierBadge({ tier, isFeaturedCity }: ListingTierBadgeProps) {
  // Don't show badge for basic tier
  if (tier === 'BASIC') {
    return null
  }

  if (tier === 'FEATURED' || isFeaturedCity) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-md border-2 border-yellow-600">
        ⭐ FEATURED SPONSOR
      </span>
    )
  }

  if (tier === 'PREMIUM') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 border border-primary-300">
        ✓ Premium Partner
      </span>
    )
  }

  return null
}
