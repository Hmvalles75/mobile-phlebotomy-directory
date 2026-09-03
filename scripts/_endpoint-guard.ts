import type { PrismaClient } from '@prisma/client'

/**
 * Refuse to run unless the database is the one the operator named.
 *
 * Written after a near-miss during this feature's build: `prisma db push` was
 * aimed at a Neon branch, the connection strings were in `.env.local` where
 * they had been asked for — and the Prisma CLI reads `.env`, not `.env.local`,
 * so the command targeted production instead. It was stopped by an unrelated
 * warning, not by anything that knew it was on the wrong database.
 *
 * The same trap caught a verification script minutes later, for a different
 * reason: ES imports are hoisted, so `@prisma/client` auto-loads `.env` before
 * `dotenv.config({ path: '.env.local' })` ever runs, and dotenv will not
 * overwrite a variable that is already set. The script reported the branch was
 * fine while reading production.
 *
 * Both failures share a shape. The connection came from somewhere other than
 * where the operator was looking, and nothing on screen said which database
 * was about to be written to. Printing the endpoint fixes the reporting half.
 * Requiring it to be declared up front fixes the rest: you cannot run a
 * destructive script without saying which database you believe you are on, and
 * being wrong stops the script instead of the data.
 *
 * Neon exposes `neon.endpoint_id`, which differs per branch even though every
 * branch reports the same database name — so it is the only value here that
 * actually distinguishes production from a copy of it.
 */

export interface EndpointGuardOptions {
  /** The endpoint the caller asserts they are on, e.g. "ep-cool-surf-a4vqw8lh". */
  expected: string
  /** Shown in the banner, e.g. "PRODUCTION" or "branch patient-confirmation". */
  label?: string
}

export async function assertEndpoint(
  prisma: PrismaClient,
  { expected, label }: EndpointGuardOptions
): Promise<string> {
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT current_setting('neon.endpoint_id', true) AS ep, current_database() AS db`
  )
  const endpoint: string = rows[0]?.ep ?? ''
  const db: string = rows[0]?.db ?? '?'

  console.log(`  database:  ${db}`)
  console.log(`  endpoint:  ${endpoint || '(not a Neon connection)'}`)
  console.log(`  expected:  ${expected}${label ? `  (${label})` : ''}`)

  if (!endpoint) {
    throw new Error(
      'Could not read neon.endpoint_id. Refusing to run — this may not be the database you think it is.'
    )
  }
  if (endpoint !== expected) {
    throw new Error(
      `WRONG DATABASE. Connected to "${endpoint}" but --endpoint said "${expected}". Nothing was written.`
    )
  }

  console.log('  endpoint confirmed\n')
  return endpoint
}

/** Reads a required `--flag value` from argv. */
export function requireArg(flag: string, argv = process.argv): string {
  const i = argv.indexOf(flag)
  const v = i >= 0 ? argv[i + 1] : undefined
  if (!v || v.startsWith('--')) {
    throw new Error(`Missing required argument: ${flag} <value>`)
  }
  return v
}

/** Reads an optional `--flag value` from argv. */
export function optionalArg(flag: string, argv = process.argv): string | null {
  const i = argv.indexOf(flag)
  const v = i >= 0 ? argv[i + 1] : undefined
  return v && !v.startsWith('--') ? v : null
}
