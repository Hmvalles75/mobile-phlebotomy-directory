'use client'

import { useState } from 'react'

const DRAW_TYPES = [
  'Clinical study / research',
  'Lab routing / specimen pickup',
  'Healthcare facility (SNF, assisted living, clinic)',
  'Corporate wellness',
  'One-time event',
  'Other / not sure yet',
]

const VOLUME_OPTIONS = [
  'Just exploring — not sure yet',
  'Less than 10 draws / month',
  '10–50 draws / month',
  '50–200 draws / month',
  '200+ draws / month',
  'One-time event (single date)',
]

interface FormState {
  organizationName: string
  contactName: string
  email: string
  phone: string
  statesNeeded: string
  details: string
  drawType: string
  estimatedVolume: string
}

export function CoverageRequestForm() {
  const [data, setData] = useState<FormState>({
    organizationName: '', contactName: '', email: '', phone: '',
    statesNeeded: '', details: '', drawType: '', estimatedVolume: '',
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
    if (data.phone.trim().length < 7) e.phone = 'Valid phone number is required'
    if (data.statesNeeded.trim().length < 2) e.statesNeeded = 'Tell us where coverage is needed'
    if (!data.drawType) e.drawType = 'Select what type of work this is'
    if (!data.estimatedVolume) e.estimatedVolume = 'Pick a volume range'
    if (data.details.trim().length < 10) e.details = 'Please share at least a sentence about your need'
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
          location: data.statesNeeded,  // statesNeeded doubles as the location summary for now
          statesNeeded: data.statesNeeded,
          timeline: 'See details',  // not asked separately on the lean form — captured in details
          estimatedVolume: data.estimatedVolume,
          drawType: data.drawType,
          details: data.details,
          referrer,
          landingPage,
          utmSource,
          utmMedium,
          utmCampaign,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Submission failed')
      setSubmitted(true)
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request received</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Thanks — I'll review your details personally and reply within 1-2 business days with
          availability and a coordination plan.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={data.organizationName}
          onChange={e => setField('organizationName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.organizationName ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Acme Biosciences, Inc."
        />
        {errors.organizationName && <p className="text-red-500 text-sm mt-1">{errors.organizationName}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={data.contactName}
            onChange={e => setField('contactName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.contactName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
        <input
          type="tel"
          value={data.phone}
          onChange={e => setField('phone', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="(555) 123-4567"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">States or regions where you need coverage <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={data.statesNeeded}
          onChange={e => setField('statesNeeded', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.statesNeeded ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g. CA, NY, TX or 'Northeast — MA, NY, CT, NJ'"
        />
        {errors.statesNeeded && <p className="text-red-500 text-sm mt-1">{errors.statesNeeded}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type of work <span className="text-red-500">*</span></label>
          <select
            value={data.drawType}
            onChange={e => setField('drawType', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.drawType ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select…</option>
            {DRAW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.drawType && <p className="text-red-500 text-sm mt-1">{errors.drawType}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated volume <span className="text-red-500">*</span></label>
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tell us about your need <span className="text-red-500">*</span></label>
        <textarea
          value={data.details}
          onChange={e => setField('details', e.target.value)}
          rows={5}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.details ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="What's the work? Recurring or one-off? Any timing constraints, kit requirements, FedEx workflow, doctor's order considerations, etc."
        />
        {errors.details && <p className="text-red-500 text-sm mt-1">{errors.details}</p>}
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
        {loading ? 'Submitting…' : 'Send Coverage Request'}
      </button>

      <p className="text-xs text-gray-500 text-center pt-2">
        We coordinate certified providers as your single point of contact. We don't share provider
        contact information with clients.
      </p>
    </form>
  )
}
