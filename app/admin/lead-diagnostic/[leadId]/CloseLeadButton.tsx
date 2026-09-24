'use client'

import { useState } from 'react'

/**
 * Close a lead by hand. Collapsed to one link until opened so it does not
 * compete with the release / reminder panels above it. Nothing is deleted or
 * re-offered; see app/api/admin/leads/[leadId]/close.
 */
const OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'CLOSED_DUPLICATE', label: 'Duplicate / junk', hint: 'Same patient re-submitted, a test, or a fake request' },
  { value: 'CLOSED_DECLINED', label: 'Patient declined', hint: 'Reached and said no (price, changed mind)' },
  { value: 'CLOSED_UNCONFIRMED', label: 'Patient went quiet', hint: 'Never confirmed or answered anyone' },
  { value: 'CLOSED_PRICING_ONLY', label: 'Pricing inquiry only', hint: 'Wanted a number, not a draw' },
  { value: 'EXPIRED_NO_RESPONSE', label: 'Expired, no provider took it', hint: 'Providers were notified and none claimed' },
]

export default function CloseLeadButton({ leadId, currentStatus }: { leadId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(OPTIONS[0].value)
  const [note, setNote] = useState('')
  const [junk, setJunk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function close() {
    if (!note.trim()) { setMsg('Add a one-line note first.'); return }
    if (!window.confirm(`Close this lead as ${status}? It will not be re-offered.`)) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: note.trim(), junk }),
      })
      const json = await res.json()
      if (json.ok) {
        setMsg(`Closed (${json.from} → ${json.status})${json.providerTold ? '; the claiming provider was emailed' : ''}.`)
        setTimeout(() => window.location.reload(), 1000)
      } else setMsg(json.error || 'Failed')
    } catch (e: any) {
      setMsg(e?.message || 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div className="mb-6 text-sm">
        <button onClick={() => setOpen(true)} className="text-gray-500 hover:text-gray-800 underline">
          Close this lead by hand ({currentStatus})
        </button>
      </div>
    )
  }

  const hint = OPTIONS.find(o => o.value === status)?.hint

  return (
    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
      <div className="text-sm text-gray-800 mb-3"><strong>Close lead.</strong> Nothing is deleted or re-offered; the claim history stays. Currently {currentStatus}.</div>
      <div className="flex flex-wrap items-start gap-3">
        <label className="text-sm text-gray-800 flex flex-col gap-1">
          Reason
          <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white">
            {OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hint && <span className="text-xs text-gray-500">{hint}</span>}
        </label>
        <label className="text-sm text-gray-800 flex flex-col gap-1 flex-1 min-w-[16rem]">
          Note (required, goes on the lead)
          <input value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="e.g. same sender as cmxx…, IP in Pakistan" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <label className="text-sm text-gray-800 flex items-center gap-1">
          <input type="checkbox" checked={junk} onChange={e => setJunk(e.target.checked)} />
          junk: also clear the high-value flag and estimated value
        </label>
        <button onClick={close} disabled={busy} className="text-sm px-3 py-1.5 rounded bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50">
          {busy ? 'Closing...' : 'Close lead'}
        </button>
        <button onClick={() => setOpen(false)} disabled={busy} className="text-sm text-gray-500 hover:text-gray-800 underline">Cancel</button>
        {msg && <div className="w-full text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  )
}
