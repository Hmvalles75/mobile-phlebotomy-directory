import { STATE_CONTEXT } from '@/data/state-context'

interface Props {
  stateName: string
  stateAbbr: string
}

/**
 * Renders the bottom SEO content block on /us/[state] pages.
 *
 * For the top 15 high-traffic states (CA, TX, FL, NY, PA, IL, OH, GA,
 * NC, MI, NJ, VA, WA, AZ, MA), pulls structured per-state data from
 * `data/state-context.ts` and renders unique paragraphs covering the
 * healthcare landscape, demand drivers, and any state-specific pricing
 * or regulatory notes.
 *
 * For other states, falls back to a more substantive generic block
 * (still better than the previous 2-paragraph placeholder).
 */
export default function StateSEOContent({ stateName, stateAbbr }: Props) {
  const ctx = STATE_CONTEXT[stateAbbr]

  if (ctx) {
    return (
      <div className="mt-12 bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          About Mobile Phlebotomy Services in {stateName}
        </h2>
        <div className="prose max-w-none text-gray-700 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Healthcare landscape</h3>
            <p>{ctx.healthcareLandscape}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Who uses mobile phlebotomy in {stateName}</h3>
            <p>{ctx.demandDrivers}</p>
          </div>
          {ctx.pricingNotes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing &amp; regulation</h3>
              <p>{ctx.pricingNotes}</p>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Major metros we cover in {stateName}</h3>
            <p>
              {ctx.topMetros.join(', ')} — find providers in your specific city using the directory above, or submit the request form to have available {stateName} providers contact you directly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Fallback: improved generic copy for the other 36 states
  return (
    <div className="mt-12 bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        About Mobile Phlebotomy Services in {stateName}
      </h2>
      <div className="prose max-w-none text-gray-700 space-y-4">
        <p>
          Mobile phlebotomy in {stateName} brings certified phlebotomists directly to patients&rsquo; homes, offices, or care facilities to collect blood, urine, and other lab specimens. Instead of driving to a draw site and waiting in line, a licensed phlebotomist meets you where you are and delivers your samples to a CLIA-certified partner lab for processing.
        </p>
        <p>
          Mobile phlebotomy in {stateName} is most commonly used by homebound or post-surgery patients, busy professionals who can&rsquo;t leave work for a lab visit, parents scheduling labs for children, residents of assisted living and senior care communities, and patients pursuing wellness, hormone, or functional medicine testing through independent practices. Many providers also serve corporate wellness programs and clinical research studies.
        </p>
        <p>
          Visit fees vary by provider but typically run <strong>$75 to $150 per visit</strong> in {stateName}, depending on travel distance, urgency, time of day, and the number of patients seen at the same address. Lab work itself is billed separately and often covered by insurance when ordered by a licensed healthcare provider; the home-visit fee is typically self-pay. Always confirm pricing, insurance acceptance, and any cancellation policy directly with the provider before booking.
        </p>
        <p>
          Use the provider directory above to find a mobile phlebotomist serving your area of {stateName}, or submit the request form and available providers will review your case and contact you directly. All providers listed operate under a CLIA-certified laboratory and carry the appropriate clinical credentials.
        </p>
      </div>
    </div>
  )
}
