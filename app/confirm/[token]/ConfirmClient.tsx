'use client'

import { useState } from 'react'

/**
 * The two buttons and the follow-up question.
 *
 * "No" reveals the reason picker before submitting rather than after, because
 * the reason is the useful half. "Provider never contacted me" and "provider
 * no-showed" are different failures with different fixes, and a bare NO tells
 * us which month it happened in and nothing else.
 *
 * The reason is optional -- a patient who taps No and submits immediately is
 * still a recorded answer. Requiring the detail would cost more responses than
 * the detail is worth.
 */

const REASONS: { value: string; label: string }[] = [
  { value: 'never_contacted', label: 'Provider never contacted me' },
  { value: 'no_showed', label: 'Provider contacted me but no-showed' },
  { value: 'rescheduled_pending', label: 'We rescheduled / still pending' },
  { value: 'cancelled_or_other_provider', label: 'I cancelled or found someone else' },
  { value: 'other', label: 'Other' },
]

type Phase = 'ask' | 'reason' | 'done' | 'error'

export default function ConfirmClient({
  token,
  firstName,
}: {
  token: string
  firstName: string
}) {
  const [phase, setPhase] = useState<Phase>('ask')
  const [reason, setReason] = useState('')
  const [otherText, setOtherText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [answered, setAnswered] = useState<'COMPLETED' | 'NOT_COMPLETED' | null>(null)

  async function submit(outcome: 'COMPLETED' | 'NOT_COMPLETED') {
    setBusy(true)
    try {
      const res = await fetch(`/api/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          reason:
            outcome === 'NOT_COMPLETED'
              ? reason === 'other'
                ? otherText.slice(0, 200)
                : reason || undefined
              : undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 409) {
        setAnswered(json.outcome ?? outcome)
        setPhase('done')
        return
      }
      if (!res.ok) {
        setMessage(json.error || 'Something went wrong.')
        setPhase('error')
        return
      }
      setAnswered(outcome)
      setPhase('done')
    } catch {
      setMessage('Could not reach the server. Please try again.')
      setPhase('error')
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'done') {
    return (
      <>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Thank you</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>
          {answered === 'COMPLETED'
            ? 'Glad it went ahead. Thanks for letting us know.'
            : "Sorry that didn't work out — thanks for telling us. It genuinely helps us keep the network reliable."}
        </p>
      </>
    )
  }

  if (phase === 'error') {
    return (
      <>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Hmm</h1>
        <p style={{ margin: '0 0 16px', color: '#4b5563' }}>{message}</p>
        <button onClick={() => setPhase('ask')} style={btnSecondary}>
          Try again
        </button>
      </>
    )
  }

  return (
    <>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
        {firstName ? `Hi ${firstName} — did` : 'Did'} your blood draw happen?
      </h1>
      <p style={{ margin: '0 0 20px', color: '#4b5563' }}>
        One tap is all it takes. This helps us keep our provider network reliable.
      </p>

      {phase === 'ask' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button disabled={busy} onClick={() => submit('COMPLETED')} style={btnPrimary}>
            Yes, it was completed
          </button>
          <button disabled={busy} onClick={() => setPhase('reason')} style={btnSecondary}>
            No, it didn&apos;t happen
          </button>
        </div>
      )}

      {phase === 'reason' && (
        <>
          <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
            What happened? <span style={{ fontWeight: 400, color: '#6b7280' }}>(optional)</span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {REASONS.map(r => (
              <label
                key={r.value}
                style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  style={{ marginTop: 4 }}
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>

          {reason === 'other' && (
            <textarea
              value={otherText}
              onChange={e => setOtherText(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={3}
              placeholder="Anything you'd like to add"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 10,
                border: '1px solid #d1d5db',
                borderRadius: 6,
                marginBottom: 16,
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            />
          )}

          <button disabled={busy} onClick={() => submit('NOT_COMPLETED')} style={btnPrimary}>
            {busy ? 'Sending…' : 'Submit'}
          </button>
        </>
      )}
    </>
  )
}

const btnBase: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: '#059669',
  color: '#fff',
  border: '1px solid #059669',
}

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: '#fff',
  color: '#374151',
  border: '1px solid #d1d5db',
}
