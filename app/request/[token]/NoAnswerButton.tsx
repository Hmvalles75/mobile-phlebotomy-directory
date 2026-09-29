'use client'

import { useState } from 'react'

export default function NoAnswerButton({ token, providerName }: { token: string; providerName: string }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function send() {
    if (!window.confirm(`Send your request to other providers? ${providerName} will be told, and the first provider to accept will contact you.`)) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/request/${token}/no-answer`, { method: 'POST' })
      const json = await res.json()
      if (json.ok) { setMsg('Sent to other providers. Reloading…'); setTimeout(() => window.location.reload(), 800) }
      else setMsg(json.error || 'Could not send it on. Reply to your confirmation email and we will do it by hand.')
    } catch {
      setMsg('Could not reach the server. Reply to your confirmation email and we will do it by hand.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button onClick={send} disabled={busy} className="px-4 py-2 rounded-md border border-amber-400 text-amber-800 bg-white hover:bg-amber-50 disabled:opacity-50 text-sm font-medium">
        {busy ? 'Sending…' : "I haven't heard from them — send it to other providers"}
      </button>
      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
    </div>
  )
}
