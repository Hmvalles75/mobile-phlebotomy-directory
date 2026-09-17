/**
 * Group a provider's attached service names into distinct service families.
 *
 * The service catalogue has 38 names, many of which are the same thing
 * ("Blood Draw", "Mobile Blood Draws", "At-Home Blood Draws", "Mobile
 * Phlebotomy", "In-Home Phlebotomy"). The premium template used to render one
 * card per attached name and map each to one of ten canned sentences by
 * keyword, so Gentle Trace showed 19 cards with five distinct descriptions.
 * That reads as thin, auto-generated content.
 *
 * This groups names into families with one label, one description and the
 * original names kept as members, ordered specialty-first (the things that
 * distinguish a provider) and generic last (everyone does at-home draws).
 * Shared by the premium template's service cards and by the per-provider meta
 * description, so the two never disagree.
 */

export type ServiceFamilyKey =
  | 'pediatric' | 'senior' | 'dna' | 'drug' | 'iv' | 'corporate' | 'research'
  | 'kits' | 'specimen' | 'lab' | 'blood' | 'other'

export interface ServiceFamily {
  key: ServiceFamilyKey
  label: string
  description: string
  members: string[]
}

// Order here is render order: distinctive first, generic last.
const FAMILIES: Array<{ key: ServiceFamilyKey; label: string; description: string; match: RegExp }> = [
  { key: 'pediatric', label: 'Pediatric blood draws', description: 'Gentle, child-focused draws by phlebotomists trained in pediatric technique.', match: /pediatric|child|infant/ },
  { key: 'senior', label: 'Senior and homebound care', description: 'In-home collection for seniors and homebound patients who cannot easily travel to a lab.', match: /geriatric|elderly|senior|homebound|assisted living|nursing/ },
  { key: 'dna', label: 'DNA testing collections', description: 'Paternity, immigration and gender-reveal DNA sample collection with chain-of-custody handling.', match: /\bdna\b|paternity|immigration|gender reveal/ },
  { key: 'drug', label: 'Drug and alcohol testing', description: 'DOT and non-DOT drug screens, breath alcohol, hair and nail testing at your location.', match: /drug|alcohol|\bdot\b|hair|nail/ },
  { key: 'iv', label: 'IV therapy', description: 'Mobile IV infusions and hydration therapy administered by licensed professionals.', match: /\biv\b|hydration|infusion|vitamin/ },
  { key: 'corporate', label: 'Corporate and wellness screenings', description: 'On-site biometric screenings and wellness panels for employers, events and benefits days.', match: /corporate|wellness|biometric|occupational|screening|employer|physical exam/ },
  { key: 'research', label: 'Clinical research draws', description: 'Protocol-driven collection for clinical trials and research studies, with the same collector every visit.', match: /clinical|research|trial|study/ },
  { key: 'kits', label: 'Specialty kit collections', description: 'Collection for mail-in and specialty test kits, packed and shipped to the kit\'s lab.', match: /kit|functional medicine/ },
  { key: 'specimen', label: 'Specimen collection and pickup', description: 'Urine, saliva, swab and other specimen collection, with pickup and delivery to your lab.', match: /specimen|urinalysis|urine|swab|culture|pickup|collection site/ },
  { key: 'lab', label: 'Lab services', description: 'Draws delivered to Quest, Labcorp or your preferred lab, with results routed to your doctor.', match: /\blab\b|laboratory|diagnostic/ },
  { key: 'blood', label: 'At-home blood draws', description: 'Routine and specialty venipuncture for doctor-ordered lab work, at your home, office or facility.', match: /blood|draw|phlebotomy|venipuncture|mobile|home/ },
]

export function groupServices(names: string[]): ServiceFamily[] {
  const byKey = new Map<ServiceFamilyKey, ServiceFamily>()
  const seen = new Set<string>()
  for (const raw of names) {
    const name = (raw || '').trim()
    if (!name) continue
    const norm = name.toLowerCase()
    if (seen.has(norm)) continue
    seen.add(norm)
    const fam = FAMILIES.find(f => f.match.test(norm))
    const key: ServiceFamilyKey = fam ? fam.key : 'other'
    const existing = byKey.get(key)
    if (existing) {
      existing.members.push(name)
    } else {
      byKey.set(key, {
        key,
        label: fam ? fam.label : name,
        description: fam ? fam.description : 'Professional service delivered with care, on your schedule, at the location you choose.',
        members: [name],
      })
    }
  }
  // Unmatched names each become their own family so nothing is hidden, but
  // they sit after the known specialty families and before the generic one.
  const ordered: ServiceFamily[] = []
  for (const f of FAMILIES) {
    if (f.key === 'blood') continue
    const g = byKey.get(f.key)
    if (g) ordered.push(g)
  }
  const other = byKey.get('other')
  if (other) {
    // Split 'other' back into one family per distinct name.
    for (const m of other.members) ordered.push({ key: 'other', label: m, description: other.description, members: [m] })
  }
  const blood = byKey.get('blood')
  if (blood) ordered.push(blood)
  return ordered
}

/** Short comma list of the most distinctive families, for meta descriptions. */
export function serviceHighlights(names: string[], max = 3): string[] {
  return groupServices(names).slice(0, max).map(f =>
    f.label.toLowerCase().replace(/\bdna\b/g, 'DNA').replace(/\biv\b/g, 'IV').replace(/\bdot\b/g, 'DOT')
  )
}
