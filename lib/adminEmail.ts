import sg from '@sendgrid/mail'

sg.setApiKey(process.env.SENDGRID_API_KEY!)

export async function emailAdmin(subject: string, text: string) {
  if (!process.env.ADMIN_EMAIL) {
    console.error('[adminEmail] ADMIN_EMAIL env var not set')
    return
  }

  if (!process.env.LEAD_EMAIL_FROM) {
    console.error('[adminEmail] LEAD_EMAIL_FROM env var not set')
    return
  }

  try {
    await sg.send({
      to: process.env.ADMIN_EMAIL,
      from: process.env.LEAD_EMAIL_FROM,
      subject: `[Admin] ${subject}`,
      text
    })
    console.log(`[adminEmail] Sent: ${subject}`)
  } catch (error: any) {
    console.error('[adminEmail] Failed to send email:', error.response?.body || error.message)
  }
}
