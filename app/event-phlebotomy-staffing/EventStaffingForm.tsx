'use client'

import { useState } from 'react'
import { captureFirstTouchAttribution } from '@/lib/attribution'

/**
 * Event staffing intake for /event-phlebotomy-staffing.
 *
 * Posts to /api/corporate/submit, the institutional inbox, with
 * intakeForm 'event-staffing'. It never touches the patient lead path, so an
 * event request cannot reach the provider fan-out. (On 2026-09-09 a 50-person
 * event request came in through the patient form, went to four providers, and
 * one emailed the client his own terms within the hour. This page exists so
 * that buyer has somewhere else to land.)
 *
 * The questions are the ones the first such client actually asked: date,
 * hours, headcount, who supplies kits and lab processing, and whether a COI
 * is required. Answering them here is what lets the proposal go out the same
 * day.
 */

const KIT_OPTIONS = [
  { value: 'client', label: 'We supply the collection kits and lab processing', hint: 'Most common for wellness brands and research days' },
  { value: 'need_lab', label: 'We need you to arrange the lab too', hint: 'We can quote draw plus processing through a partner lab' },
  { value: 'unsure', label: 'Not sure yet', hint: 'We will walk through it in the proposal' },
]

interface FormState {
  organizationName: string
  contactName: string
  email: string
  phone: string
  eventDates: string
  hours: string
  eventCity: string
  eventState: string
  venue: string
  attendees: string
  kits: string
  coiRequired: boolean
  details: string
  website_url: string // honeypot
}

const EMPTY: FormState = {
  organizationName: '', contactName: '', email: '', phone: '', eventDates: '', hours: '',
  eventCity: '', eventState: '', venue: '', attendees: '', kits: '', coiRequired: false,
  details: '', website_url: '',
}

function composeDetails(d: FormState): string {
  const lines: string[] = []
  const add = (label: string, value: string) => { if (value && value.trim()) lines.push(`${label}: ${value.trim()}`) }
  add('Event date(s)', d.eventDates)
  add('Hours draws should run', d.hours)
  add('Venue', d.venue)
  add('Expected attendees', d.attendees)
  add('Kits and lab', KIT_OPTIONS.find(k => k.value === d.kits)?.label || '')
  add('COI required', d.coiRequired ? 'Yes' : 'Not stated')
  if (d.details.trim()) lines.push('', 'Notes:', d.details.trim())
  return lines.join('\n')
}

