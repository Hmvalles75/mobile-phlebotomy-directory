/**
 * Hand-authored long-form city copy, ported into the canonical
 * /us/[state]/[city] pages during the URL consolidation (2026-07). Content is
 * lifted from the legacy P2 metro guide and P3 city-suffix pages so the 301'd
 * URLs don't lose the prose that was ranking.
 *
 * Keyed by compound "${stateSlug}/${citySlug}" (matches data/cities-full.ts).
 * Rendered server-side by the generated static override page above <CityPage>.
 */

export interface CityLongform {
  /** Section paragraphs rendered under an "About" heading. */
  paragraphs: string[]
}

export const CITY_LONGFORM: Record<string, CityLongform> = {
  // Ported verbatim from the legacy /chicago-il/mobile-phlebotomy page ahead of
  // its 308. Entities preserved as real characters; the price band is the
  // legacy page's own figure, unchanged.
  'illinois/chicago': {
    paragraphs: [
      "Chicago's harsh winters and dense urban layout make mobile phlebotomy especially practical — patients in high-rises, seniors on the South Side, and busy professionals in the Loop all benefit from at-home draws. Many Chicago providers also serve the western suburbs through Naperville, Schaumburg, and down to Joliet.",
      "Services commonly requested in the Chicago area include routine lab work for Northwestern Medicine and Rush orders, corporate wellness screenings for downtown offices, pre-employment drug testing, and home health collections for agencies serving Cook County.",
      "Expect to pay $70–$130 per visit in the Chicago metro. Providers in the city proper may charge a small parking surcharge. Illinois Medicaid covers mobile draws for homebound patients with a physician's order.",
    ],
  },

  // Ported verbatim from the legacy /san-diego-ca/mobile-phlebotomy page.
  'california/san-diego': {
    paragraphs: [
      "San Diego's spread-out geography — from Oceanside to Chula Vista — means lab visits often require 30+ minutes of driving. Mobile phlebotomy eliminates that entirely. Providers in the San Diego market typically cover coastal communities like La Jolla, Del Mar, and Encinitas as well as inland areas like Escondido and El Cajon.",
      "Common services in San Diego include draws for Scripps Health and UC San Diego Health lab orders, fertility and IVF blood work, military family health screenings near Camp Pendleton, and concierge wellness panels for the biotech corridor in Sorrento Valley and UTC.",
      "San Diego mobile phlebotomy visits typically cost $80–$160. California requires phlebotomists to hold a CPT1 certification, so all providers listed here carry valid state credentials.",
    ],
  },

  // Ported from the P2 metro guide (templated), Phoenix.
  'arizona/phoenix': {
    paragraphs: [
      "Mobile phlebotomists serve patients throughout the Phoenix metropolitan area, bringing lab collection directly to homes, offices, and assisted living facilities. Rather than driving to a draw station and waiting, Phoenix residents can schedule a licensed phlebotomist to visit at a convenient time and location across the Valley — from Scottsdale and Tempe to Glendale, Mesa, and Chandler.",
      "Each provider sets their own rates, but mobile blood draw visits in Phoenix generally add a convenience fee on top of any laboratory testing cost, typically $60–$120 per appointment depending on distance, urgency, and how many household members are drawn. Larger national services often publish standard home-visit rates near $75–$80.",
      "Most services require a valid lab requisition from a physician. Laboratory testing can usually be billed to insurance when ordered by a licensed provider, while the mobile collection fee is often an out-of-pocket convenience charge. Medicare and some private plans may cover in-home draws for homebound patients. Confirm credentials, insurance acceptance, and pricing directly with any provider before booking.",
    ],
  },

  // Ported from the P2 metro guide (templated), San Antonio.
  'texas/san-antonio': {
    paragraphs: [
      "Mobile phlebotomists serve patients throughout the San Antonio metropolitan area, bringing lab collection directly to homes, offices, and assisted living facilities. Rather than driving to a draw station and waiting, San Antonio residents can schedule a licensed phlebotomist to visit at a convenient time and location — from downtown and Stone Oak to Alamo Heights and the surrounding Bexar County communities.",
      "Each provider sets their own rates, but mobile blood draw visits in San Antonio generally add a convenience fee on top of any laboratory testing cost, typically $60–$120 per appointment depending on distance, urgency, and how many household members are drawn. Larger national services often publish standard home-visit rates near $75–$80.",
      "Most services require a valid lab requisition from a physician. Laboratory testing can usually be billed to insurance when ordered by a licensed provider, while the mobile collection fee is often an out-of-pocket convenience charge. Medicare and some private plans may cover in-home draws for homebound patients. Confirm credentials, insurance acceptance, and pricing directly with any provider before booking.",
    ],
  },

  // ── Legacy P3 consolidation, 2026-08-21 ────────────────────────────────────
  // Ported verbatim from the /{city}-{st}/mobile-phlebotomy pages ahead of their
  // 308s. HTML entities (&apos; &ndash; &amp;) converted to real characters, per
  // the Chicago entry above. Hero subtitles were not ported — they are page
  // furniture, not prose. Price bands are each legacy page's own figure.

  // Ported verbatim from the legacy /boston-ma/mobile-phlebotomy page.
  'massachusetts/boston': {
    paragraphs: [
      "Boston is one of the world's leading medical hubs — home to Mass General, Brigham and Women's, Beth Israel Deaconess, Tufts Medical, and the Longwood Medical Area cluster. Despite that density, many patients in high-rise apartments, Back Bay brownstones, and the ring of commuter suburbs (Cambridge, Somerville, Brookline, Newton, Quincy) still struggle to reach a lab during business hours.",
      "Boston-area mobile phlebotomists serve patients with routine lab draws for MGB (Mass General Brigham) orders, IVF and fertility panels for the region's major reproductive endocrinology practices, corporate wellness programs for Cambridge biotech and Financial District firms, and home health collections for homebound seniors in Dorchester, Jamaica Plain, and Roxbury.",
      "Boston mobile phlebotomy visits typically cost $85–$160, with a small parking premium in the city proper. Massachusetts phlebotomists must operate under a CLIA-certified lab, and all providers listed here carry the appropriate clinical credentials.",
    ],
  },

  // Ported verbatim from the legacy /dallas-tx/mobile-phlebotomy page.
  'texas/dallas': {
    paragraphs: [
      "Dallas anchors the fourth-largest metro in the U.S. — a sprawling 9,000+ square mile region that includes Fort Worth, Plano, Arlington, Irving, and dozens of rapidly growing suburbs. The Dallas-Fort Worth Metroplex is home to major medical systems like UT Southwestern, Baylor Scott & White, and Medical City Healthcare, but with so much distance between communities, mobile phlebotomy is a practical alternative to driving 45 minutes for a 10-minute blood draw.",
      "DFW mobile phlebotomists handle routine lab draws for UT Southwestern and Baylor orders, pre-employment and DOT drug testing for the region's logistics and transportation companies, corporate wellness programs for the many Fortune 500 HQs in the metro, and home health collections for Dallas's growing retiree population across Collin and Denton counties.",
      "Dallas-area mobile phlebotomy typically runs $65–$130 per visit, below the national average. Texas requires phlebotomists to work under a CLIA-certified lab and carry appropriate certifications; all providers listed here meet those requirements.",
    ],
  },

  // Ported verbatim from the legacy /houston-tx/mobile-phlebotomy page.
  'texas/houston': {
    paragraphs: [
      "Houston is the largest city in Texas and the fourth-largest in the U.S., home to the Texas Medical Center — the world's largest medical complex. Despite this, many patients across the Houston metro still need blood draws but can't easily get to a lab, especially in sprawling suburbs like Katy, Cypress, and The Woodlands.",
      "Mobile phlebotomists in Houston typically serve the entire metro area within a 30–50 mile radius. Services include routine venipuncture for Quest and Labcorp orders, drug and alcohol testing, DOT physicals collections, wellness panels, and specialty draws for clinical trials at MD Anderson and Houston Methodist.",
      "Most Houston-area providers charge $60–$120 per visit for the draw fee, with lab processing billed separately. Medicare patients with homebound documentation typically pay $0–$25.",
    ],
  },

  // Ported verbatim from the legacy /miami-fl/mobile-phlebotomy page.
  'florida/miami': {
    paragraphs: [
      "Miami's sprawling geography, heavy traffic, and large senior population make mobile phlebotomy an essential service across Miami-Dade. Whether you're in a high-rise in Brickell, a home in Coral Gables, or a condo in Aventura, getting to a lab can eat up hours — mobile phlebotomists eliminate that entirely.",
      "Florida providers in the Miami area serve a mix of needs: routine draws for Jackson Health System, Baptist Health, and Cleveland Clinic Florida lab orders, Spanish-speaking patient care (critical in a city where 70%+ of residents speak Spanish at home), fertility and specialty testing for the region's concierge medical practices, and home health collections for Miami's substantial retiree population.",
      "Miami-area mobile phlebotomy typically costs $75–$140. Florida doesn't require a separate state phlebotomy license, but all providers on our platform carry national certifications (ASCP, NHA, or AMT) and work under CLIA-approved lab supervision.",
    ],
  },
}
