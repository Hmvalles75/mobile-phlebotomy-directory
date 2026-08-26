'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Messages from the public /contact form.
 *
 * That form discarded every submission for twelve months — its handler was a
 * `console.log`. It was fixed on 2026-08-25 and shipped without a panel, on the
 * reasoning that the alert email carries the whole message. A day later a
 * corporate event inquiry arrived through it and could not be found in /admin,
 * because that panel reads coverage_requests and this is a different table. A
 * message recorded and never shown is a quieter version of one that was lost.
 */

interface ContactMessage {
  id: string
  createdAt: string
  userType: string
  name: string
  email: string
  subject: string
  message: string
  status: 'NEW' | 'READ' | 'REPLIED' | 'SPAM'
  notifiedAt?: string | null
  notifyError?: string | null
  ipAddress?: string | null
}

interface Counts {
  new: number
  unnotifiedMessages: number
  unnotifiedCoverage: number
  attention: number
}

const USER_TYPE_LABEL: Record<string, string> = {
  patient: 'Patient',
  provider: 'Provider',
  business: 'Business / corporate',
  media: 'Media / press',
  other: 'Other',
}

const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-red-100 text-red-800',
  READ: 'bg-yellow-100 text-yellow-800',
  REPLIED: 'bg-green-100 text-green-800',
  SPAM: 'bg-gray-100 text-gray-600',
}

export function MessagesPanel() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [includeSpam, setIncludeSpam] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/contact-messages?includeSpam=' + includeSpam, {
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to load messages')
        return
      }
      setMessages(json.messages)
      setCounts(json.counts)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [includeSpam])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (id: string, status: ContactMessage['status']) => {
    // Optimistic; the list reloads immediately after.
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, status } : m)))
    try {
      await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      })
      load()
    } catch {
      setError('Could not update that message.')
    }
  }

  if (loading) return <div className="text-gray-500 py-8">Loading messages…</div>

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Anything that arrived without an alert going out. The notifiedAt /
          adminNotifiedAt columns exist so this is a query, not a guess. */}
      {counts && (counts.unnotifiedMessages > 0 || counts.unnotifiedCoverage > 0) && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-900 mb-1">Arrived without a notification</h3>
          <p className="text-amber-800 text-sm">
            {counts.unnotifiedMessages > 0 && (
              <>{counts.unnotifiedMessages} contact message{counts.unnotifiedMessages !== 1 ? 's' : ''} </>
            )}
            {counts.unnotifiedMessages > 0 && counts.unnotifiedCoverage > 0 && 'and '}
            {counts.unnotifiedCoverage > 0 && (
              <>{counts.unnotifiedCoverage} coverage request{counts.unnotifiedCoverage !== 1 ? 's' : ''} </>
            )}
            reached us without the alert email going out. They are listed below, or under Coverage
            Requests.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
          {counts && counts.new > 0 && (
            <span className="ml-2 font-medium text-red-700">{counts.new} new</span>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={includeSpam}
            onChange={e => setIncludeSpam(e.target.checked)}
          />
          Show honeypot / spam
        </label>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No messages yet.</div>
      ) : (
        <div className="space-y-3">
          {messages.map(m => {
            const open = expanded === m.id
            const mailto =
              'mailto:' + m.email + '?subject=' + encodeURIComponent('Re: ' + m.subject)
            return (
              <div key={m.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status]}`}
                      >
                        {m.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {USER_TYPE_LABEL[m.userType] || m.userType}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                      {!m.notifiedAt && m.status !== 'SPAM' && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
                          title={m.notifyError || 'No alert email was sent'}
                        >
                          not notified
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 mt-1 truncate">{m.subject}</p>
                    <p className="text-sm text-gray-600">
                      {m.name} &middot;{' '}
                      <a href={mailto} className="text-primary-700 hover:underline">
                        {m.email}
                      </a>
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(open ? null : m.id)}
                    className="text-sm text-primary-700 hover:underline whitespace-nowrap"
                  >
                    {open ? 'Hide' : 'Read'}
                  </button>
                </div>

                {open && (
                  <>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-gray-800 bg-gray-50 rounded p-3 overflow-x-auto">
                      {m.message}
                    </pre>
                    {m.notifyError && (
                      <p className="mt-2 text-xs text-amber-800">Alert failed: {m.notifyError}</p>
                    )}
                  </>
                )}

                <div className="mt-3 flex gap-2">
                  {(['READ', 'REPLIED', 'SPAM'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(m.id, s)}
                      disabled={m.status === s}
                      className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Mark {s.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
