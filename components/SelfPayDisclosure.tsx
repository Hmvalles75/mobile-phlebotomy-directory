/**
 * Self-pay disclosure for the payment question on every patient intake form
 * (2026-10-08). Shown before the patient chooses, so "insurance" is picked
 * knowing what it means for a home visit.
 *
 * Why: insurance requests booked 0 of 17 in the 30 days to 10/08 against 32%
 * for self-pay, and the 9/23 note shown only after choosing "Insurance" did
 * not move it. The full request form asked "How will you be paying?" cold and
 * drew 48% insurance answers over 90 days; the city-page form, which already
 * framed the question around self-pay, drew 9%.
 *
 * One component so the three forms (request page, city-page inline form,
 * modal) say the same thing and quote the same fee range.
 */
export const VISIT_FEE_RANGE = '$75–$150'

export function SelfPayDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? 'text-xs text-gray-600 mb-2' : 'text-sm text-gray-700 mb-3'}>
      <strong>Home blood draws are almost always self-pay.</strong> Your lab bills your insurance for the tests, but the
      phlebotomist&apos;s visit fee, usually {VISIT_FEE_RANGE}, is paid to them directly. Few mobile phlebotomists bill insurance.
    </p>
  )
}

export function InsuranceOnlyNote({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg ${compact ? 'text-xs' : 'text-sm'} text-amber-900`}>
      If insurance has to pay for the visit itself, a home draw may not be the right fit. Your doctor&apos;s office or lab can
      point you to a nearby patient service center, where insurance usually covers the draw. You can still send this
      request, and the phlebotomist will tell you whether they bill your plan.
    </div>
  )
}
