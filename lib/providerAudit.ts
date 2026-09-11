/**
 * Provider change audit.
 *
 * Why: on 2026-09-04 nobody could say who re-enabled On Call Phlebotomy's
 * leads between May and July, and on 2026-09-06 a paying provider (Skilled
 * Labs) had silently stopped matching for weeks with no record of what
 * changed on their row. The admin PATCH route console.logged; Vercel keeps
 * that for a day. Edits made in the database tool logged nothing at all.
 *
 * How it works:
 *   - A Postgres trigger on `providers` (scripts/sql/provider-change-log.sql)
 *     writes one row to `provider_change_log` per tracked field that changed,
 *     on every UPDATE, whoever made it. Database-tool edits are captured too.
 *   - The app stamps `auditActor` and `auditAt` on every provider write via
 *     the Prisma extension in lib/prisma.ts. The trigger uses the stamped
 *     actor when `auditAt` changed in the same UPDATE and "db" otherwise, so
 *     a stale stamp can never be mis-attributed to a later manual edit.
 *   - Routes and crons name themselves with runAsActor(); anything that does
 *     not is stamped "app".
 *
 * Scripts run with their own PrismaClient (no extension) and therefore log
 * as "db", which is accurate: they are manual database edits.
 */
import { AsyncLocalStorage } from 'node:async_hooks'

export interface AuditContext {
  actor: string   // 'admin' | 'provider:<id>' | 'system:<job>' | 'webhook:<name>'
  source: string  // route or job name
}

const store = new AsyncLocalStorage<AuditContext>()

export function currentAuditContext(): AuditContext | undefined {
  return store.getStore()
}

/** Run `fn` with every provider write inside it attributed to `actor`. */
export function runAsActor<T>(actor: string, source: string, fn: () => Promise<T>): Promise<T> {
  // Await INSIDE the scope. Prisma queries are lazy and execute when awaited;
  // returning the bare promise would let the caller's await run it outside
  // the context and the stamp would read 'app'.
  return store.run({ actor, source }, async () => await fn())
}

/** Value stamped onto providers.auditActor; the trigger copies it into the log. */
export function auditStamp(): { auditActor: string; auditAt: Date } {
  const ctx = store.getStore()
  return { auditActor: ctx ? `${ctx.actor}|${ctx.source}` : 'app', auditAt: new Date() }
}

/** Fields the trigger diffs. Keep in sync with scripts/sql/provider-change-log.sql. */
export const TRACKED_PROVIDER_FIELDS = [
  'eligibleForLeads', 'notifyEnabled', 'isFeatured', 'priorityRouting', 'featuredTier', 'listingTier', 'status',
  'serviceRadiusMiles', 'zipCodes', 'primaryCity', 'primaryState',
  'email', 'notificationEmail', 'claimEmail', 'phonePublic',
  'removedAt', 'removedReason', 'leadsPausedAt', 'dormantWarnedAt', 'leadsResumedAt',
  'stripeCustomerId', 'onboardingStatus',
] as const
