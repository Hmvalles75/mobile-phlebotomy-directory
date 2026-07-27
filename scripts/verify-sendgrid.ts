/**
 * Verify the local SENDGRID_API_KEY works, and preview the patient
 * confirmation email.
 *
 *   npx tsx scripts/verify-sendgrid.ts            # check credentials only
 *   npx tsx scripts/verify-sendgrid.ts --send     # also send a real test email
 *
 * The default is credential-check-only so running it can never surprise
 * anyone with an email.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import sg from '@sendgrid/mail'
import { buildLeadConfirmation, sendLeadConfirmationToPatient } from '../lib/leadConfirmation'

const TO = process.env.ADMIN_EMAIL || 'hector@mobilephlebotomy.org'
const FROM = 'hector@mobilephlebotomy.org'

async function main() {
  const key = process.env.SENDGRID_API_KEY
  if (!key) {
    console.log('❌ SENDGRID_API_KEY is not set in .env.local')
    process.exitCode = 1
    return
  }
  console.log(`key present — length ${key.length}, prefix ${key.slice(0, 7)}…`)
  if (!key.startsWith('SG.')) {
    console.log('⚠️  SendGrid keys normally start with "SG." — this may be the wrong value')
  }

  sg.setApiKey(key)

  // Cheapest possible credential check: a send with an invalid recipient fails
  // on validation AFTER auth, so a 401/403 means bad credentials while a 400
  // means the key is good. Avoids sending anything.
  try {
    await sg.send({ to: 'invalid', from: FROM, subject: 'x', text: 'x' })
    console.log('unexpected success on a deliberately invalid send')
  } catch (err: any) {
    const code = err?.code ?? err?.response?.statusCode
    const msg = err?.response?.body?.errors?.[0]?.message || err?.message || ''
    if (code === 401 || code === 403 || /wrong credentials|permission denied/i.test(msg)) {
      console.log(`❌ CREDENTIALS REJECTED (${code}): ${msg}`)
      console.log('   The key is invalid, revoked, or lacks Mail Send permission.')
      process.exitCode = 1
      return
    }
    console.log(`✅ Credentials accepted (rejected only the fake recipient: ${code} ${msg})`)
  }

  const preview = buildLeadConfirmation({
    id: 'verify', fullName: 'Test Patient', email: TO,
    city: 'Sarasota', state: 'FL', urgency: 'STANDARD',
  })
  console.log(`\nPatient confirmation subject:\n  ${preview.subject}`)

  if (!process.argv.includes('--send')) {
    console.log('\n(no email sent — re-run with --send to deliver a real test)')
    return
  }

  console.log(`\nSending test confirmation to ${TO} …`)
  const ok = await sendLeadConfirmationToPatient({
    id: 'verify-send', fullName: 'Test Patient', email: TO,
    city: 'Sarasota', state: 'FL', urgency: 'STANDARD',
  })
  console.log(ok ? '✅ Sent — check that inbox' : '❌ Send failed, see error above')
  if (!ok) process.exitCode = 1
}

main()
