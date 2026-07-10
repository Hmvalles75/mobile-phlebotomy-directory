/**
 * Lightweight SendGrid account / API-key health check via the scopes endpoint.
 *   200 = key valid and account active
 *   401 = suspended / unauthorized (the 2026-06 unpaid-invoice outage)
 *   0   = no key set, or the API was unreachable
 *
 * Used by the failed-notification retry cron so it doesn't burn retry attempts
 * while SendGrid is still down, and available to any other health-gated path.
 */
export async function getSendGridScopesStatus(): Promise<number> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return 0
  try {
    const res = await fetch('https://api.sendgrid.com/v3/scopes', {
      headers: { Authorization: `Bearer ${key}` },
    })
    return res.status
  } catch {
    return 0
  }
}

export async function isSendGridHealthy(): Promise<boolean> {
  return (await getSendGridScopesStatus()) === 200
}
