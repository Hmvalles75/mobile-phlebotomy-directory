import sg from '@sendgrid/mail'

sg.setApiKey(process.env.SENDGRID_API_KEY!)

export async function emailAdmin(subject: string, text: string) {
  if (!process.env.ADMIN_EMAIL) {
    console.error('[adminEmail] ADMIN_EMAIL env var not set')
    return
  }

  try {
    await sg.send({
      to: process.env.ADMIN_EMAIL,
      // Hard-coded verified sender — `LEAD_EMAIL_FROM` previously pointed at
      // unverified addresses (noreply@, leads@) and SendGrid silently rejected
      // every admin notification. `hector@` is the only confirmed-verified sender.
      from: 'hector@mobilephlebotomy.org',
      subject: `[Admin] ${subject}`,
      text
    })
    console.log(`[adminEmail] Sent: ${subject}`)
  } catch (error: any) {
    console.error('[adminEmail] Failed to send email:', error.response?.body || error.message)
  }
}
