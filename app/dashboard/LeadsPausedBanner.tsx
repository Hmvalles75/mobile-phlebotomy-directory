'use client'

import { useState } from 'react'

/**
 * Shown on the provider dashboard after the dormant sweep has warned or
 * paused this provider. One click turns leads back on and rematches anything
 * already OPEN in their radius. See lib/dormantProviders.ts.
 */
export default function LeadsPausedBanner({ paused, warnedAt, onResumed }: { paused: boolean; warnedAt: string | null; onResumed: () => void }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function resume() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/provider/leads-resume', { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (json.ok) { setMsg('Leads are back on. Anything open in your area is on its way.'); onResumed() }
      else setMsg(json.error || 'Something went wrong. Please try again.')
    } catch {
      setMsg('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const warnedDate = warnedAt ? new Date(warnedAt).toLocaleDateString() : null

  return (
    <div className={`${paused ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} border-b px-4 py-3`}>
      <div className="container mx-auto flex flex-wrap items-center gap-3">
        <div className={`text-sm ${paused ? 'text-red-900' : 'text-amber-900'} flex-1 min-w-[16rem]`}>
          {paused ? (
            <><strong>Lead routing is paused.</strong> You received several patient requests recently and none were claimed, so we stopped sending new ones. Turn them back on any time.</>
          ) : (
            <><strong>Still want patient requests?</strong> You have received several recently without claiming any{warnedDate ? ` (noticed ${warnedDate})` : ''}. If nothing changes, routing pauses in a week. One click keeps it on.</>
          )}
        </div>
        <button onClick={resume} disabled={busy} className={`text-sm px-4 py-2 rounded-lg text-white ${paused ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'} disabled:opacity-50`}>
          {busy ? 'One moment...' : paused ? 'Turn leads back on' : 'Keep my leads on'}
        </button>
        {msg && <div className="w-full text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  )
}
