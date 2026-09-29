/**
 * Recent work (2026-09-29): anonymized proof for institutional buyers, placed
 * directly above the intake form on the corporate, event staffing,
 * partnership and request-coverage pages. The clinical-trials page keeps its
 * own longer case study and does not use this.
 *
 * Every entry is a client who paid and was served. Inquiries, quotes and lost
 * deals never go here. Clients are not named: research and healthcare buyers
 * need to consent in writing first (see the permission ask to the
 * Philadelphia PI). Copy is fixed; do not paraphrase.
 *
 * NETWORK_AGREEMENTS is the count of providers with
 * Provider.networkAgreementSignedAt set. Source of record:
 * docs/findings/network-agreements.csv, applied by
 * scripts/set-network-agreement.ts. Update the number when that file changes.
 */
const NETWORK_AGREEMENTS = 'nine'

const ENTRIES: { title: string; detail: string; quote?: { text: string; by: string } }[] = [
  {
    title: 'Research center, Philadelphia — 120 draws in 16 days, same collector',
    detail:
      'Daily on-site collection that started days after a late IRB approval. One vetted phlebotomist held on every session, 20-draw daily minimum, zero missed sessions.',
    quote: { text: '“All went well today. [Our phlebotomist] is wonderful.”', by: 'Principal investigator, day one' },
  },
  {
    title: 'Foundation-funded Alzheimer’s study — recurring participant draws across several states since May 2026',
    detail:
      'Participants enroll in different states; home visits are matched to a vetted local provider and billed to the sponsor, not the participant.',
  },
  {
    title: 'Cell-therapy company, Bay Area — nationwide on-demand participant draws under a signed services agreement',
    detail:
      'Participant draws requested as they come up, under one agreement and one point of contact.',
  },
]

export default function RecentWork({ tone = 'white', embedded = false }: { tone?: 'white' | 'gray'; embedded?: boolean }) {
  const card = tone === 'gray' ? 'bg-white' : 'bg-gray-50'
  const body = (
        <div className="max-w-4xl mx-auto">
          <h2 id="recent-work-heading" className="text-3xl font-bold text-gray-900 mb-6 text-center">Recent work</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ENTRIES.map(e => (
              <li key={e.title} className={`${card} rounded-lg border border-gray-200 p-5 flex flex-col`}>
                <h3 className="font-semibold text-gray-900 mb-2">{e.title}</h3>
                <p className="text-sm text-gray-700">{e.detail}</p>
                {e.quote && (
                  <blockquote className="mt-4 border-l-4 border-blue-600 pl-3 italic text-sm text-gray-700">
                    {e.quote.text}
                    <span className="block not-italic text-xs text-gray-600 mt-1">&mdash; {e.quote.by}</span>
                  </blockquote>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-gray-600 text-center max-w-3xl mx-auto">
            One point of contact, a written proposal within one business day, and {NETWORK_AGREEMENTS} network providers working under signed non-circumvention agreements.
          </p>
        </div>
  )
  if (embedded) return <div className="mb-12">{body}</div>
  return (
    <section className={`py-12 ${tone === 'gray' ? 'bg-gray-50' : 'bg-white'}`} aria-labelledby="recent-work-heading">
      <div className="container mx-auto px-4">{body}</div>
    </section>
  )
}
