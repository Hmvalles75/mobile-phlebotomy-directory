import boilerplate from '@/data/description-boilerplate-shingles.json'

/**
 * Structural detection of scraped site chrome in provider descriptions.
 *
 * Roughly 54 live descriptions are a scraped <nav> or <title>: "Skip to main
 * content Return to Guthrie homepage Open the mobile Main Menu Careers ...".
 * The older detector (lib/detectJunkDescription.ts, `descriptionFlagged`) is
 * a hand-curated word list and matched none of them, because scraped chrome
 * uses whatever words that site's menu uses.
 *
 * This judges SHAPE and CORPUS FREQUENCY, never a hand-written vocabulary:
 *   1. Label lists. Menus are runs of Title Case labels with almost no
 *      grammar words (articles, prepositions, pronouns, auxiliaries). Every
 *      real sentence needs those; a list of labels has almost none. The
 *      provider's own name is removed first so long business names do not
 *      count as capitals.
 *   2. Shared phrases. A 4-word phrase that appears verbatim in the
 *      descriptions of four or more unrelated providers is platform chrome
 *      ("use tab to navigate through the menu items", "we use cookies to")
 *      or a seed template, not that provider's words. The phrase set is
 *      generated from the database by scripts/build-boilerplate-shingles.ts.
 *   3. No sentence punctuation across a long stretch.
 *   4. Title-tag separator chains ("Sayre Laboratory Services | Guthrie").
 *
 * Chrome is often a PREFIX on real prose, so the text is judged segment by
 * segment (split on sentence ends): leading chrome segments are stripped and
 * the remainder is assessed on its own. Pure function; safe at render time.
 */

export interface DescriptionAssessment {
  kind: 'prose' | 'boilerplate' | 'thin' | 'empty'
  /** Text with leading chrome removed. Empty for boilerplate/empty. */
  cleaned: string
  words: number
  strippedWords: number
  reasons: string[]
}

const THIN_WORDS = 18
const SHINGLE_N = (boilerplate as { n: number }).n || 4
const SHARED = new Set<string>((boilerplate as { shingles: string[] }).shingles || [])

// Closed-class English words: grammar, not topic. Same set for every site.
const FUNCTION_WORDS = new Set(('a an the and or but of to in on at for with by from as is are was were be been being ' +
  'we our us you your they their them he she it its this that these those there here who which what when where how ' +
  'do does did have has had will would can could should may might not no so if than then also all any each every ' +
  'more most some such very just only into over under about after before between through during without within ' +
  'up out off own same too').split(' '))

interface Segment { text: string; words: number; caps: number; func: number; shared: number; chrome: boolean; why: string }

function sharedRatio(text: string): number {
  const tokens = text.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean)
  if (tokens.length < SHINGLE_N) return 0
  let hits = 0, total = 0
  for (let i = 0; i + SHINGLE_N <= tokens.length; i++) {
    total++
    if (SHARED.has(tokens.slice(i, i + SHINGLE_N).join(' '))) hits++
  }
  return total ? hits / total : 0
}

