'use client'

import { useState } from 'react'

const COVERAGE_TYPES = [
  'Clinical trial / research study draws',
  'Reference lab routing (ongoing volume)',
  'Home health / hospice support',
  'Corporate wellness / employee screening',
  'One-time event or health fair',
  'Other',
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
  contactName: string
  email: string
  phone: string
  drawType: string
  statesNeeded: string
  estimatedVolume: string
  details: string
  // Honeypot — never displayed to humans
  website_url: string
}

export function CoverageRequestForm() {
  const [data, setData] = useState<FormState>({
    organizationName: '', contactName: '', email: '', phone: '',
    drawType: '', statesNeeded: '', estimatedVolume: '', details: '',
    website_url: '',
  })
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
    if (!data.drawType) e.drawType = 'Pick what kind of coverage you need'
    if (data.statesNeeded.trim().length < 2) e.statesNeeded = 'Tell us where coverage is needed'
    if (!data.estimatedVolume) e.estimatedVolume = 'Pick a volume range'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    setSubmitError('')
    try {
      const referrer = typeof document !== 'undefined' ? document.referrer || null : null
      const landingPage = typeof window !== 'undefined' ? window.location.pathname : null
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const utmSource = params?.get('utm_source') || null
      const utmMedium = params?.get('utm_medium') || null
      const utmCampaign = params?.get('utm_campaign') || null

      const res = await fetch('/api/corporate/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: data.organizationName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          drawType: data.drawType,
          location: data.statesNeeded,         // primary "where" field
          statesNeeded: data.statesNeeded,
          estimatedVolume: data.estimatedVolume,
          details: data.details,
          website_url: data.website_url,       // honeypot — server silently 200s if filled
          referrer,
          landingPage,
          utmSource,
          utmMedium,
          utmCampaign,
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
    } catch (err: any) {
      setSubmitError('Something went wrong on our end. Please email hector@mobilephlebotomy.org directly with your request.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Got it — we'll be in touch within one business day.
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-3">
          Thanks for reaching out. Your request has been logged and Hector will personally review
          it and respond at the email address you provided.
        </p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          If your need is time-sensitive, you can reply directly to the confirmation email and flag
          the timeline.
        </p>
        <p className="text-sm text-gray-400 mt-4">— MobilePhlebotomy.org</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Request Coverage</h2>
        <p className="text-sm text-gray-600">
          Share a few details about your draw needs. We'll review and respond within one business day.
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organization name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.organizationName}
          onChange={e => setField('organizationName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.organizationName ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.organizationName && <p className="text-red-500 text-sm mt-1">{errors.organizationName}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.contactName}
            onChange={e => setField('contactName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.contactName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={e => setField('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          value={data.phone}
          onChange={e => setField('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What kind of coverage do you need? <span className="text-red-500">*</span>
        </label>
        <select
          value={data.drawType}
          onChange={e => setField('drawType', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.drawType ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">Select…</option>
          {COVERAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.drawType && <p className="text-red-500 text-sm mt-1">{errors.drawType}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          States or metros where you need coverage <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.statesNeeded}
          onChange={e => setField('statesNeeded', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.statesNeeded ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g., MA, NY, IL, or 'nationwide'"
        />
        {errors.statesNeeded && <p className="text-red-500 text-sm mt-1">{errors.statesNeeded}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estimated monthly draw volume <span className="text-red-500">*</span>
        </label>
        <select
          value={data.estimatedVolume}
          onChange={e => setField('estimatedVolume', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.estimatedVolume ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">Select…</option>
          {VOLUME_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        {errors.estimatedVolume && <p className="text-red-500 text-sm mt-1">{errors.estimatedVolume}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Anything else we should know? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={data.details}
          onChange={e => setField('details', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Timeline, kit requirements, special handling, etc."
        />
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-sm">{submitError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Submitting…' : 'Request Coverage'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        We respond to all inquiries within one business day. No obligation, no automated sales
        sequence — you'll hear back from Hector directly.
      </p>
    </form>
  )
}
