// Backfill the ten premium pages' taglines and tell each provider.
//
// Dry run (default) prints before/after and the email that would go out.
//   npx tsx scripts/backfill-premium-taglines.ts
// Write the taglines and send the nine emails:
//   npx tsx scripts/backfill-premium-taglines.ts --apply
// Write without emailing (e.g. re-run after a partial failure):
//   npx tsx scripts/backfill-premium-taglines.ts --apply --no-email
//
// A provider whose tagline is already set and differs from the line below is
// skipped and reported: they or the admin wrote it, and this script must not
// overwrite it. Matched by slug. Wrapped in runAsActor so the change log
// records "admin", not "db".
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
import { sendTransactionalEmail } from '../lib/sendTransactionalEmail'
import { SITE_URL } from '../lib/seo'

const apply = process.argv.includes('--apply')
const noEmail = process.argv.includes('--no-email')

const TAGLINES: Record<string, string> = {
  'dynamic-stix': '24-hour mobile lab for the DC–Maryland area: blood draws and specimen collection at your home.',
  'cmb-group': 'At-home blood draws across all five boroughs, Northern NJ and Westchester, with same-day scheduling and multilingual staff.',
  'steves-gentle-touch-phlebotomy-and-specimen-collection-llc': 'Professional blood draws in the comfort and privacy of your home, serving Sarasota and Charlotte counties.',
  'skilled-labs-diagnostics-llc': 'Experienced mobile phlebotomy at your home, office or facility across Maryland, with scheduling built around your needs.',
  'proknostix-mobile-services': 'Routine draws, specialty kit collections and lab-ready specimen processing at your home or workplace across DC, Maryland and Virginia.',
  'graceful-needles-service': 'Over ten years of gentle, patient-first blood draws, now coming to homes across Greater Boston.',
  'fdp-phlebotomy-llc': 'A fully mobile specimen collection service for North San Diego County: doctor-ordered lab work drawn where you are.',
  'ponce-mobile-phlebotomy': 'Certified phlebotomists for at-home blood draws across Los Angeles County, with same-day and next-day appointments.',
  'bayford-mobile-medical-services': 'White-glove mobile lab draws across Northern California, with in-office and after-hours appointments in South San Francisco.',
  'sheppard-secured-services': 'Mobile blood draws, specialty kit collections and concierge lab services across the Bay Area, backed by 13+ years of clinical experience.',
}

function buildEmail(name: string, tagline: string, slug: string) {
  const first = name.trim()
  const page = `${SITE_URL}/provider/${slug}`
  const subject = 'A new line on your premium page'
  const text = `Hi ${first},

Your premium page now opens with a one-line tagline under the headline. I wrote it from your profile:

"${tagline}"

It also becomes the description Google shows for your page, so it is worth a look. If anything in it is out of date, or you would rather say it your own way, edit it any time in your dashboard under Profile, Tagline (160 characters, plain text). Changes go live within a few minutes.

Your page: ${page}
Dashboard: ${SITE_URL}/dashboard

Hector Valles
MobilePhlebotomy.org`
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.7;color:#1f2937;max-width:600px;margin:0 auto;padding:20px;">
<p>Hi ${first},</p>
<p>Your premium page now opens with a one-line tagline under the headline. I wrote it from your profile:</p>
<blockquote style="margin:12px 0;padding:12px 16px;border-left:4px solid #0d9488;background:#f0fdfa;font-size:16px;">${tagline}</blockquote>
<p>It also becomes the description Google shows for your page, so it is worth a look. If anything in it is out of date, or you would rather say it your own way, edit it any time in your dashboard under <strong>Profile &rarr; Tagline</strong> (160 characters, plain text). Changes go live within a few minutes.</p>
<p><a href="${page}">Your page</a> &middot; <a href="${SITE_URL}/dashboard">Dashboard</a></p>
<p>Hector Valles<br>MobilePhlebotomy.org</p>
</body></html>`
  return { subject, text, html }
}

async function main() {
  const rows = await prisma.provider.findMany({
    where: { slug: { in: Object.keys(TAGLINES) } },
    select: { id: true, slug: true, name: true, tagline: true, listingTier: true, removedAt: true, notificationEmail: true, claimEmail: true, email: true, notifyEnabled: true },
  })
  const bySlug = new Map(rows.map(r => [r.slug, r]))
  const missing = Object.keys(TAGLINES).filter(s => !bySlug.has(s))
  if (missing.length) console.log('NOT FOUND (check slugs):', missing.join(', '))

  const todo: { id: string; slug: string; name: string; tagline: string; to: string | null }[] = []
  for (const [slug, tagline] of Object.entries(TAGLINES)) {
    const r = bySlug.get(slug)
    if (!r) continue
    const to = r.notificationEmail || r.claimEmail || r.email || null
    const flag = r.removedAt ? 'REMOVED' : r.listingTier !== 'PREMIUM' ? `tier=${r.listingTier}` : ''
    console.log(`\n## ${r.name.trim()} (${slug}) ${flag}`)
    console.log(`   before: ${r.tagline || '(none)'}`)
    console.log(`   after:  ${tagline}  [${tagline.length} chars]`)
    console.log(`   email:  ${to || '(no address)'}${r.notifyEnabled === false ? ' notify OFF' : ''}`)
    if (r.removedAt) { console.log('   skip: removed'); continue }
    if (r.tagline && r.tagline !== tagline) { console.log('   skip: already has a different tagline (hand-written); not overwriting'); continue }
    todo.push({ id: r.id, slug, name: r.name, tagline, to })
  }

  console.log(`\n${todo.length} to write${apply ? '' : ' (dry run; add --apply)'}`)
  if (!apply) {
    if (todo[0]) { const m = buildEmail(todo[0].name, todo[0].tagline, todo[0].slug); console.log(`\n--- sample email to ${todo[0].name.trim()} ---\nSubject: ${m.subject}\n\n${m.text}`) }
    await prisma.$disconnect(); return
  }

  let written = 0, emailed = 0
  for (const t of todo) {
    await runAsActor('admin', 'scripts/backfill-premium-taglines', () => prisma.provider.update({ where: { id: t.id }, data: { tagline: t.tagline } }))
    written++
    if (noEmail) continue
    if (!t.to) { console.log(`   ${t.name.trim()}: no email address, not notified`); continue }
    const m = buildEmail(t.name, t.tagline, t.slug)
    const err = await sendTransactionalEmail({ to: t.to, subject: m.subject, text: m.text, html: m.html })
    if (err) console.log(`   ${t.name.trim()}: EMAIL FAILED ${err}`)
    else emailed++
  }
  console.log(`written ${written}, emailed ${emailed}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
