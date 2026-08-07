import * as fs from 'fs'
import * as path from 'path'
import { CITY_MAPPING } from '../data/cities-full'
import { STATE_DATA, ABBR_TO_SLUG } from '../data/states-full'

/**
 * Enumerates legacy /{city}-{st}/{variant} routes from disk and resolves each
 * to its canonical /us/{state}/{city} target.
 *
 * Disk is the source of truth rather than a hardcoded suffix list: the variants
 * are inconsistent across cities (mobile-phlebotomy, in-home-blood-draw,
 * blood-draw-at-home, lab-draw-at-home, mobile-phlebotomist), and a list would
 * silently miss any that were added later.
 *
 *   npx tsx scripts/discover-legacy-city-routes.ts            # inventory
 *   npx tsx scripts/discover-legacy-city-routes.ts --city=chicago-il
 *   npx tsx scripts/discover-legacy-city-routes.ts --emit     # redirect entries
 */
const APP = path.join(process.cwd(), 'app')

// Legacy dirs are "{city-slug}-{2-letter-state}". Anchored so content pages
// that merely contain a hyphen (best-website-builders-mobile-phlebotomy) and
// real 2-letter-suffixed words cannot match.
const LEGACY_DIR = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([a-z]{2})$/

export interface LegacyRoute {
  source: string        // /chicago-il/mobile-phlebotomy
  destination: string   // /us/illinois/chicago
  cityDir: string       // chicago-il
  variant: string       // mobile-phlebotomy
  targetExists: boolean
}

export function discoverLegacyRoutes(): LegacyRoute[] {
  const out: LegacyRoute[] = []
  for (const entry of fs.readdirSync(APP, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const m = LEGACY_DIR.exec(entry.name)
    if (!m) continue
    const [, citySlug, stateAbbr] = m

    const stateSlug = ABBR_TO_SLUG[stateAbbr.toUpperCase()]
    if (!stateSlug || !STATE_DATA[stateSlug]) continue  // not a real state suffix

    const key = `${stateSlug}/${citySlug}`
    const targetExists = Boolean((CITY_MAPPING as Record<string, unknown>)[key])

    for (const sub of fs.readdirSync(path.join(APP, entry.name), { withFileTypes: true })) {
      if (!sub.isDirectory()) continue
      if (!fs.existsSync(path.join(APP, entry.name, sub.name, 'page.tsx'))) continue
      out.push({
        source: `/${entry.name}/${sub.name}`,
        destination: `/us/${key}`,
        cityDir: entry.name,
        variant: sub.name,
        targetExists,
      })
    }
  }
  return out.sort((a, b) => a.source.localeCompare(b.source))
}

function main() {
  const only = process.argv.find(a => a.startsWith('--city='))?.split('=')[1]
  const emit = process.argv.includes('--emit')
  let routes = discoverLegacyRoutes()
  if (only) routes = routes.filter(r => r.cityDir === only)

  if (emit) {
    for (const r of routes.filter(r => r.targetExists)) {
      console.log(`      { source: '${r.source}', destination: '${r.destination}', permanent: true },`)
    }
    return
  }

  const byCity = new Map<string, LegacyRoute[]>()
  for (const r of routes) {
    const a = byCity.get(r.cityDir) || []
    a.push(r); byCity.set(r.cityDir, a)
  }

  console.log(`Legacy city dirs: ${byCity.size}   routes: ${routes.length}\n`)
  const variantCounts = new Map<string, number>()
  let noTarget = 0
  for (const [city, rs] of [...byCity.entries()].sort()) {
    const ok = rs[0].targetExists
    if (!ok) noTarget++
    console.log(`  ${city.padEnd(22)} → ${rs[0].destination.padEnd(34)} ${ok ? '' : '⚠ NO CITY PAGE'}`)
    for (const r of rs) {
      console.log(`      ${r.variant}`)
      variantCounts.set(r.variant, (variantCounts.get(r.variant) || 0) + 1)
    }
  }

  console.log(`\nVariant frequency:`)
  for (const [v, n] of [...variantCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v.padEnd(26)} ${n}`)
  }
  console.log(`\nCities with no canonical target (would 404 — excluded): ${noTarget}`)
}

if (require.main === module) main()
