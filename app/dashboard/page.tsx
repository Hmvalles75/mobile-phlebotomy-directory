'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Star, TrendingUp, Users, LogOut, AlertCircle, Clock, Zap, Settings, MapPin, Calendar, Save, CheckCircle, Building2 } from 'lucide-react'
import Link from 'next/link'
import { PremiumPricingModal } from '@/components/ui/PremiumPricingModal'

interface Lead {
  id: string
  createdAt: string
  fullName: string
  phone: string
  email?: string
  city: string
  state: string
  zip: string
  urgency: 'STANDARD' | 'STAT'
  status: 'NEW' | 'DELIVERED' | 'REFUNDED' | 'UNSOLD' | 'CLAIMED'
  priceCents: number
  notes?: string
  routedAt?: string
  claimedAt?: string | null
  outcome?: string | null
  outcomeNotes?: string | null
  appointmentDate?: string | null
  isHighValue?: boolean
  drawCount?: string | null
  hasDoctorOrder?: string | null
  paymentMethod?: string | null
}

const OUTCOME_LABEL: Record<string, { label: string; color: string }> = {
  APPOINTMENT_BOOKED:   { label: '✅ Booked',        color: 'bg-green-100 text-green-800 border-green-200' },
  APPOINTMENT_COMPLETED:{ label: '✅ Completed',     color: 'bg-green-200 text-green-900 border-green-300' },
  CONTACTED:            { label: '☎️ Contacted',     color: 'bg-blue-100 text-blue-800 border-blue-200' },
  NO_ANSWER:            { label: '📞 No answer',     color: 'bg-amber-100 text-amber-800 border-amber-200' },
  VOICEMAIL:            { label: '📧 Voicemail',     color: 'bg-amber-100 text-amber-800 border-amber-200' },
  SCHEDULED_CALLBACK:   { label: '⏰ Callback',      color: 'bg-amber-100 text-amber-800 border-amber-200' },
  NO_ORDER:             { label: '📋 No order',      color: 'bg-gray-100 text-gray-700 border-gray-200' },
  DECLINED:             { label: '💰 Won\'t pay',    color: 'bg-gray-100 text-gray-700 border-gray-200' },
  WRONG_SERVICE:        { label: '🔀 Wrong service', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  WRONG_NUMBER:         { label: '🔀 Wrong number',  color: 'bg-gray-100 text-gray-700 border-gray-200' },
  NO_AVAILABILITY:      { label: '📅 Conflict',      color: 'bg-gray-100 text-gray-700 border-gray-200' },
  OUTSIDE_SERVICE_AREA: { label: '📍 Out of area',   color: 'bg-gray-100 text-gray-700 border-gray-200' },
  DUPLICATE:            { label: '🔁 Duplicate',     color: 'bg-gray-100 text-gray-700 border-gray-200' },
  NOT_INTERESTED:       { label: '🚫 Not interested',color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

interface AvailableLead {
  id: string
  createdAt: string
  city: string
  state: string
  zip: string
  urgency: 'STANDARD' | 'STAT'
  priceCents: number
}

interface Provider {
  id: string
  name: string
  slug: string
  leadCredit: number
  featuredTier: string | null
  status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
  claimEmail: string | null
  zipCodes: string | null
  stripePaymentMethodId: string | null
  stripeCustomerId: string | null
}

interface DashboardData {
  provider: Provider
  claimedLeads: Lead[]
  availableLeads: AvailableLead[]
  stats: {
    totalLeads: number
    claimedLeads: number
    availableLeads: number
    totalSpent: number
  }
  isTrialActive: boolean
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPricingModal, setShowPricingModal] = useState(false)

  // Settings state
  const [showSettings, setShowSettings] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [operatingDays, setOperatingDays] = useState({
    MON: false,
    TUE: false,
    WED: false,
    THU: false,
    FRI: false,
    SAT: false,
    SUN: false
  })
  const [operatingHoursStart, setOperatingHoursStart] = useState('08:00')
  const [operatingHoursEnd, setOperatingHoursEnd] = useState('17:00')
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState(25)

  // Profile state
  const [showProfile, setShowProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileData, setProfileData] = useState({
    businessName: '',
    phone: '',
    notificationEmail: '',
    website: '',
    description: '',
    zipCodes: '',
    languages: '',
  })
  const [allServices, setAllServices] = useState<{id: string, name: string}[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

  useEffect(() => {
    fetchDashboardData()
    fetchSettings()
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/provider/settings', {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.ok) {
          const { operatingDays: daysStr, operatingHoursStart, operatingHoursEnd, serviceRadiusMiles } = result.settings

          // Parse operating days
          if (daysStr) {
            const days = daysStr.split(',').map((d: string) => d.trim())
            setOperatingDays({
              MON: days.includes('MON'),
              TUE: days.includes('TUE'),
              WED: days.includes('WED'),
              THU: days.includes('THU'),
              FRI: days.includes('FRI'),
              SAT: days.includes('SAT'),
              SUN: days.includes('SUN')
            })
          }

          setOperatingHoursStart(operatingHoursStart)
          setOperatingHoursEnd(operatingHoursEnd)
          setServiceRadiusMiles(serviceRadiusMiles)
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/provider/profile', { credentials: 'include' })
      if (response.ok) {
        const result = await response.json()
        if (result.ok) {
          setProfileData({
            businessName: result.profile.businessName || '',
            phone: result.profile.phone || '',
            notificationEmail: result.profile.notificationEmail || '',
            website: result.profile.website || '',
            description: result.profile.description || '',
            zipCodes: result.profile.zipCodes || '',
            languages: result.profile.languages || '',
          })
          setAllServices(result.allServices || [])
          setSelectedServiceIds(result.services?.map((s: any) => s.id) || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const saveProfile = async () => {
    setProfileLoading(true)
    setProfileSaved(false)

    try {
      const response = await fetch('/api/provider/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...profileData,
          serviceIds: selectedServiceIds
        })
      })

      const result = await response.json()

      if (result.ok) {
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 3000)
      } else {
        alert(result.error || 'Failed to save profile')
      }
    } catch {
      alert('An error occurred while saving your profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const saveSettings = async () => {
    setSettingsLoading(true)
    setSettingsSaved(false)

    try {
      // Build comma-separated string of selected days
      const selectedDays = Object.entries(operatingDays)
        .filter(([_, isSelected]) => isSelected)
        .map(([day, _]) => day)
        .join(',')

      if (!selectedDays) {
        alert('Please select at least one operating day')
        setSettingsLoading(false)
        return
      }

      const response = await fetch('/api/provider/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          operatingDays: selectedDays,
          operatingHoursStart,
          operatingHoursEnd,
          serviceRadiusMiles
        })
      })

      const result = await response.json()

      if (result.ok) {
        setSettingsSaved(true)
        setTimeout(() => setSettingsSaved(false), 3000)
      } else {
        alert(result.error || 'Failed to save settings')
      }
    } catch (error) {
      alert('An error occurred while saving settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  const toggleWeekdays = () => {
    setOperatingDays({
      MON: true,
      TUE: true,
      WED: true,
      THU: true,
      FRI: true,
      SAT: false,
      SUN: false
    })
  }

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard', {
        credentials: 'include' // Include cookies
      })

      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/dashboard/login')
        return
      }

      const result = await response.json()

      if (result.ok) {
        setData(result)
      } else {
        setError(result.error || 'Failed to load dashboard')
      }
    } catch (error) {
      setError('An error occurred while loading your dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/dashboard/login?logout=success')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBillingPortal = async () => {
    setBillingLoading(true)
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        credentials: 'include'
      })
      const result = await response.json()
      if (result.ok && result.url) {
        window.location.href = result.url
      } else {
        alert(result.error || 'Failed to open billing portal')
      }
    } catch (error) {
      alert('An error occurred while opening billing portal')
    } finally {
      setBillingLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Failed to load dashboard'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
            <Link
              href="/dashboard/login"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { provider, claimedLeads, availableLeads, stats, isTrialActive } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success message */}
      {searchParams.get('login') === 'success' && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="container mx-auto">
            <p className="text-sm text-green-800">✓ Logged in successfully</p>
          </div>
        </div>
      )}

      {/* Payment Setup Banner - DISABLED during beta (leads are free) */}
      {/* Uncomment when pay-per-lead is activated:
      {!provider.stripePaymentMethodId && (
        <div className="bg-yellow-500 text-white px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">
                Add payment details to start claiming patient leads
              </p>
            </div>
            <button
              onClick={() => setShowPricingModal(true)}
              className="bg-white text-yellow-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Add Payment Method
            </button>
          </div>
        </div>
      )}
      */}

      {/* Dashboard Active Banner */}
      <div className="bg-primary-600 text-white px-4 py-3">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <Star className="h-5 w-5" />
          <p className="font-semibold">⭐ Provider Dashboard Active – Claim patient requests in your area</p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
              <p className="text-gray-600 mt-1">Provider Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  provider.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                  provider.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {provider.status === 'VERIFIED' && '✓ '}
                  {provider.status}
                </span>
              </div>
              <Link
                href={`/provider/${provider.slug}`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View Listing →
              </Link>
              {provider.stripeCustomerId && (
                <button
                  onClick={handleBillingPortal}
                  disabled={billingLoading}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm disabled:opacity-50"
                >
                  <CreditCard size={16} />
                  {billingLoading ? 'Loading...' : 'Manage Billing'}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="text-orange-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">{stats.availableLeads}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Available Leads</p>
            <p className="text-xs text-gray-500 mt-1">Ready to claim now</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-green-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">{stats.claimedLeads}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Claimed Leads</p>
            <p className="text-xs text-gray-500 mt-1">Your leads</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="text-yellow-600" size={24} />
              <span className="text-2xl font-bold text-gray-900">
                ACTIVE
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Account Status</p>
            <p className="text-xs text-gray-500 mt-1">
              Receiving leads
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-blue-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">
                {stats.totalLeads}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Leads</p>
            <p className="text-xs text-gray-500 mt-1">
              All time
            </p>
          </div>
        </div>

        {/* Business Profile */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="text-green-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Business Profile</h2>
              </div>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                {showProfile ? 'Hide' : 'Edit'}
              </button>
            </div>
            {!showProfile && (
              <p className="text-sm text-gray-600 mt-1">
                {profileData.businessName || 'Loading...'}
                {profileData.phone && ` \u00b7 ${profileData.phone}`}
              </p>
            )}
          </div>

          {showProfile && (
            <div className="px-6 py-6">
              <p className="text-gray-600 mb-6 text-sm">
                Update your business information. Changes are saved immediately and reflected on your public listing.
              </p>

              {/* Business Name */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={profileData.businessName}
                  onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Phone & Notification Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notification Email</label>
                  <input
                    type="email"
                    value={profileData.notificationEmail}
                    onChange={(e) => setProfileData({ ...profileData, notificationEmail: e.target.value })}
                    placeholder="Where lead notifications are sent"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  placeholder="https://www.example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Business Description</label>
                <textarea
                  rows={4}
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  placeholder="Describe your services, experience, and what makes your business unique..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">{profileData.description.length}/2000 characters</p>
              </div>

              {/* Service ZIP Codes */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Service ZIP Codes</label>
                <input
                  type="text"
                  value={profileData.zipCodes}
                  onChange={(e) => setProfileData({ ...profileData, zipCodes: e.target.value })}
                  placeholder="e.g. 90210, 90211, 90212"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated ZIP codes you serve</p>
              </div>

              {/* Languages */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Languages Spoken</label>
                <input
                  type="text"
                  value={profileData.languages}
                  onChange={(e) => setProfileData({ ...profileData, languages: e.target.value })}
                  placeholder="e.g. English, Spanish, Creole"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated. Languages other than English will show as a badge on your profile.</p>
              </div>

              {/* Services Offered */}
              {allServices.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Services Offered</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allServices.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
                          selectedServiceIds.includes(service.id)
                            ? 'border-green-600 bg-green-50 text-green-900'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={saveProfile}
                  disabled={profileLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {profileLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Profile
                    </>
                  )}
                </button>
                {profileSaved && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={20} />
                    <span className="font-medium text-sm">Saved!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!showProfile && (
            <div className="px-6 py-4 text-center text-sm text-gray-600">
              Click &quot;Edit&quot; to update your business name, phone, description, and services
            </div>
          )}
        </div>

        {/* Availability Settings */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Service Area Settings</h2>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {showSettings ? 'Hide' : 'Configure'}
              </button>
            </div>
            {!showSettings && (!operatingHoursStart || !operatingHoursEnd || !serviceRadiusMiles) && (
              <div className="mt-3 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                <p className="text-sm text-yellow-900 font-semibold">
                  ⚠️ Action Required: Configure your service area settings to see leads in your area
                </p>
              </div>
            )}
          </div>

          {showSettings && (
            <div className="px-6 py-6">
              <p className="text-gray-600 mb-6 text-sm">
                Configure your operating hours and service area to receive only relevant leads. Leads will only be sent to you during your available hours and within your service radius.
              </p>

              {/* Operating Days */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar size={18} />
                    Operating Days
                  </label>
                  <button
                    onClick={toggleWeekdays}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mon-Fri Only
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(operatingDays).map(([day, isSelected]) => (
                    <button
                      key={day}
                      onClick={() => setOperatingDays({ ...operatingDays, [day]: !isSelected })}
                      className={`px-3 py-2 rounded-lg border-2 font-medium text-sm transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operating Hours */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Clock size={18} />
                  Operating Hours
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={operatingHoursStart}
                      onChange={(e) => setOperatingHoursStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Time</label>
                    <input
                      type="time"
                      value={operatingHoursEnd}
                      onChange={(e) => setOperatingHoursEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Service Radius */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <MapPin size={18} />
                  Service Radius
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={serviceRadiusMiles}
                    onChange={(e) => setServiceRadiusMiles(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={serviceRadiusMiles}
                      onChange={(e) => setServiceRadiusMiles(parseInt(e.target.value) || 25)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-semibold"
                    />
                    <span className="text-sm text-gray-600 font-medium">miles</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leads within {serviceRadiusMiles} miles from your ZIP code will be shown
                </p>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={saveSettings}
                  disabled={settingsLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {settingsLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Service Area Settings
                    </>
                  )}
                </button>
                {settingsSaved && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={20} />
                    <span className="font-medium text-sm">Saved!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!showSettings && (
            <div className="px-6 py-4 text-center text-sm text-gray-600">
              Click &quot;Configure&quot; to set your operating hours and service radius
            </div>
          )}
        </div>

        {/* Available Leads Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-orange-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Available Leads in Your Area</h2>
              </div>
              {stats.availableLeads > 0 && (
                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {stats.availableLeads} Ready to Claim
                </span>
              )}
            </div>
          </div>

          {availableLeads.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads available right now</h3>
              {(!operatingHoursStart || !operatingHoursEnd || !serviceRadiusMiles) ? (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-yellow-900 font-semibold mb-2">⚠️ Service Area Settings Required</p>
                  <p className="text-sm text-yellow-800 mb-3">
                    You need to configure your operating hours and service radius to see available leads.
                  </p>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 font-medium text-sm"
                  >
                    Configure Settings Now
                  </button>
                </div>
              ) : (
                <p className="text-gray-600">
                  New patient leads will appear here when they submit requests in your service area.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.city}, {lead.state}</div>
                        <div className="text-sm text-gray-500">{lead.zip}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.urgency === 'STAT'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {lead.urgency === 'STAT' ? '🚨 STAT' : '📋 Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/claim/${lead.id}`}
                          className="inline-flex items-center gap-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-semibold"
                        >
                          <Zap size={16} />
                          Claim Lead
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Claimed Leads Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Claimed Leads</h2>
          </div>

          {claimedLeads.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No claimed leads yet</h3>
              <p className="text-gray-600">
                Leads you claim will appear here with full patient contact information, outcome tracking, and a release button.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {claimedLeads.map((lead) => {
                const outcomeMeta = lead.outcome ? OUTCOME_LABEL[lead.outcome] : null
                return (
                  <div key={lead.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Patient info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-gray-900">{lead.fullName}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            lead.urgency === 'STAT' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {lead.urgency}
                          </span>
                          {lead.isHighValue && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 border border-amber-600">
                              ⭐ HIGH VALUE
                            </span>
                          )}
                          {outcomeMeta && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${outcomeMeta.color}`}>
                              {outcomeMeta.label}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                          <a href={`tel:${lead.phone}`} className="text-primary-600 hover:text-primary-700 font-medium">
                            📞 {lead.phone}
                          </a>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="text-primary-600 hover:text-primary-700 truncate max-w-xs">
                              ✉️ {lead.email}
                            </a>
                          )}
                          <span>📍 {lead.city}, {lead.state} {lead.zip}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span>Claimed: {formatDate(lead.claimedAt || lead.routedAt || lead.createdAt)}</span>
                          {lead.drawCount && <span>· Draws: {lead.drawCount}</span>}
                          {lead.hasDoctorOrder && (
                            <span>· Order: {lead.hasDoctorOrder === 'yes' ? 'Yes' : lead.hasDoctorOrder === 'no' ? 'No' : 'Needs help'}</span>
                          )}
                          {lead.paymentMethod && (
                            <span>· Pay: {lead.paymentMethod === 'insurance' ? 'Insurance' : lead.paymentMethod === 'out_of_pocket' ? 'OOP' : 'Not sure'}</span>
                          )}
                        </div>

                        {!outcomeMeta && (
                          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                            ⏱ No outcome logged yet — open the lead to mark what happened
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="flex-shrink-0 flex md:flex-col gap-2">
                        <Link
                          href={`/claim/${lead.id}?provider=${provider.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          {outcomeMeta ? 'View & update' : 'Log outcome →'}
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">1.</span>
                <span>New leads appear in &quot;Available Leads&quot; when patients submit requests</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">2.</span>
                <span>Click &quot;Claim Lead&quot; to view full patient details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">3.</span>
                <span>First provider to claim gets the lead</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upgrade to Premium</h3>
            <p className="text-gray-600 mb-4">
              Get premium placement, a featured badge, and priority lead routing starting at $49/month.
            </p>
            <button
              onClick={() => setShowPricingModal(true)}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 font-medium"
            >
              View Pricing Plans
            </button>
          </div>
        </div>
      </div>

      {/* Premium Pricing Modal */}
      {data && (
        <PremiumPricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          providerId={provider.id}
          providerName={provider.name}
        />
      )}
    </div>
  )
}

export default function ProviderDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div><p className="text-gray-600">Loading dashboard...</p></div></div>}>
      <DashboardContent />
    </Suspense>
  )
}
