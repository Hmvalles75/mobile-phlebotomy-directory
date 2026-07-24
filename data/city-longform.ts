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
}
