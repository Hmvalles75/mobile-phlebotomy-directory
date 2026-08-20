import { getAllProviders } from './providers-db'

/**
 * City provider lookup, shared between the JSON API and the server-rendered
 * city page.
 *
 * This logic used to live only inside app/api/providers/city/route.ts, which
 * meant the city page could reach it only by fetching from the browser after
 * hydration. Googlebot executes no JavaScript, so the listing never existed in
 * the HTML it received — and because the client component's initial state is
 * what gets server-rendered, every city page shipped a heading announcing
 * "0 Providers Available in {City}". A directory page whose most prominent
 * heading declares the directory empty.
 *
 * Extracted here unchanged so the server page and the API return identical
 * results. If the grouping rules ever diverge, the page and its own API would
 * disagree about what covers a city.
 */

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

export interface GroupedCityProviders {
  citySpecific: any[]
  regional: any[]
  statewide: any[]
}

/** Providers for a city, split into city-specific, regional and statewide. */
export async function getProvidersByCity(
  cityName: string,
  stateAbbr: string,
): Promise<GroupedCityProviders> {
  const providers = await getAllProviders()

  const results: GroupedCityProviders = { citySpecific: [], regional: [], statewide: [] }

  const normalizedCity = cityName.toLowerCase()
  const normalizedState = stateAbbr.toUpperCase()
  const fullStateName = STATE_NAMES[normalizedState]

  providers.forEach(provider => {
    if (provider.is_mobile_phlebotomy === 'No') return

    if (provider.is_nationwide === 'Yes') {
      results.statewide.push(provider)
      return
    }

    const servesState = provider.state === normalizedState ||
                        provider.state === fullStateName ||
                        provider.coverage?.states?.some(state =>
                          state.toUpperCase() === normalizedState ||
                          state.toLowerCase() === fullStateName?.toLowerCase()
                        )
    if (!servesState) return

    const hasDirectCityMatch = provider.city?.toLowerCase() === normalizedCity ||
                               provider.coverage?.cities?.some(city =>
                                 city.toLowerCase() === normalizedCity
                               )

    const serviceAreaMatch = provider.verified_service_areas?.toLowerCase().includes(normalizedCity) ||
                             provider.validation_notes?.toLowerCase().includes(normalizedCity)

    const hasRegionalMatch = !hasDirectCityMatch && !serviceAreaMatch && servesState

    if (hasDirectCityMatch || serviceAreaMatch) {
      results.citySpecific.push(provider)
    } else if (hasRegionalMatch) {
      results.regional.push(provider)
    }
  })

  return results
}

/** Flattened equivalent, in the same order the client used to assemble. */
export async function getAllProvidersForCity(cityName: string, stateAbbr: string): Promise<any[]> {
  const r = await getProvidersByCity(cityName, stateAbbr)
  return [...r.citySpecific, ...r.regional, ...r.statewide]
}
