'use client'

import { useState } from 'react'

/**
 * Shown on an INSTITUTIONAL_REVIEW lead. Hector owns these; this is the
 * escape hatch for a false positive (an ordinary patient the classifier
 * flagged, or a submission held because its IP was outside the US). Flips to
 * OPEN and runs the normal fan-out. `holdNote` is the intake hold reason when
 * the lead was parked by the foreign-IP guard rather than the classifier.
 */
export default function ReleaseToProvidersButton({ leadId, holdNote }: { leadId: string; holdNote?: string | null }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function release() {
    if (!window.confirm(holdNote ? 'Release this lead to the provider fan-out? Only do this if you believe it is a genuine request.' : 'Release this lead to the provider fan-out? Only do this if it is an ordinary patient request, not an institutional job.')) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/release-to-providers`, { method: 'POST' })
      const json = await res.json()
      if (json.ok) setMsg(json.sent > 0 ? `Released. Sent to ${json.sent} provider(s).` : json.parked ? 'Released, but no provider matched; parked as NEEDS_COVERAGE.' : 'Released; nothing sent.')
      else setMsg(json.error || 'Failed')
      if (json.ok) setTimeout(() => window.location.reload(), 1200)
    } catch (e: any) {
      setMsg(e?.message || 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-purple-900 flex-1 min-w-[16rem]">
          {holdNote ? (
            <><strong>Held at intake.</strong> {holdNote.replace(/^Held at intake [\d-]+: /, '')} Check the name, address and phone; a traveler or a VPN looks the same as junk from here.</>
          ) : (
            <><strong>Institutional review.</strong> Flagged high-value at intake and held back from providers. Reply to the requester with a written proposal. If this is actually a single patient, release it.</>
          )}
        </div>
        <button onClick={release} disabled={busy} className="text-sm px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
          {busy ? 'Releasing...' : 'Release to providers'}
        </button>
        {msg && <div className="w-full text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  )
}
