'use client'

import { useState } from 'react'

export default function CancelRequestButton({ token }: { token: string }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function cancel() {
    if (!window.confirm('Cancel this request? It will be closed and removed from the provider’s list. You can submit a new one any time.')) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/request/${token}/cancel`, { method: 'POST' })
      const json = await res.json()
      if (json.ok) { setMsg('Cancelled. Reloading…'); setTimeout(() => window.location.reload(), 800) }
      else setMsg(json.error || 'Could not cancel. Reply to your confirmation email and we will do it by hand.')
    } catch {
      setMsg('Could not reach the server. Reply to your confirmation email and we will do it by hand.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button onClick={cancel} disabled={busy} className="px-4 py-2 rounded-md border border-red-300 text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 text-sm font-medium">
        {busy ? 'Cancelling…' : 'Cancel my request'}
      </button>
      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
    </div>
  )
}
