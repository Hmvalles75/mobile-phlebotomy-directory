interface Props {
  cityName: string   // e.g., 'Boston, MA' — used in answer text
  cityShort: string  // e.g., 'Boston' — used in question + answer text
  variant: 'mobile-phlebotomy' | 'in-home-blood-draw' | 'blood-draw-at-home'
}

const SERVICE_LABEL: Record<Props['variant'], string> = {
  'mobile-phlebotomy':    'mobile phlebotomy',
  'in-home-blood-draw':   'in-home blood draw',
  'blood-draw-at-home':   'blood draw at home',
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function buildFaqs(cityName: string, cityShort: string, variant: Props['variant']) {
  const service = SERVICE_LABEL[variant]
  const Service = cap(service)

  return [
    {
      q: `What is ${service} in ${cityShort}?`,
      a: `${Service} in ${cityShort} brings certified phlebotomists directly to your home, office, or other preferred location for blood draws and lab specimen collection. This service eliminates travel to a traditional lab — especially valuable for elderly, immunocompromised, or busy patients in the ${cityName} area.`,
    },
    {
      q: `How much does ${service} cost in ${cityShort}?`,
      a: `${Service} visits in ${cityShort} typically cost $85–$160, depending on travel distance, number of tubes drawn, and any specialty handling required. Some providers accept insurance and Medicare for homebound patients — confirm with your provider before booking.`,
    },
    {
      q: `How quickly can I get a ${service} appointment in ${cityShort}?`,
      a: `Most ${service} providers in ${cityShort} offer same-day or next-day availability for routine draws. Time-sensitive collections (fasting glucose, INR/PT monitoring, fertility cycle blood work) can usually be accommodated within 24 hours, though early-morning slots fill quickly.`,
    },
    {
      q: `Are ${service} services in ${cityShort} covered by insurance?`,
      a: `Coverage varies by provider and plan. Medicare may cover ${service} for homebound patients with a physician's order. Many private insurers cover the lab work itself but not the home-visit fee. Confirm with both your insurance and the ${service} provider before booking.`,
    },
    {
      q: `What types of blood tests can ${service} services perform in ${cityShort}?`,
      a: `${Service} providers in ${cityShort} can collect samples for the same routine and specialty tests offered at any lab — CBC, CMP, lipid panel, A1C, thyroid panel, fertility panels, hormone testing, drug screens, and most other standard lab orders. Specimens are couriered to a CLIA-certified lab for processing.`,
    },
  ]
}

/**
 * Renders both a visible FAQ section AND a JSON-LD FAQPage schema block.
 *
 * Google requires the FAQ content to be visible on the page for rich-snippet
 * eligibility (schema-only emits don't qualify since the August 2023 policy
 * change). This component does both in one drop-in.
 */
export default function CityFAQ({ cityName, cityShort, variant }: Props) {
  const faqs = buildFaqs(cityName, cityShort, variant)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.q}</h3>
              <p className="text-gray-700 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