export function EventStaffingForm() {
  const [data, setData] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setData(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (data.organizationName.trim().length < 2) e.organizationName = 'Organization name is required'
    if (data.contactName.trim().length < 2) e.contactName = 'Your name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) e.email = 'Valid email is required'
    if (data.eventCity.trim().length < 2) e.eventCity = 'City is required'
    if (!/^[A-Za-z]{2}$/.test(data.eventState.trim())) e.eventState = 'Two-letter state'
    if (!data.attendees.trim()) e.attendees = 'Rough headcount is required'
    if (!data.kits) e.kits = 'Pick one'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) {
      document.getElementById('event-request')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setLoading(true)
    setSubmitError('')
    try {
      const attribution = captureFirstTouchAttribution()
      const location = `${data.eventCity.trim()}, ${data.eventState.trim().toUpperCase()}`
      const res = await fetch('/api/corporate/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: data.organizationName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          drawType: 'Event / on-site phlebotomy staffing',
          location,
          eventLocation: location,
          eventVenue: data.venue,
          eventDates: data.eventDates,
          estimatedDraws: data.attendees,
          estimatedVolume: `${data.attendees.trim()} attendees`,
          timeline: data.eventDates,
          details: composeDetails(data),
          intakeForm: 'event-staffing',
          website_url: data.website_url,
          ...attribution,
        }),
      })
      const json = await res.json()
      if (res.status === 429) {
        setSubmitError(json.message || 'Too many requests from this connection. Please email hector@mobilephlebotomy.org directly.')
        return
      }
      if (!res.ok || !json.ok) {
        setSubmitError(json.message || 'Something went wrong on our end. Please email hector@mobilephlebotomy.org with the event details.')
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitError('Something went wrong on our end. Please email hector@mobilephlebotomy.org with the event details.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: keyof FormState) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors[field] ? 'border-red-500' : 'border-gray-300'}`
  const plain = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900'

  if (submitted) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Received. A written proposal follows within one business day.</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-3">
          Hector reviews every event request personally and replies with staffing, pricing, the certificate of insurance, and a short run-of-show for the day.
        </p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          If your event is inside the next ten days, reply to the confirmation email and say so. It moves to the front.
        </p>
      </div>
    )
  }

  return (
    <form id="event-request" onSubmit={submit} className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 space-y-5 text-left">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">Request an event staffing proposal</h3>
        <p className="text-sm text-gray-600">
          Five questions decide the quote: date, hours, headcount, who supplies the kits, and whether you need a COI. Everything else can wait.
        </p>
      </div>

      {/* Honeypot: hidden from humans, bots fill it; the server silently accepts and drops it. */}
      <input type="text" name="website_url" value={data.website_url} onChange={e => setField('website_url', e.target.value)} style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
          <input type="text" value={data.organizationName} onChange={e => setField('organizationName', e.target.value)} className={inputClass('organizationName')} />
          {errors.organizationName && <p className="text-red-500 text-sm mt-1">{errors.organizationName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name <span className="text-red-500">*</span></label>
          <input type="text" value={data.contactName} onChange={e => setField('contactName', e.target.value)} className={inputClass('contactName')} />
          {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Work email <span className="text-red-500">*</span></label>
          <input type="email" value={data.email} onChange={e => setField('email', e.target.value)} className={inputClass('email')} />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="tel" value={data.phone} onChange={e => setField('phone', e.target.value)} className={plain} placeholder="(555) 123-4567" />
        </div>
      </div>

      <hr className="border-gray-200" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event date or dates <span className="text-gray-400 font-normal">(optional if not set)</span></label>
          <input type="text" value={data.eventDates} onChange={e => setField('eventDates', e.target.value)} className={plain} placeholder="e.g., Oct 14, or 'a Saturday in November'" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hours draws should run <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="text" value={data.hours} onChange={e => setField('hours', e.target.value)} className={plain} placeholder="e.g., 9am to 1pm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Event city <span className="text-red-500">*</span></label>
          <input type="text" value={data.eventCity} onChange={e => setField('eventCity', e.target.value)} className={inputClass('eventCity')} placeholder="e.g., Santa Clara" />
          {errors.eventCity && <p className="text-red-500 text-sm mt-1">{errors.eventCity}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
          <input type="text" maxLength={2} value={data.eventState} onChange={e => setField('eventState', e.target.value.toUpperCase())} className={inputClass('eventState')} placeholder="CA" />
          {errors.eventState && <p className="text-red-500 text-sm mt-1">{errors.eventState}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="text" value={data.venue} onChange={e => setField('venue', e.target.value)} className={plain} placeholder="Office, hotel ballroom, community center..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected attendees <span className="text-red-500">*</span></label>
          <input type="text" value={data.attendees} onChange={e => setField('attendees', e.target.value)} className={inputClass('attendees')} placeholder="e.g., about 50" />
          {errors.attendees && <p className="text-red-500 text-sm mt-1">{errors.attendees}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Collection kits and lab processing <span className="text-red-500">*</span></label>
        <div className="space-y-2">
          {KIT_OPTIONS.map(k => (
            <label key={k.value} className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${data.kits === k.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
              <input type="radio" name="kits" checked={data.kits === k.value} onChange={() => setField('kits', k.value)} className="mt-1" />
              <span>
                <span className="block text-gray-900 font-medium">{k.label}</span>
                <span className="block text-sm text-gray-600">{k.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.kits && <p className="text-red-500 text-sm mt-1">{errors.kits}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input type="checkbox" checked={data.coiRequired} onChange={e => setField('coiRequired', e.target.checked)} />
        The venue or our company requires a certificate of insurance naming us
      </label>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Anything else <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea value={data.details} onChange={e => setField('details', e.target.value)} rows={4} className={plain} placeholder="Fasting attendees, scheduled waves, parking, badge access, special tubes..." />
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3"><p className="text-red-700 text-sm">{submitError}</p></div>
      )}

      <button type="submit" disabled={loading} className="w-full bg-blue-800 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition">
        {loading ? 'Sending...' : 'Request a written proposal'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        One reply, in writing, within one business day. No automated sales sequence, and your request is never passed to individual phlebotomists to quote.
      </p>
    </form>
  )
}
