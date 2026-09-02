/**
 * Build guard: every metro must resolve to a real place.
 *
 * The metro pages look providers up by city name. When a record's name is not a
 * place name the lookup returns nothing, the page renders "Find 0 certified
 * mobile phlebotomy providers in {City}", and nothing anywhere fails — it just
 * quietly advertises no coverage. That is exactly what new-york-city did until
 * 2026-09-02, on one of the only two self-canonical metros in the set.
 *
 * MetroArea.geoCity exists to fix that case. This guard exists so the next one
 * cannot happen silently: add a metro whose name is colloquial, forget the
 * field, and the build fails here rather than the page lying in production.
 *
 * Runs from postbuild. Exits non-zero and names the offenders.
 */
import zipcodes from 'zipcodes'
import { topMetroAreas } from '../data/top-metros'

interface Unresolved {
  slug: string
  attempted: string
  stateAbbr: string
  usedGeoCity: boolean
}

export function findUnresolvedMetros(): Unresolved[] {
  const bad: Unresolved[] = []

  for (const metro of topMetroAreas) {
    const attempted = metro.geoCity || metro.city
    const rows: any = (zipcodes as any).lookupByName(attempted, metro.stateAbbr)
    const resolves = Array.isArray(rows) && rows.length > 0

    if (!resolves) {
      bad.push({
        slug: metro.slug,
        attempted,
        stateAbbr: metro.stateAbbr,
        usedGeoCity: Boolean(metro.geoCity),
      })
    }
  }

  return bad
}

function main() {
  const bad = findUnresolvedMetros()

  if (bad.length === 0) {
    console.log(`✅ Metro geo check: all ${topMetroAreas.length} metros resolve`)
    return
  }

  console.error(`\n❌ Metro geo check: ${bad.length} of ${topMetroAreas.length} metro(s) do not resolve\n`)
  for (const b of bad) {
    console.error(`   ${b.slug}`)
    console.error(`      looked up "${b.attempted}" (${b.stateAbbr}) via ${b.usedGeoCity ? 'geoCity' : 'city'}`)
    console.error(
      b.usedGeoCity
        ? `      geoCity is set but still does not resolve — check the spelling against the ZIP dataset`
        : `      add a geoCity to this record in data/top-metros.ts with the real place name`
    )
  }
  console.error(
    `\nThese pages would render "Find 0 certified mobile phlebotomy providers" ` +
    `to anyone without JavaScript, including Googlebot.\n`
  )
  process.exit(1)
}

main()
