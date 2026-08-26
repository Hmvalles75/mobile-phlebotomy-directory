/**
 * Coverage map — answers "where do I have provider coverage?" for the admin
 * dashboard. Computed live from the provider table so it updates automatically
 * as providers are added / activated / paused.
 *
 * IMPORTANT: the matching logic here MIRRORS the real lead-routing predicates so
 * the dashboard reflects what *actually* happens when a lead lands, not a looser
 * heuristic. Two routing paths exist in production:
 *
 *   1. Email notification (primary path) — lib/leadNotifications.ts
 *      findFeaturedProvidersForNotification(): notifyEnabled AND
 *      (isFeatured OR (eligibleForLeads AND status=VERIFIED)), has email,
 *      in-state, ZIP radius/explicit match.  ←  "notifiable" below
 *
 *   2. SMS claim offer — lib/optedInRouting.ts
 *      findOptedInProviders(): eligibleForLeads, smsOptInAt set, not opted out,
 *      onboardingStatus ACTIVE, has phone, ZIP radius match.  ←  "smsRoutable"
 *
 * If either of those predicates changes, update this file to match (there is no
 * shared predicate yet — see project memory on the schema/routing audit).
 */
import { prisma } from './prisma'
import { isLeadInServiceRadius } from './zip-geocode'
import { topMetroAreas, type MetroArea } from '../data/top-metros'

const DEFAULT_RADIUS_MILES = 25

export interface CoverageProvider {
  id: string
  name: string
  notifyEnabled: boolean
  isFeatured: boolean
  eligibleForLeads: boolean
  status: string | null
  notificationEmail: string | null
  claimEmail: string | null
  email: string | null
  zipCodes: string | null
  serviceRadiusMiles: number | null
  primaryState: string | null
  priorityRouting: boolean
  featuredTier: string | null
  listingTier: string | null
  // SMS path
  smsOptInAt: Date | null
  smsOptOutAt: Date | null
  onboardingStatus: string | null
  phonePublic: string | null
  coverageStates: string[]
}

export interface MetroCoverage {
  metro: MetroArea
  notifiable: number      // providers who'd be EMAILED a lead here (real primary coverage)
  paying: number          // of notifiable, those with priorityRouting (paying customers)
  smsRoutable: number     // providers who'd get an SMS claim offer here
  tier: 'covered' | 'thin' | 'gap'  // covered = 3+, thin = 1-2, gap = 0 notifiable
  topProviders: { name: string; paying: boolean }[]
}

/** Does a provider's ZIP config reach `targetZip` (radius from primary OR explicit match)? */
function zipReaches(p: CoverageProvider, targetZip: string): boolean {
  if (!p.zipCodes) return false
  const serviceZips = p.zipCodes.split(',').map(z => z.trim()).filter(z => z.length >= 5)
  if (serviceZips.length === 0) return false

  const primaryZip = serviceZips[0]
  const radius = p.serviceRadiusMiles || DEFAULT_RADIUS_MILES
  if (isLeadInServiceRadius(primaryZip, targetZip, radius)) return true

  // Explicit ZIP matches (exact / wildcard / range) — mirrors leadNotifications.ts
  return serviceZips.some(serviceZip => {
    if (serviceZip === targetZip) return true
    if (serviceZip.includes('*')) {
      const prefix = serviceZip.replace('*', '')
      return targetZip.startsWith(prefix)
    }
    if (serviceZip.includes('-') && !serviceZip.startsWith('-')) {
      const [start, end] = serviceZip.split('-').map(z => z.trim())
      if (start.length >= 5 && end.length >= 5) return targetZip >= start && targetZip <= end
    }
    return false
  })
}

/** A provider "covers" a metro if they reach ANY of the metro's representative ZIPs. */
export function reachesMetro(p: CoverageProvider, metro: MetroArea): boolean {
  return metro.zipCodes.some(z => zipReaches(p, z))
}

