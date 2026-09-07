'use client'

import { useState } from 'react'

type Recipient = { providerId: string; name: string; email: string | null; alreadyNotified: boolean; sent: boolean; skipped?: string }
type Result = { ok: boolean; reason?: string; error?: string; dryRun: boolean; hoursOpen: number; sent: number; skipped: number; recipients: Recipient[] }

/**
 * "Still unclaimed" re-send for an OPEN lead. Preview lists who would get it;
 * Send actually sends. Same-origin fetch carries the admin session cookie.
 */
export default function RenotifyButton({ leadId, hoursOpen, notified }: { leadId: string; hoursOpen: number; notified: number }) {
  const [includeNew, setIncludeNew] = useState(false)
  const [busy, setBusy] = useState<'preview' | 'send' | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  async function run(dryRun: boolean) {
    if (!dryRun && !window.confirm(`Send a "still unclaimed" reminder for this lead to ${result?.recipients.filter(r => !r.skipped).length ?? 'the matched'} provider(s)?`)) return
    setBusy(dryRun ? 'preview' : 'send')
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/renotify${dryRun ? '?dryRun=1' : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeNew }),
      })
      setResult(await res.json())
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || 'Request failed', dryRun, hoursOpen, sent: 0, skipped: 0, recipients: [] })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-amber-900">
          <strong>Still unclaimed</strong> after {hoursOpen}h, sent to {notified} provider{notified === 1 ? '' : 's'}.
          Re-send with a &ldquo;patient still waiting&rdquo; subject line.
        </div>
        <label className="text-sm text-amber-900 flex items-center gap-1">
          <input type="checkbox" checked={includeNew} onChange={e => setIncludeNew(e.target.checked)} />
          also send to providers the matcher would add today
        </label>
        <button onClick={() => run(true)} disabled={busy !== null} className="text-sm px-3 py-1.5 rounded border border-amber-400 bg-white text-amber-900 hover:bg-amber-100 disabled:opacity-50">
          {busy === 'preview' ? 'Checking...' : 'Preview'}
        </button>
        <button onClick={() => run(false)} disabled={busy !== null || !result || !result.ok} className="text-sm px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50" title={!result ? 'Preview first' : ''}>
          {busy === 'send' ? 'Sending...' : 'Send reminder'}
        </button>
      </div>
      {result && (
        <div className="mt-3 text-sm">
          {result.reason || result.error ? (
            <div className="text-red-700">{result.reason || result.error}</div>
          ) : (
            <div className="text-amber-900">
              {result.dryRun ? 'Would send to' : 'Sent to'} {result.dryRun ? result.recipients.filter(r => !r.skipped).length : result.sent}
              {result.skipped > 0 ? `, skipped ${result.skipped}` : ''}:
              <ul className="mt-1 ml-4 list-disc">
                {result.recipients.map(r => (
                  <li key={r.providerId}>
                    {r.name} <span className="text-gray-500">{r.email || 'no email'}</span>
                    {r.alreadyNotified ? '' : <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">new</span>}
                    {r.skipped ? <span className="ml-1 text-xs text-gray-500">skipped: {r.skipped}</span> : ''}
                    {!result.dryRun && r.sent ? <span className="ml-1 text-xs text-green-700">sent</span> : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
