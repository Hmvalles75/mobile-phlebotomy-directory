'use client'

import { useState } from 'react'
import { captureFirstTouchAttribution } from '@/lib/attribution'

/**
 * Research-specific intake for /clinical-trials-mobile-phlebotomy.
 *
 * Why a separate form instead of reusing CoverageRequestForm: research buyers
 * and SNF/facility buyers need different qualifying questions. The details that
 * decide whether a study is feasible — and what it costs — are specimen
 * processing (spin? frozen? time window?) and award stage, none of which the
 * generic form asks. Asking them up front removes a full email round-trip.
 *
 * Posts to the same /api/corporate/submit endpoint. The research-only answers
 * are composed into `details` rather than getting their own columns: they are
 * read by a human at triage, never queried.
 */

const ORG_TYPES = [
  'Study sponsor',
  'CRO',
  'Academic / research institution',
  'Site or health system',
  'Decentralized trial (DCT) platform',
  'Other',
]

const STUDY_PHASES = [
  'Phase I',
  'Phase II',
  'Phase III',
  'Phase IV / post-market',
  'Observational / registry',
  'Not applicable',
]

// The single most useful triage question: a funded, awarded study is work now;
// a feasibility inquiry is a bid that may never convert. Both are worth
// answering, but not with the same urgency or the same pricing posture.
const AWARD_STAGES = [
  { value: 'Awarded — need coverage', hint: 'Study is funded and moving' },
  { value: 'Pre-award / feasibility', hint: 'Bidding or budgeting, need a quote' },
  { value: 'Exploratory', hint: 'Assessing whether mobile draws are viable' },
]

// Drives cost and which providers can even take the work.
const HANDLING_OPTIONS = [
  'Sponsor-provided kits',
  'On-site centrifuge / spin required',
  'Frozen storage or dry-ice shipping',
  'Ambient ship to central lab',
  'Processing within a strict time window',
  'Local lab drop-off',
  'Not sure yet',
]

const VOLUME_OPTIONS = [
  '1–10 draws/month',
  '11–50 draws/month',
  '51–200 draws/month',
  '200+ draws/month',
  'Not sure yet',
]

interface FormState {
  organizationName: string
  orgType: string
  contactName: string
  email: string
  phone: string
  protocolName: string
  studyPhase: string
  awardStage: string
  statesNeeded: string
  participantCount: string
  visitSchedule: string
  estimatedVolume: string
  handling: string[]
  timeline: string
  details: string
  // Honeypot — never displayed to humans
  website_url: string
}

const EMPTY: FormState = {
  organizationName: '', orgType: '', contactName: '', email: '', phone: '',
  protocolName: '', studyPhase: '', awardStage: '', statesNeeded: '',
  participantCount: '', visitSchedule: '', estimatedVolume: '', handling: [],
  timeline: '', details: '', website_url: '',
}

/** Fold the research-only answers into one readable block for triage. */
function composeDetails(d: FormState): string {
  const lines: string[] = []
  const add = (label: string, value: string) => {
    if (value && value.trim()) lines.push(`${label}: ${value.trim()}`)
  }
  add('Organization type', d.orgType)
  add('Protocol / study', d.protocolName)
  add('Phase', d.studyPhase)
  add('Stage', d.awardStage)
  add('Participants', d.participantCount)
  add('Visit schedule', d.visitSchedule)
  add('Specimen handling', d.handling.join('; '))
  if (d.details.trim()) {
    lines.push('', 'Notes:', d.details.trim())
  }
  return lines.join('\n')
}