function analyseSegment(text: string): Segment {
  const tokens = text.split(' ').filter(Boolean)
  let considered = 0, capitalised = 0, func = 0
  tokens.forEach((t, i) => {
    const w = t.replace(/^[("'“]+|[)"'”,;:.!?]+$/g, '')
    if (!w) return
    if (FUNCTION_WORDS.has(w.toLowerCase())) func++
    if (i === 0 || /^[A-Z0-9&]{1,4}$/.test(w)) return
    considered++
    if (/^[A-Z][a-z]/.test(w)) capitalised++
  })
  const words = tokens.length
  const caps = considered > 0 ? capitalised / considered : 0
  const funcRatio = words > 0 ? func / words : 0
  const shared = sharedRatio(text)
  const labelList = words >= 8 && caps > 0.5 && funcRatio < 0.3
  // Verbatim-shared phrases: half the 4-grams, or a third of them in a
  // capital-heavy segment ("top of page Services Partners More Use tab to
  // navigate through the menu items").
  const sharedChrome = words >= 5 && (shared >= 0.5 || (shared >= 0.35 && caps > 0.3))
  const chrome = labelList || sharedChrome
  const why = labelList ? `${Math.round(caps * 100)}% caps, ${Math.round(funcRatio * 100)}% grammar words` : sharedChrome ? `${Math.round(shared * 100)}% shared phrases` : ''
  return { text, words, caps, func: funcRatio, shared, chrome, why }
}

export function assessDescription(raw: string | null | undefined, providerName?: string | null): DescriptionAssessment {
  let text = (raw || '').replace(/\s+/g, ' ').trim()
  const base: DescriptionAssessment = { kind: 'prose', cleaned: '', words: 0, strippedWords: 0, reasons: [] }
  if (!text) return { ...base, kind: 'empty' }
  const original = text
  base.words = text.split(' ').filter(Boolean).length

  // Analyse with the business name blanked so its capitals do not count.
  const analysed = providerName && providerName.trim().length > 3
    ? text.replace(new RegExp(providerName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ').replace(/\s+/g, ' ').trim()
    : text

  // 4. Title-tag separator chain in the opening stretch.
  const head = original.slice(0, 140)
  const pipes = (head.match(/ \| /g) || []).length + (head.match(/ [-–—] /g) || []).length
  const pipeChain = pipes >= 2 || /^[^.!?]{3,80} \| [^.!?]{3,60}(?: \| |$)/.test(head)
  if (pipeChain) base.reasons.push('title-tag separator chain')

  // Segment both the analysed and the original text on the same boundaries.
  const split = (s: string) => (s.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [s]).map(x => x.trim()).filter(Boolean)
  const segsA = split(analysed).map(analyseSegment)
  const segsO = split(original)
  const aligned = segsA.length === segsO.length

  // Strip leading chrome segments (and a pipe-chain first segment).
  let cut = 0
  while (cut < segsA.length && (segsA[cut].chrome || (cut === 0 && pipeChain && segsA[0].func < 0.3))) cut++
  const stripped = segsA.slice(0, cut).reduce((n, s) => n + s.words, 0)
  base.strippedWords = stripped
  if (stripped > 0) base.reasons.push(`${stripped} words of leading chrome (${segsA.slice(0, cut).map(s => s.why || 'title chain').join('; ')})`)

  const restA = segsA.slice(cut)
  const restText = (aligned ? segsO.slice(cut) : restA.map(s => s.text)).join(' ')
  const restWords = restText.split(' ').filter(Boolean).length

  // 3. No sentence punctuation across a long stretch; 1+2 on the remainder.
  const stops = (restText.match(/[.!?](?=\s|$)/g) || []).length
  const whole = analyseSegment(restA.map(s => s.text).join(' '))
  const noSentences = (restWords >= 20 && stops === 0) || (restWords >= 30 && stops / restWords < 1 / 45)
  const menuCase = restWords >= THIN_WORDS && whole.caps > 0.5 && whole.func < 0.3
  const sharedRest = restWords >= 8 && whole.shared >= 0.5
  const allChrome = restA.length > 0 && restA.every(s => s.chrome || s.words < 4)
  if (noSentences) base.reasons.push(`${stops} sentence end(s) in ${restWords} words`)
  if (menuCase) base.reasons.push(`${Math.round(whole.caps * 100)}% Title Case, ${Math.round(whole.func * 100)}% grammar words`)
  if (sharedRest) base.reasons.push(`${Math.round(whole.shared * 100)}% of phrases shared with other records`)

  if (restWords === 0 || noSentences || menuCase || sharedRest || allChrome) {
    return { ...base, kind: 'boilerplate', cleaned: '' }
  }
  if (restWords < THIN_WORDS) return { ...base, kind: 'thin', cleaned: restText }
  return { ...base, kind: 'prose', cleaned: restText }
}

/** First whole sentences of prose that fit within `max` characters, else a word-boundary cut. */
export function leadingSentences(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const parts = clean.match(/[^.!?]+[.!?]+(?:\s|$)/g) || []
  let out = ''
  for (const p of parts) {
    if ((out + p).trim().length > max) break
    out += p
  }
  out = out.trim()
  if (out.length >= Math.min(80, max / 2)) return out
  // No whole sentence fits: end at the last clause boundary past 90 chars so
  // the snippet still reads as a complete thought, else cut at a word.
  const window = clean.slice(0, max - 1)
  const clause = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf(' - '), window.lastIndexOf(' – '))
  if (clause >= 90) return window.slice(0, clause).replace(/[,;:\s-]+$/, '') + '.'
  return window.slice(0, Math.max(window.lastIndexOf(' '), 60)).replace(/[,;:\s]+$/, '') + '…'
}
