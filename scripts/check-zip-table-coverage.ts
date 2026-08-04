import { getZipInfo } from '../lib/zip-geocode'
// Spot-check ZIPs that are unambiguously real against the local table.
const REAL = [
  ['75072', 'McKinney TX'], ['72713', 'Bentonville AR'], ['18366', 'Tannersville PA'],
  ['26526', 'Granville WV'], ['10001', 'New York NY'], ['90210', 'Beverly Hills CA'],
  ['33901', 'Fort Myers FL'], ['02108', 'Boston MA'], ['20744', 'Fort Washington MD'],
  ['99584', '(likely typo)'], ['84707', '(likely typo)'], ['39034', '(likely typo)'],
]
let missing = 0
for (const [zip, label] of REAL) {
  const info = getZipInfo(zip)
  if (!info) missing++
  console.log(`  ${zip}  ${label.padEnd(22)} ${info ? `${info.city}, ${info.state}` : 'NOT IN TABLE'}`)
}
console.log(`\n${missing} of ${REAL.length} not in table`)
