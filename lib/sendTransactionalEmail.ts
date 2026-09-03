import sg from '@sendgrid/mail'

/**
 * One-way transactional send over SendGrid, reporting failure instead of
 * swallowing it.
 *
 * Three call sites used to POST to api.resend.com behind
 * `if (!process.env.RESEND_API_KEY) return false`. That key has never been
 * configured in this project, so all three returned false on their first line
 * and always had:
 *
 *   - the coverage-request confirmation, so no institutional prospect has ever
 *     received an acknowledgement after submitting the form
 *   - the business-claim admin notification
 *   - the business-claim verification email to the claimant
 *
 * Commit f1a1200 (2026-07-14) moved the institutional ADMIN alert off Resend
 * for exactly this reason and left the other three behind.
 *
 * Returns null on success, or a short error string suitable for storing on a
 * row. Callers should record that rather than discarding it — a send that fails
 * silently is how a Binghamton University research request went unanswered
 * until they wrote in a second time.
 */

/**
 * Hard-coded verified sender. LEAD_EMAIL_FROM previously pointed at unverified
 * addresses (noreply@, leads@) and SendGrid rejected every message sent from
 * them; hector@ is the only confirmed-verified sender on the account.
 */
export const VERIFIED_SENDER = 'hector@mobilephlebotomy.org'
export const SENDER_NAME = 'Hector Valles'

export interface TransactionalEmail {
  to: string
  subject: string
  text: string
  replyTo?: string
  /**
   * Optional HTML alternative. `text` stays required and must carry the whole
   * message on its own -- it is the fallback, not a summary.
   *
   * Added for the patient completion confirmation, which needs a tappable
   * button. The alternative was a second direct sg.send() call site, and the
   * reason not to is the error-string return below: callers depend on it to
   * decide whether to record that a send happened, and a second path would
   * have to reimplement that and then keep it in step.
   */
  html?: string
}

export async function sendTransactionalEmail(
  message: TransactionalEmail
): Promise<string | null> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return 'SENDGRID_API_KEY not configured'

  try {
    sg.setApiKey(key)
    await sg.send({
      to: message.to,
      from: { email: VERIFIED_SENDER, name: SENDER_NAME },
      replyTo: message.replyTo || VERIFIED_SENDER,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    })
    return null
  } catch (error: any) {
    const detail =
      error?.response?.body?.errors?.[0]?.message || error?.message || String(error)
    console.error(`[email] send to ${message.to} failed:`, detail)
    return String(detail).slice(0, 500)
  }
}
