import { prisma } from '@/lib/prisma'
import ConfirmClient from './ConfirmClient'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Patient-facing confirmation page.
 *
 * Server shell resolves the token so the page renders its real state in the
 * HTML rather than flashing a loading state and then correcting itself. The
 * patient arrives here from an email, on a phone, intending to press one
 * button — anything that makes them wait costs a response.
 */
export const metadata = {
  title: 'Confirm your blood draw',
  // Never indexed: the URL is a single-use token tied to one person's request.
  robots: { index: false, follow: false },
}

export default async function ConfirmPage({
  params,
}: {
  params: { token: string }
}) {
  const lead = await prisma.lead.findUnique({
    where: { patientOutcomeToken: params.token },
    select: { fullName: true, patientOutcome: true },
  })

  // An unknown token and a malformed one look identical from here. The page
  // must not reveal whether a given token corresponds to a real request.
  if (!lead) {
    return (
      <Shell>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
          This link isn&apos;t valid
        </h1>
        <p style={{ margin: 0, color: '#4b5563' }}>
          It may have expired or been mistyped. If you received this from us and
          it isn&apos;t working, just reply to that email and we&apos;ll sort it out.
        </p>
      </Shell>
    )
  }

  if (lead.patientOutcome) {
    return (
      <Shell>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
          Thanks — we already have your response
        </h1>
        <p style={{ margin: 0, color: '#4b5563' }}>
          You told us the draw{' '}
          <strong>
            {lead.patientOutcome === 'COMPLETED' ? 'was completed' : "didn't happen"}
          </strong>
          . Nothing else is needed.
        </p>
      </Shell>
    )
  }

  const firstName = (lead.fullName || '').trim().split(/\s+/)[0] || ''

  return (
    <Shell>
      <ConfirmClient token={params.token} firstName={firstName} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: '#f9fafb',
        padding: '48px 16px',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 24,
          color: '#111827',
          lineHeight: 1.6,
        }}
      >
        {children}
        <p style={{ marginTop: 24, marginBottom: 0, fontSize: 12, color: '#9ca3af' }}>
          MobilePhlebotomy.org
        </p>
      </div>
    </main>
  )
}
