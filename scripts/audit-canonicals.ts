import * as fs from 'fs'
import * as path from 'path'

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, files)
    else if (entry.name === 'page.tsx' || entry.name === 'layout.tsx') files.push(p)
  }
  return files
}

const STATE_RE = /(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)/

const all = walk('app').map(p => p.replace(/\\/g, '/'))

// Find all city/variant pages
const cityVariantPages = all.filter(p =>
  /^app\/[a-z0-9-]+-[a-z]{2}\/(mobile-phlebotomy|in-home-blood-draw|blood-draw-at-home|mobile-phlebotomist|lab-draw-at-home)\/page\.tsx$/.test(p)
)

console.log(`Total city/variant pages found: ${cityVariantPages.length}`)

// For each page, check if there's a sibling layout.tsx with canonical
let withCanonical = 0
const missingCanonical: string[] = []

for (const pagePath of cityVariantPages) {
  const dir = path.dirname(pagePath)
  const layoutPath = path.join(dir, 'layout.tsx').replace(/\\/g, '/')

  let hasCanonical = false

  // Check page.tsx itself
  const pageSrc = fs.readFileSync(pagePath, 'utf8')
  if (/canonical/i.test(pageSrc) && /export\s+const\s+metadata|export\s+async\s+function\s+generateMetadata/.test(pageSrc)) {
    hasCanonical = true
  }

  // Check sibling layout.tsx
  if (!hasCanonical && fs.existsSync(layoutPath)) {
    const layoutSrc = fs.readFileSync(layoutPath, 'utf8')
    if (/canonical/i.test(layoutSrc)) hasCanonical = true
  }

  if (hasCanonical) withCanonical++
  else missingCanonical.push(pagePath)
}

console.log(`With canonical:    ${withCanonical}`)
console.log(`Missing canonical: ${missingCanonical.length}`)

if (missingCanonical.length > 0) {
  console.log(`\n=== Pages missing canonical (first 50) ===`)
  for (const p of missingCanonical.slice(0, 50)) {
    console.log(`  ${p}`)
  }
  if (missingCanonical.length > 50) console.log(`  ... and ${missingCanonical.length - 50} more`)
}

// Also surface the parent root-level pages worth checking
const rootPages = all.filter(p => /^app\/[a-z0-9-]+\/page\.tsx$/.test(p))
console.log(`\n=== Root-level service/info pages (${rootPages.length}) ===`)
let rootMissing = 0
for (const p of rootPages) {
  const src = fs.readFileSync(p, 'utf8')
  const layoutPath = path.join(path.dirname(p), 'layout.tsx').replace(/\\/g, '/')
  let layoutSrc = ''
  if (fs.existsSync(layoutPath)) layoutSrc = fs.readFileSync(layoutPath, 'utf8')
  const has = /canonical/i.test(src) || /canonical/i.test(layoutSrc)
  if (!has) {
    console.log(`  MISSING: ${p}`)
    rootMissing++
  }
}
console.log(`\nRoot-level missing canonical: ${rootMissing}`)
