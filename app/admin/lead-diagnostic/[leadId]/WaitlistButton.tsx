'use client'

import { useState } from 'react'

/**
 * Shown on a NEEDS_COVERAGE lead. The "We're Expanding" email carries a
 * one-tap waitlist link; this is for the requester who replied "YES" by
 * email instead, or whose lead predates the link. Once waitlisted, the lead
 * gets the "a provider now covers your area" email when coverage arrives.
 */
export default function WaitlistButton({ leadId, waitlistedAt, source }: { leadId: string; waitlistedAt: string | null; source: string | null }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function add() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/waitlist`, { method: 'POST' })
      const json = await res.json()
      if (json.ok) { setMsg('On the waitlist.'); setTimeout(() => window.location.reload(), 800) }
      else setMsg(json.error || 'Failed')
    } catch (e: any) {
      setMsg(e?.message || 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-amber-900 flex-1 min-w-[16rem]">
          {waitlistedAt ? (
            <><strong>On the coverage waitlist</strong> since {new Date(waitlistedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{source ? ` (via ${source === 'link' ? 'the email link' : 'admin'})` : ''}. They get one email when a provider covers their ZIP.</>
          ) : (
            <><strong>No provider in range.</strong> If the requester replied &ldquo;YES&rdquo; to the expansion email, put them on the waitlist here so they are told when coverage arrives.</>
          )}
        </div>
        {!waitlistedAt && (
          <button onClick={add} disabled={busy} className="text-sm px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">
            {busy ? 'Adding...' : 'Add to waitlist'}
          </button>
        )}
        {msg && <div className="w-full text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  )
}
