interface ListingTierBadgeProps {
  tier: 'BASIC' | 'PREMIUM' | 'FEATURED'
  isFeaturedCity?: boolean
  isFeatured?: boolean
}

export function ListingTierBadge({ tier, isFeaturedCity, isFeatured }: ListingTierBadgeProps) {
  // Show yellow "Featured Partner" badge for FEATURED tier, PREMIUM tier, isFeatured flag, or city-featured providers
  if (tier === 'FEATURED' || tier === 'PREMIUM' || isFeatured || isFeaturedCity) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-md border-2 border-yellow-600">
        ⭐ Featured Partner
      </span>
    )
  }

  return null
}