/**
 * The provider-level half of findFeaturedProvidersForNotification() — the
 * account gate, with no geography applied. True means "this provider is in a
 * state where they can receive lead emails at all"; whether they get a
 * *particular* lead is then a question of ZIP reach.
 *
 * Kept separate from isNotifiable() because a provider can be perfectly
 * routable for their own market while reaching none of the top-50 metros
 * (e.g. a Fort Myers provider). Treating "reaches a big metro" as the
 * routability test wrongly marks those providers dead.
 */
export function passesNotificationGate(p: CoverageProvider): boolean {
  if (!p.notifyEnabled) return false
  if (!(p.isFeatured || (p.eligibleForLeads && p.status === 'VERIFIED'))) return false
  if (!(p.notificationEmail || p.claimEmail || p.email)) return false
  // Needs at least one usable ZIP, or there is nothing to match a lead against.
  const zips = (p.zipCodes || '').split(',').map(z => z.trim()).filter(z => z.length >= 5)
  return zips.length > 0
}

/**
 * Mirrors findFeaturedProvidersForNotification() — the primary (email) routing path.
 *
 * The same-state precondition was dropped here on 2026-08-24 to stay in step
 * with that function, which no longer consults state at all: a ZIP list names
 * the places a provider actually works, and gating it behind a state row broke
 * every metro spanning a state line. This map exists to tell us what routing
 * really does, so it has to move whenever routing moves.
 */
export function isNotifiable(p: CoverageProvider, metro: MetroArea): boolean {
  if (!passesNotificationGate(p)) return false
  return reachesMetro(p, metro)
}

/** Mirrors findOptedInProviders() — the SMS claim-offer path. */
function isSmsRoutable(p: CoverageProvider, metro: MetroArea): boolean {
  if (!p.eligibleForLeads) return false
  if (!p.smsOptInAt || p.smsOptOutAt) return false
  if (p.onboardingStatus !== 'ACTIVE') return false
  if (!p.phonePublic) return false
  return reachesMetro(p, metro)
}

export async function getCoverageMap(): Promise<{
  metros: MetroCoverage[]
  totalActiveProviders: number
}> {
  const rows = await prisma.provider.findMany({
    where: { removedAt: null },
    select: {
      id: true, name: true,
      notifyEnabled: true, isFeatured: true, eligibleForLeads: true, status: true,
      notificationEmail: true, claimEmail: true, email: true,
      zipCodes: true, serviceRadiusMiles: true, primaryState: true,
      priorityRouting: true, featuredTier: true, listingTier: true,
      smsOptInAt: true, smsOptOutAt: true, onboardingStatus: true, phonePublic: true,
      coverage: { select: { state: { select: { abbr: true } } } },
    },
  })

  const providers: CoverageProvider[] = rows.map(r => ({
    ...r,
    coverageStates: r.coverage.map(c => c.state.abbr),
  }))

  // De-dupe metros by slug (top-metros.ts has a couple of repeats e.g. Detroit/Miami)
  const seen = new Set<string>()
  const uniqueMetros = topMetroAreas.filter(m => {
    if (seen.has(m.slug)) return false
    seen.add(m.slug)
    return true
  })

  const metros: MetroCoverage[] = uniqueMetros.map(metro => {
    const notifiableProviders = providers.filter(p => isNotifiable(p, metro))
    const smsRoutable = providers.filter(p => isSmsRoutable(p, metro)).length
    const paying = notifiableProviders.filter(p => p.priorityRouting).length
    const notifiable = notifiableProviders.length
    return {
      metro,
      notifiable,
      paying,
      smsRoutable,
      tier: notifiable >= 3 ? 'covered' : notifiable >= 1 ? 'thin' : 'gap',
      topProviders: notifiableProviders
        .sort((a, b) => Number(b.priorityRouting) - Number(a.priorityRouting))
        .slice(0, 5)
        .map(p => ({ name: p.name, paying: p.priorityRouting })),
    }
  })

  const totalActiveProviders = providers.filter(p => p.eligibleForLeads).length

  return { metros, totalActiveProviders }
}
