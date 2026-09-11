import { PrismaClient } from '@prisma/client'
import { auditStamp } from './providerAudit'

/**
 * Shared Prisma client.
 *
 * Extended so that every write to `providers` carries an audit stamp
 * (auditActor, auditAt). The Postgres trigger in
 * scripts/sql/provider-change-log.sql reads the stamp to attribute the change;
 * see lib/providerAudit.ts. Writes made outside this client (scripts,
 * database tools) carry no fresh stamp and are logged as "db".
 */
function stamp<T extends { data?: any }>(args: T): T {
  const s = auditStamp()
  if (args && args.data && typeof args.data === 'object' && !Array.isArray(args.data)) {
    args.data = { ...args.data, ...s }
  }
  return args
}

function buildClient() {
  return new PrismaClient().$extends({
    name: 'providerAudit',
    query: {
      provider: {
        update({ args, query }) { return query(stamp(args)) },
        updateMany({ args, query }) { return query(stamp(args)) },
        create({ args, query }) { return query(stamp(args)) },
        upsert({ args, query }) {
          const s = auditStamp()
          args.create = { ...args.create, ...s }
          args.update = { ...args.update, ...s }
          return query(args)
        },
      },
    },
  })
}

type ExtendedClient = ReturnType<typeof buildClient>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedClient | undefined
}

export const prisma: ExtendedClient = globalForPrisma.prisma ?? buildClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
