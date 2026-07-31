/**
 * Provider roster — the per-provider companion to lib/coverage-map.ts.
 *
 * coverage-map answers "which metros do I cover?"; this answers "who are my
 * providers, where do they reach, and are they actually working the leads?"
 * Both read live from the provider table, so the admin table updates itself as
 * providers are added, activated, paused, or start/stop converting.
 *
 * Activity is aggregated with four groupBy queries rather than per-provider
 * counts, so the page stays one round-trip regardless of roster size.
 */
import { prisma } from './prisma'
import { reachesMetro, passesNotificationGate, type CoverageProvider } from './coverage-map'
import { topMetroAreas } from '../data/top-metros'

const ACTIVITY_WINDOW_DAYS = 90

export interface RosterRow {
  id: string
  name: string
  slug: string

  // Contact
  email: string | null          // the address leads actually go to
  allEmails: string[]           // every distinct address on the record
  phone: string | null
  website: string | null

  // Tier / billing
  listingTier: string | null
  featuredTier: string | null
  isFeatured: boolean
  priorityRouting: boolean
  paying: boolean               // priorityRouting is the paid-customer marker
  stripeCustomerId: string | null

  // Routing eligibility
  eligibleForLeads: boolean
  notifyEnabled: boolean
  status: string | null
  onboardingStatus: string | null
  claimed: boolean
  routable: boolean             // passes the account-level notification gate
  // Activated by hand but missing the email the router needs — they look live
  // in the provider table and silently receive nothing.
  blockedNoEmail: boolean

  // Coverage
  primaryCity: string | null
  primaryState: string | null
  serviceRadiusMiles: number | null
  primaryZip: string | null
  zipCount: number
  coverageStates: string[]
  metrosReached: string[]       // top-50 metros this provider's radius reaches

  // Activity (last ACTIVITY_WINDOW_DAYS)
  notifications: number
  claims: number
  completions: number
  claimRate: number | null      // claims / notifications
  lastClaimAt: string | null    // all-time, not windowed — for dormancy
  staleReleaseCount: number

  createdAt: string
}

export interface RosterSummary {
  total: number
  routable: number
  paying: number
  dormant: number               // routable, got notifications, zero claims in window
  blockedNoEmail: number        // activated but unroutable for lack of an email
}

function firstZip(zipCodes: string | null): string | null {
  if (!zipCodes) return null
  const z = zipCodes.split(',').map(s => s.trim()).filter(s => s.length >= 5)
  return z[0] || null
}

export async function getProviderRoster(): Promise<{
  rows: RosterRow[]
  summary: RosterSummary
  windowDays: number
}> {
  const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const [providers, notifAgg, claimAgg, completeAgg, lastClaimAgg] = await Promise.all([
    prisma.provider.findMany({
      where: { removedAt: null },
      select: {
        id: true, name: true, slug: true,
        email: true, claimEmail: true, notificationEmail: true,
        phone: true, phonePublic: true, website: true,
        listingTier: true, featuredTier: true, isFeatured: true, priorityRouting: true,
        stripeCustomerId: true,
        eligibleForLeads: true, notifyEnabled: true, status: true, onboardingStatus: true,
        claimVerifiedAt: true,
        primaryCity: true, primaryState: true, zipCodes: true, serviceRadiusMiles: true,
        smsOptInAt: true, smsOptOutAt: true,
        staleReleaseCount: true, createdAt: true,
        coverage: { select: { state: { select: { abbr: true } } } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.leadNotification.groupBy({
      by: ['providerId'],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.lead.groupBy({
      by: ['routedToId'],
      _count: { _all: true },
      where: { claimedAt: { gte: since } },
    }),
    prisma.lead.groupBy({
      by: ['routedToId'],
      _count: { _all: true },
      where: { completedAt: { gte: since } },
    }),
    prisma.lead.groupBy({
      by: ['routedToId'],
      _max: { claimedAt: true },
      where: { claimedAt: { not: null } },
    }),
  ])

  const notifMap = new Map(notifAgg.map(n => [n.providerId, n._count._all]))
  const claimMap = new Map(claimAgg.map(c => [c.routedToId, c._count._all]))
  const doneMap = new Map(completeAgg.map(c => [c.routedToId, c._count._all]))
  const lastClaimMap = new Map(lastClaimAgg.map(c => [c.routedToId, c._max.claimedAt]))

  const rows: RosterRow[] = providers.map(p => {
    const cov: CoverageProvider = {
      ...p,
      phonePublic: p.phonePublic,
      coverageStates: p.coverage.map(c => c.state.abbr),
    } as CoverageProvider

    const metrosReached = topMetroAreas
      .filter(m => reachesMetro(cov, m))
      .map(m => `${m.city}, ${m.stateAbbr}`)
    // Account-level, NOT metro-scoped — a provider serving a smaller market is
    // still fully routable there even though metrosReached is empty.
    const routable = passesNotificationGate(cov)

    const notifications = notifMap.get(p.id) ?? 0
    const claims = claimMap.get(p.id) ?? 0
    const lastClaim = lastClaimMap.get(p.id) ?? null

    const allEmails = Array.from(
      new Set([p.notificationEmail, p.claimEmail, p.email].filter(Boolean) as string[])
    )

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,

      email: p.notificationEmail || p.claimEmail || p.email,
      allEmails,
      phone: p.phonePublic || p.phone,
      website: p.website,

      listingTier: p.listingTier,
      featuredTier: p.featuredTier,
      isFeatured: p.isFeatured,
      priorityRouting: p.priorityRouting,
      paying: p.priorityRouting,
      stripeCustomerId: p.stripeCustomerId,

      eligibleForLeads: p.eligibleForLeads,
      notifyEnabled: p.notifyEnabled,
      status: p.status,
      onboardingStatus: p.onboardingStatus,
      claimed: !!p.claimVerifiedAt,
      routable,
      blockedNoEmail: p.eligibleForLeads && p.notifyEnabled && allEmails.length === 0,

      primaryCity: p.primaryCity,
      primaryState: p.primaryState,
      serviceRadiusMiles: p.serviceRadiusMiles,
      primaryZip: firstZip(p.zipCodes),
      zipCount: (p.zipCodes || '').split(',').map(s => s.trim()).filter(Boolean).length,
      coverageStates: cov.coverageStates,
      metrosReached,

      notifications,
      claims,
      completions: doneMap.get(p.id) ?? 0,
      claimRate: notifications > 0 ? claims / notifications : null,
      lastClaimAt: lastClaim ? lastClaim.toISOString() : null,
      staleReleaseCount: p.staleReleaseCount,

      createdAt: p.createdAt.toISOString(),
    }
  })

  const summary: RosterSummary = {
    total: rows.length,
    routable: rows.filter(r => r.routable).length,
    paying: rows.filter(r => r.paying).length,
    // "Dormant" = we sent them work and they did nothing with it. This is the
    // recruitment/pruning signal, not raw inactivity.
    dormant: rows.filter(r => r.routable && r.notifications > 0 && r.claims === 0).length,
    blockedNoEmail: rows.filter(r => r.blockedNoEmail).length,
  }

  return { rows, summary, windowDays: ACTIVITY_WINDOW_DAYS }
}
