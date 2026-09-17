import { assessDescription, leadingSentences } from './descriptionQuality'
import { groupServices } from './providerServices'

/**
 * Title and meta description for every provider page (generic template).
 *
 * Search Console, six months to 2026-09-17: four pages on page one at 0.1%
 * CTR. Their snippets were scraped site navigation, a scraped <title>, or the
 * same sentence twice. The old builder only rejected an empty description or
 * one exact generic phrase, padded anything under 110 characters with a
 * sentence that often repeated what was already there, and titled records
 * with no city as "in PA" or "in USA".
 *
 * Rules now:
 *  - Title never names a place the record does not have. City + state when
 *    both exist; otherwise the name and the service, nothing invented.
 *  - Real prose is used as-is (leading site chrome stripped), whole sentences
 *    up to 160 characters.
 *  - Scraped chrome, empty and thin descriptions get a description BUILT from
 *    the record: service families, city, languages, radius, verification.
 *    Thin real prose is kept and only what it does not already say is
 *    appended, never a second "provides mobile phlebotomy in" clause.
 *  - Four sentence templates rotate by a hash of the slug, and the first one
 *    that fits without truncation wins, so records with the same city and no
 *    services still read differently and never end in an ellipsis.
 *  - Fixed facilities (isFixedSite) get an honest non-mobile description.
 */

export interface MetaInput {
  slug: string
  name: string
  city?: string | null
  state?: string | null
  bio?: string | null
  services?: string[] | null
  languages?: string | null
  serviceRadiusMiles?: number | null
  status?: string | null
  isFixedSite?: boolean | null
}

const DESC_MAX = 160

export function buildProviderTitle(p: MetaInput): string {
  const name = p.name.trim()
  const where = p.city && p.state ? `${p.city.trim()}, ${p.state.trim()}` : null
  if (p.isFixedSite) return where ? `${name} - Lab Location in ${where}` : `${name} - Lab Location`
  if (where) return `${name} - Mobile Phlebotomy Services in ${where}`
  return `${name} - Mobile Phlebotomy & At-Home Blood Draws`
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function capitalise(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }

function languageClause(languages?: string | null): string | null {
  if (!languages || languages === 'nan') return null
  const list = languages.split(',').map(l => l.trim()).filter(l => l && l.toLowerCase() !== 'english')
  if (list.length === 0) return null
  return `${list.join(' and ')} spoken`
}

function familiesClause(services?: string[] | null): { lead: string; extra: string[] } {
  const labels = groupServices(services || []).map(f =>
    f.label.toLowerCase().replace(/\bdna\b/g, 'DNA').replace(/\biv\b/g, 'IV').replace(/\bdot\b/g, 'DOT'))
  return { lead: 'at-home blood draws', extra: labels.filter(l => l !== 'at-home blood draws').slice(0, 3) }
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** The record-built description. Exported for the audit script. */
export function buildFallbackDescription(p: MetaInput): string {
  const name = p.name.trim()
  const where = p.city && p.state ? `${p.city.trim()}, ${p.state.trim()}` : p.state ? p.state.trim() : null
  if (p.isFixedSite) {
    return trim(`${name} is a laboratory collection site${where ? ` in ${where}` : ''}, listed for reference. It is not a mobile phlebotomy service; mobile providers who come to you are listed separately.`)
  }
  const { lead, extra } = familiesClause(p.services)
  const offered = joinList([lead, ...extra])
  const lang = languageClause(p.languages)
  const radius = p.serviceRadiusMiles && p.serviceRadiusMiles >= 10 ? `within ${p.serviceRadiusMiles} miles` : null
  const verified = p.status === 'VERIFIED'

  const templates: string[] = [
    `${capitalise(offered)}${where ? ` in ${where}` : ''} from ${name}. ${verified ? 'Verified mobile phlebotomist who comes' : 'A mobile phlebotomist who comes'} to your home, office or facility${radius ? ` ${radius}` : ''}.${lang ? ` ${capitalise(lang)}.` : ''}`,
    `${name} brings ${offered} to your door${where ? ` across ${where}` : ''}${radius ? ` and ${radius}` : ''}. Doctor-ordered lab work collected where you are${verified ? ', by a verified provider' : ''}.${lang ? ` ${capitalise(lang)}.` : ''}`,
    `Need a blood draw at home${where ? ` in ${where}` : ''}? ${name} provides ${offered}${radius ? ` ${radius}` : ''}, with the same care you would get at a lab.${verified ? ' Verified provider.' : ''}${lang ? ` ${capitalise(lang)}.` : ''}`,
    `${where ? `${where} mobile phlebotomy` : 'Mobile phlebotomy'} by ${name}: ${offered}, collected at your home, office or care facility${radius ? ` ${radius}` : ''}.${verified ? ' Verified provider.' : ''}${lang ? ` ${capitalise(lang)}.` : ''}`,
  ]
  const start = hash(p.slug) % templates.length
  for (let i = 0; i < templates.length; i++) {
    const t = templates[(start + i) % templates.length].replace(/\s+/g, ' ').trim()
    if (t.length <= DESC_MAX) return t
  }
  return trim(templates[start])
}

function trim(s: string): string {
  const clean = s.replace(/\s+/g, ' ').trim()
  return clean.length <= DESC_MAX ? clean : leadingSentences(clean, DESC_MAX)
}

const THIN_TAILS = [
  'Doctor-ordered lab work collected at your home, office or facility.',
  'Licensed and insured, and we come to you.',
  'Your draw, on your schedule, at your location.',
]

export function buildProviderDescription(p: MetaInput): { description: string; source: 'prose' | 'thin+built' | 'built'; assessment: ReturnType<typeof assessDescription> } {
  if (p.isFixedSite) return { description: buildFallbackDescription(p), source: 'built', assessment: assessDescription(p.bio, p.name) }
  const a = assessDescription(p.bio, p.name)
  if (a.kind === 'prose') {
    return { description: leadingSentences(a.cleaned, DESC_MAX), source: 'prose', assessment: a }
  }
  if (a.kind === 'thin') {
    // Keep the provider's own words; add only what they do not already say.
    const thin = a.cleaned.replace(/[.!?]?$/, '.')
    const { extra } = familiesClause(p.services)
    const lang = languageClause(p.languages)
    const adds: string[] = []
    if (extra.length && !new RegExp(extra[0].split(' ')[0], 'i').test(thin)) adds.push(`Also ${joinList(extra)}.`)
    if (lang && !/spoken|bilingual|habla/i.test(thin)) adds.push(`${capitalise(lang)}.`)
    if (adds.length === 0) adds.push(THIN_TAILS[hash(p.slug) % THIN_TAILS.length])
    return { description: trim(`${thin} ${adds.join(' ')}`), source: 'thin+built', assessment: a }
  }
  return { description: buildFallbackDescription(p), source: 'built', assessment: a }
}