export function ClinicalTrialIntakeForm() {
  const [data, setData] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setData(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }))
  }

  const toggleHandling = (option: string) => {
    setData(prev => ({
      ...prev,
      handling: prev.handling.includes(option)
        ? prev.handling.filter(h => h !== option)
        : [...prev.handling, option],
    }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (data.organizationName.trim().length < 2) e.organizationName = 'Organization name is required'
    if (!data.orgType) e.orgType = 'Tell us which of these you are'
    if (data.contactName.trim().length < 2) e.contactName = 'Your name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) e.email = 'Valid email is required'
    if (!data.awardStage) e.awardStage = 'Pick where the study stands'
    if (data.statesNeeded.trim().length < 2) e.statesNeeded = 'Tell us where participants are located'
    if (!data.estimatedVolume) e.estimatedVolume = 'Pick a volume range'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) {
      // Send focus to the problem rather than leaving the user hunting for it.
      document.getElementById('clinical-intake')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setLoading(true)
    setSubmitError('')
    try {
      const attribution = captureFirstTouchAttribution()

      const res = await fetch('/api/corporate/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: data.organizationName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          // Fixed for this form — the page IS the qualifier.
          drawType: 'Clinical trial / research study draws',
          location: data.statesNeeded,
          statesNeeded: data.statesNeeded,
          estimatedVolume: data.estimatedVolume,
          timeline: data.timeline,
          details: composeDetails(data),
          intakeForm: 'clinical-research',
          website_url: data.website_url,  // honeypot — server silently 200s if filled
          ...attribution,
        }),
      })
      const json = await res.json()
      if (res.status === 429) {
        setSubmitError(json.message || 'Too many requests from this connection. Please email hector@mobilephlebotomy.org directly.')
        return
      }
      if (!res.ok || !json.ok) {
        setSubmitError(json.message || 'Something went wrong on our end. Please email hector@mobilephlebotomy.org directly with your request.')
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitError('Something went wrong on our end. Please email hector@mobilephlebotomy.org directly with your request.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: keyof FormState) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`

  if (submitted) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Received — we&apos;ll respond within one business day.
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-3">
          Hector will review your study requirements personally and come back with coverage
          availability in the metros you listed, plus anything that needs clarifying before a
          feasibility answer.
        </p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          If you&apos;re working to a submission deadline, reply to the confirmation email and say so —
          it moves to the front.
        </p>
      </div>
    )
  }

  return (
    <form
      id="clinical-intake"
      onSubmit={submit}
      className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 space-y-5 text-left"
    >
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">Request a Coordination Review</h3>
        <p className="text-sm text-gray-600">
          Built for research teams — the specimen-handling and stage questions below are what
          determine feasibility, so answering them here saves a round-trip.
        </p>
      </div>

      {/* Honeypot — hidden from humans, bots fill it. Server silently 200s when present. */}
      <input
        type="text"
        name="website_url"
        value={data.website_url}
        onChange={e => setField('website_url', e.target.value)}
        style={{ position: 'absolute', left: '-9999px' }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization <span className="text-red-500">*</span>
          </label>
          <input type="text" value={data.organizationName} onChange={e => setField('organizationName', e.target.value)} className={inputClass('organizationName')} />
          {errors.organizationName && <p className="text-red-500 text-sm mt-1">{errors.organizationName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            You are a <span className="text-red-500">*</span>
          </label>
          <select value={data.orgType} onChange={e => setField('orgType', e.target.value)} className={inputClass('orgType')}>
            <option value="">Select…</option>
            {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.orgType && <p className="text-red-500 text-sm mt-1">{errors.orgType}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={data.contactName} onChange={e => setField('contactName', e.target.value)} className={inputClass('contactName')} />
          {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Work email <span className="text-red-500">*</span>
          </label>
          <input type="email" value={data.email} onChange={e => setField('email', e.target.value)} className={inputClass('email')} />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input type="tel" value={data.phone} onChange={e => setField('phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="(555) 123-4567" />
      </div>

      <hr className="border-gray-200" />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Where does this study stand? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {AWARD_STAGES.map(s => (
            <label
              key={s.value}
              className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                data.awardStage === s.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="awardStage"
                checked={data.awardStage === s.value}
                onChange={() => setField('awardStage', s.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-gray-900 font-medium">{s.value}</span>
                <span className="block text-sm text-gray-600">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.awardStage && <p className="text-red-500 text-sm mt-1">{errors.awardStage}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Protocol / study name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input type="text" value={data.protocolName} onChange={e => setField('protocolName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Internal ID is fine" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phase <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select value={data.studyPhase} onChange={e => setField('studyPhase', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select…</option>
            {STUDY_PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          States or metros where participants are located <span className="text-red-500">*</span>
        </label>
        <input type="text" value={data.statesNeeded} onChange={e => setField('statesNeeded', e.target.value)} className={inputClass('statesNeeded')} placeholder="e.g., Boston, Chicago, Phoenix — or 'nationwide'" />
        {errors.statesNeeded && <p className="text-red-500 text-sm mt-1">{errors.statesNeeded}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Participants <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input type="text" value={data.participantCount} onChange={e => setField('participantCount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 40 enrolled" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Visits per participant <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input type="text" value={data.visitSchedule} onChange={e => setField('visitSchedule', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., baseline + 3 monthly" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estimated monthly draw volume <span className="text-red-500">*</span>
        </label>
        <select value={data.estimatedVolume} onChange={e => setField('estimatedVolume', e.target.value)} className={inputClass('estimatedVolume')}>
          <option value="">Select…</option>
          {VOLUME_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        {errors.estimatedVolume && <p className="text-red-500 text-sm mt-1">{errors.estimatedVolume}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specimen handling <span className="text-gray-400 font-normal">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {HANDLING_OPTIONS.map(option => (
            <label
              key={option}
              className={`flex items-center gap-2 p-2.5 border rounded-md cursor-pointer text-sm transition-colors ${
                data.handling.includes(option) ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input type="checkbox" checked={data.handling.includes(option)} onChange={() => toggleHandling(option)} />
              <span className="text-gray-800">{option}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Spin, freeze, and time-window requirements narrow which providers can take the work — this
          is the fastest way to a straight answer on feasibility.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target start / timeline <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input type="text" value={data.timeline} onChange={e => setField('timeline', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., first visits in September, or bid due 8/15" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Anything else <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea value={data.details} onChange={e => setField('details', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Special populations, IRB constraints, training requirements, etc." />
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-sm">{submitError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-800 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Submitting…' : 'Request Coordination Review'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        We respond to every inquiry within one business day. No obligation and no automated sales
        sequence — you&apos;ll hear back from Hector directly.
      </p>
    </form>
  )
}
