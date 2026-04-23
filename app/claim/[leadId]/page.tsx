'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Clock, MapPin, Phone, Mail, FileText } from 'lucide-react'

interface Lead {
  id: string
  fullName: string
  phone: string
  email?: string
  address1?: string
  city: string
  state: string
  zip: string
  urgency: 'STANDARD' | 'STAT'
  notes?: string
  priceCents: number
}

export default function ClaimLeadPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const leadId = params.leadId as string
  const providerFromUrl = searchParams.get('provider')

  const [loading, setLoading] = useState(true)
  const [leadStatus, setLeadStatus] = useState<'open' | 'claimed' | 'unknown'>('unknown')
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leadData, setLeadData] = useState<Lead | null>(null)
  const [releasing, setReleasing] = useState(false)
  const [released, setReleased] = useState(false)
  const [releaseError, setReleaseError] = useState<string | null>(null)
  const [outcomeSaving, setOutcomeSaving] = useState(false)
  const [outcomeSaved, setOutcomeSaved] = useState<string | null>(null)  // label of last saved outcome
  const [outcomeError, setOutcomeError] = useState<string | null>(null)
  const [isTrial, setIsTrial] = useState(false)
  const [providerId, setProviderId] = useState<string>('')
  const [providerName, setProviderName] = useState<string>('')
  const [isTrialActive, setIsTrialActive] = useState(false)
  const [leadPreview, setLeadPreview] = useState<{
    zip: string
    city: string
    state: string
    urgency: 'STANDARD' | 'STAT'
    priceCents: number
  } | null>(null)

  useEffect(() => {
    // If provider ID is in the URL (one-click claim from email), auto-claim OR
    // if the lead is already claimed BY THEM, surface the patient details
    if (providerFromUrl) {
      setProviderId(providerFromUrl)
      checkLeadStatus(providerFromUrl).then(alreadyOwnedByViewer => {
        if (!alreadyOwnedByViewer) {
          autoClaim(providerFromUrl)
        }
      })
    } else {
      // Dashboard flow — use session cookie; API will detect ownership automatically
      checkLeadStatus(null)
      fetchProviderSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, providerFromUrl])

  // Outcome buttons: one-click capture so we finally have real lead-quality data.
  // The "complete" action flips status to DELIVERED; everything else is a simple
  // outcome update (lead stays CLAIMED so the provider can keep working it).
  async function handleOutcome(outcome: string, label: string, isComplete: boolean) {
    if (!providerId) {
      setOutcomeError('Missing provider context — refresh the page and try again.')
      return
    }
    setOutcomeSaving(true)
    setOutcomeError(null)
    try {
      const response = await fetch(`/api/leads/${leadId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isComplete ? 'complete' : 'update_outcome',
          outcome,
          providerId,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setOutcomeSaved(label)
      } else {
        setOutcomeError(data.error || 'Failed to save outcome')
      }
    } catch (err: any) {
      setOutcomeError(err.message || 'Network error while saving outcome')
    } finally {
      setOutcomeSaving(false)
    }
  }

  async function handleRelease(reason: string) {
    if (!leadData || !providerId) return
    const confirmed = window.confirm(
      'Release this lead back to the pool?\n\n' +
      'Other providers in the area will be re-notified and can claim it. ' +
      'You will no longer have access to this patient\'s contact info.\n\n' +
      'Only release if you can\'t fulfill this request (no contact, scheduling conflict, wrong service type, etc.).'
    )
    if (!confirmed) return

    setReleasing(true)
    setReleaseError(null)
    try {
      const response = await fetch('/api/lead/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, providerId, reason }),
      })
      const data = await response.json()
      if (data.ok) {
        setReleased(true)
      } else {
        setReleaseError(data.error || 'Failed to release lead')
      }
    } catch (err: any) {
      setReleaseError(err.message || 'Network error while releasing lead')
    } finally {
      setReleasing(false)
    }
  }

  async function autoClaim(pid: string) {
    setClaiming(true)
    try {
      const response = await fetch('/api/lead/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, providerId: pid })
      })
      const data = await response.json()

      if (data.ok) {
        setLeadData(data.lead)
        setIsTrial(data.isTrial)
        setClaimed(true)
        setLeadStatus('claimed')
      } else {
        if (data.error === 'ALREADY_CLAIMED') {
          setLeadStatus('claimed')
          setError('This patient has already been claimed by another provider.')
        } else {
          setError(data.error || 'Failed to claim lead')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to claim lead')
    } finally {
      setClaiming(false)
      setLoading(false)
    }
  }

  async function fetchProviderSession() {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (data.ok && data.session) {
        setProviderId(data.session.providerId)
        setProviderName(data.session.name)
        setIsTrialActive(data.session.isTrialActive || false)
      }
    } catch (err) {
      console.error('Failed to fetch session:', err)
    }
  }

  async function checkLeadStatus(providerIdOverride?: string | null): Promise<boolean> {
    // Returns true if the lead is already claimed by the current viewer (so caller can skip auto-claim)
    try {
      // Pass providerId from URL if available so the API can detect claim ownership
      // even when there's no dashboard session cookie (email link flow)
      const qs = new URLSearchParams({ leadId })
      if (providerIdOverride) qs.set('providerId', providerIdOverride)
      const response = await fetch(`/api/lead/status?${qs.toString()}`)
      const data = await response.json()

      if (!data.ok) {
        setError(data.error || 'Failed to check lead status')
        return false
      }

      setLeadStatus(data.status)

      // If the viewer owns the claim, surface the patient details immediately.
      // This fixes the case where a provider claims successfully, then revisits
      // the URL and previously got an "already claimed by someone else" page.
      if (data.isClaimedByYou && data.lead) {
        setLeadData(data.lead)
        setClaimed(true)
        return true
      }

      // Otherwise store preview info (no PHI) for open leads
      if (data.zip && data.city && data.state) {
        setLeadPreview({
          zip: data.zip,
          city: data.city,
          state: data.state,
          urgency: data.urgency,
          priceCents: data.priceCents,
        })
      }
      return false
    } catch (err: any) {
      setError(err.message || 'Failed to check lead status')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleClaim() {
    if (!providerId) {
      setError('Please enter your Provider ID to claim this lead')
      return
    }

    setClaiming(true)
    setError(null)

    try {
      const response = await fetch('/api/lead/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, providerId })
      })

      const data = await response.json()

      if (data.ok) {
        setLeadData(data.lead)
        setIsTrial(data.isTrial)
        setClaimed(true)
        setLeadStatus('claimed')
      } else {
        if (data.error === 'ALREADY_CLAIMED') {
          setLeadStatus('claimed')
          setError('Sorry, this lead has already been claimed by another provider!')
        } else {
          setError(data.error || 'Failed to claim lead')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to claim lead')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    )
  }

  // Lead already claimed by someone else
  if (leadStatus === 'claimed' && !claimed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lead Already Claimed
          </h1>
          <p className="text-gray-600 mb-6">
            Sorry, this lead has already been claimed by another provider. Better luck next time!
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Successfully claimed - show lead details
  if (released) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Released</h1>
          <p className="text-gray-600 mb-6">
            This lead is back in the pool. Other providers in the area have been re-notified and can claim it.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  if (claimed && leadData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="text-green-600 flex-shrink-0" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-green-900 mb-2">
                  Lead Claimed Successfully!
                </h1>
                <p className="text-green-800">
                  You now have access to this patient&apos;s contact information. Reach out ASAP!
                </p>
              </div>
            </div>
          </div>

          {/* Patient Contact Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="text-primary-600" size={24} />
              Patient Contact Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                <p className="text-lg font-semibold text-gray-900">{leadData.fullName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                <a
                  href={`tel:${leadData.phone}`}
                  className="text-lg font-semibold text-primary-600 hover:text-primary-700"
                >
                  {leadData.phone}
                </a>
              </div>

              {leadData.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <a
                    href={`mailto:${leadData.email}`}
                    className="text-lg text-primary-600 hover:text-primary-700"
                  >
                    {leadData.email}
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  <MapPin className="inline mr-1" size={16} />
                  Location
                </label>
                <p className="text-gray-900">
                  {leadData.address1 && `${leadData.address1}, `}
                  {leadData.city}, {leadData.state} {leadData.zip}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Urgency</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  leadData.urgency === 'STAT'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {leadData.urgency === 'STAT' ? '🚨 STAT (Urgent)' : '📋 Standard'}
                </span>
              </div>

              {leadData.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    <FileText className="inline mr-1" size={16} />
                    Additional Notes
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{leadData.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
            <div className="space-y-3">
              <a
                href={`tel:${leadData.phone}`}
                className="block w-full bg-primary-600 text-white text-center px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                📞 Call Patient Now
              </a>
              {leadData.email && (
                <a
                  href={`mailto:${leadData.email}`}
                  className="block w-full bg-white border-2 border-gray-300 text-gray-700 text-center px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  ✉️ Send Email
                </a>
              )}
              <a
                href="/dashboard"
                className="block w-full bg-white border-2 border-gray-300 text-gray-700 text-center px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                View Dashboard
              </a>
            </div>

            {/* Outcome capture — one-click report so we can measure lead quality */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">How did this lead turn out?</h4>
              <p className="text-xs text-gray-500 mb-3">
                One click to tell us what happened. Helps us improve lead quality for you and other providers.
              </p>
              {outcomeSaved && (
                <div className="mb-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded p-2">
                  ✓ Outcome saved: <strong>{outcomeSaved}</strong>. Thank you!
                </div>
              )}
              {outcomeError && (
                <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  {outcomeError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOutcome('APPOINTMENT_BOOKED', 'Booked', false)}
                  disabled={outcomeSaving}
                  className="px-3 py-2 border-2 border-green-300 text-green-800 bg-green-50 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  ✅ Booked
                </button>
                <button
                  onClick={() => handleOutcome('APPOINTMENT_COMPLETED', 'Completed', true)}
                  disabled={outcomeSaving}
                  className="px-3 py-2 border-2 border-green-400 text-green-900 bg-green-100 rounded-lg hover:bg-green-200 transition-colors font-semibold text-sm disabled:opacity-50"
                >
                  ✅ Completed
                </button>
                <button
                  onClick={() => handleOutcome('NO_ANSWER', 'No answer', false)}
                  disabled={outcomeSaving}
                  className="px-3 py-2 border-2 border-amber-300 text-amber-800 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  📞 No answer
                </button>
                <button
                  onClick={() => handleOutcome('NO_ORDER', 'No doctor\'s order', false)}
                  disabled={outcomeSaving}
                  className="px-3 py-2 border-2 border-gray-300 text-gray-800 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  📋 No order
                </button>
                <button
                  onClick={() => handleOutcome('DECLINED', 'Won\'t pay / declined', false)}
                  disabled={outcomeSaving}
                  className="px-3 py-2 border-2 border-gray-300 text-gray-800 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  💰 Won&apos;t pay
                </button>
                <button
                  onClick={() => handleOutcome('WRONG_SERVICE', 'Wrong service', false)}
                  disabled={outcomeSaving}
                  className="px-3 py-2 border-2 border-gray-300 text-gray-800 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  🔀 Wrong service
                </button>
              </div>
            </div>

            {/* Release this lead — secondary action */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Can&apos;t fulfill this lead?</h4>
              <p className="text-xs text-gray-500 mb-3">
                If you can&apos;t reach the patient, have a scheduling conflict, or this isn&apos;t the right service type for you, release it back to the pool so another provider in the area can help.
              </p>
              {releaseError && (
                <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  {releaseError}
                </div>
              )}
              <button
                onClick={() => handleRelease('OTHER')}
                disabled={releasing}
                className="w-full bg-white border-2 border-amber-300 text-amber-800 text-center px-6 py-2.5 rounded-lg hover:bg-amber-50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {releasing ? 'Releasing...' : '↩︎ Release this lead back to the pool'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Lead is available for claiming
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Clock className="mx-auto h-16 w-16 text-primary-600 mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            New Patient Lead Available!
          </h1>
          <p className="text-gray-600">
            Be the first to claim this lead and connect with the patient.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Provider Info */}
        {providerId && providerName && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Logged in as:</strong> {providerName}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Provider ID: {providerId}
            </p>
          </div>
        )}

        {!providerId && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Not logged in.</strong> Please <a href="/dashboard/login" className="text-primary-600 underline">login</a> to claim leads.
            </p>
          </div>
        )}

        {/* Lead Preview Info */}
        {leadPreview && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <MapPin size={18} />
              Lead Preview
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Location:</span>
                <span className="font-semibold text-blue-900">{leadPreview.city}, {leadPreview.state} {leadPreview.zip}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Urgency:</span>
                <span className={`font-semibold ${leadPreview.urgency === 'STAT' ? 'text-red-600' : 'text-blue-900'}`}>
                  {leadPreview.urgency === 'STAT' ? '🚨 STAT (Urgent)' : '📋 Standard'}
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3 italic">
              Full patient contact info will be revealed after you claim this lead.
            </p>
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming || !providerId}
          className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {claiming ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Claiming Lead...
            </span>
          ) : (
            '🏆 CLAIM THIS LEAD'
          )}
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> By claiming this lead, you will receive the patient&apos;s full contact information. Please reach out to them promptly.
          </p>
        </div>
      </div>
    </div>
  )
}
