/**
 * Single suppression check for every provider-facing send.
 *
 * A provider must never be contacted once their listing is removed
 * (`removedAt` set) or they have turned off notifications
 * (`notifyEnabled = false`). Before this existed each recipient query
 * re-implemented its own filter, and the recruitment blast in
 * lib/notifyProvider.ts had none at all — it selected on
 * `eligibleForLeads: false`, which is exactly what a removal sets, so removing
 * a provider moved them *into* the blast's target list.
 *
 * Use both layers:
 *   1. NOTIFIABLE_WHERE in the Prisma `where`, so the DB never returns them.
 *   2. `.filter(canNotify)` immediately before the send loop, so a query that
 *      later loses its where-clause still cannot send.
 *
 * The generic is constrained to NotifyGuardFields on purpose: a `select` that
 * omits `removedAt` or `notifyEnabled` is a compile error rather than a filter
 * that silently passes everyone.
 */

export interface NotifyGuardFields {
  removedAt: Date | null
  notifyEnabled: boolean
}

/** True only when the provider is still listed and still accepts notifications. */
export function canNotify<T extends NotifyGuardFields>(provider: T): boolean {
  if (provider.removedAt !== null && provider.removedAt !== undefined) return false
  if (provider.notifyEnabled === false) return false
  return true
}

/**
 * Prisma `where` fragment matching canNotify(). Spread into a provider query:
 *   where: { ...NOTIFIABLE_WHERE, eligibleForLeads: true }
 */
export const NOTIFIABLE_WHERE = {
  removedAt: null,
  notifyEnabled: true,
} as const

/**
 * Spread into a `select` so the guard fields are present for canNotify().
 */
export const NOTIFY_GUARD_SELECT = {
  removedAt: true,
  notifyEnabled: true,
} as const

/**
 * Reports who was dropped, for logging. Keeps blast scripts honest about how
 * many recipients a guard removed instead of silently shrinking the list.
 */
export function partitionNotifiable<T extends NotifyGuardFields & { name?: string; email?: string | null }>(
  providers: T[]
): { allowed: T[]; suppressed: T[] } {
  const allowed: T[] = []
  const suppressed: T[] = []
  for (const p of providers) (canNotify(p) ? allowed : suppressed).push(p)
  return { allowed, suppressed }
}
