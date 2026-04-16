/**
 * Featured tier utilities — rank providers and display tier-specific badges.
 */

export type FeaturedTier = 'HIGH_DENSITY' | 'STANDARD_PREMIUM' | 'FOUNDING_PARTNER' | null | undefined

// Higher number = higher priority (sorted first, notified first)
export function tierRank(tier: FeaturedTier): number {
  switch (tier) {
    case 'HIGH_DENSITY': return 3
    case 'STANDARD_PREMIUM': return 2
    case 'FOUNDING_PARTNER': return 1
    default: return 0
  }
}

// Priority delay (seconds) — how long non-premium providers wait before they get notified.
// HIGH_DENSITY gets the 60-second head start.
export function notificationDelaySeconds(tier: FeaturedTier): number {
  switch (tier) {
    case 'HIGH_DENSITY': return 0          // Immediate
    case 'STANDARD_PREMIUM': return 60     // 60-second delay
    case 'FOUNDING_PARTNER': return 60     // 60-second delay
    default: return 60                      // All other featured providers also wait
  }
}

export interface TierBadge {
  label: string
  icon: string
  gradient: string    // Tailwind gradient classes
  textColor: string
  shadow: string
}

export function getTierBadge(tier: FeaturedTier): TierBadge {
  switch (tier) {
    case 'HIGH_DENSITY':
      return {
        label: 'Premium Featured',
        icon: '\uD83D\uDC51', // 👑 crown
        gradient: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500',
        textColor: 'text-white',
        shadow: 'shadow-lg shadow-amber-500/50',
      }
    case 'STANDARD_PREMIUM':
      return {
        label: 'Premium Provider',
        icon: '\u2B50', // ⭐
        gradient: 'bg-gradient-to-r from-purple-600 to-indigo-600',
        textColor: 'text-white',
        shadow: 'shadow-md',
      }
    case 'FOUNDING_PARTNER':
      return {
        label: 'Founding Partner',
        icon: '\u2B50', // ⭐
        gradient: 'bg-gradient-to-r from-slate-800 to-slate-900 border border-amber-400',
        textColor: 'text-white',
        shadow: 'shadow-md',
      }
    default:
      return {
        label: 'Featured Provider',
        icon: '\u2B50', // ⭐
        gradient: 'bg-gradient-to-r from-purple-500 to-blue-500',
        textColor: 'text-white',
        shadow: 'shadow-md',
      }
  }
}

/**
 * Sort featured providers by tier (HIGH_DENSITY first), then alphabetically by name.
 */
export function sortByTier<T extends { featuredTier?: string | null, name: string }>(providers: T[]): T[] {
  return [...providers].sort((a, b) => {
    const rankDiff = tierRank(b.featuredTier as FeaturedTier) - tierRank(a.featuredTier as FeaturedTier)
    if (rankDiff !== 0) return rankDiff
    return a.name.localeCompare(b.name)
  })
}
