import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Phone, Mail, Clock, Shield, CheckCircle, Award, Globe,
  Calendar, Heart, Star, ChevronRight, User, Droplet, Home,
  Briefcase, Activity, Stethoscope, FileCheck,
  Instagram, Facebook, Youtube, Linkedin
} from 'lucide-react'
import { PremiumLeadFormProvider, BookNowButton } from '@/components/provider/PremiumLeadForm'
import { TrackedPhoneLink } from '@/components/provider/TrackedPhoneLink'
import { ClickToLoadMap } from '@/components/provider/ClickToLoadMap'
import type { EnrichedProvider } from '@/lib/providers'
import type { CityLink } from '@/lib/seo/anchorHelpers'
import ServiceAreaLinks from '@/components/seo/ServiceAreaLinks'
import ServiceAreasCovered from '@/components/seo/ServiceAreasCovered'
import { groupServices, type ServiceFamilyKey } from '@/lib/providerServices'
import { assessDescription, leadingSentences } from '@/lib/descriptionQuality'

interface PremiumProviderPageProps {
  provider: EnrichedProvider
  mapCoords?: { lat: number; lng: number }
  // SEO link sections — server-fetched and passed in by the page route.
  // NearbyProviders is intentionally omitted on premium pages: paying
  // providers shouldn't compete with peers on their own profile.
  serviceAreaCities?: CityLink[]
  serviceAreaZips?: string[]
  serviceAreaStateAbbr?: string | null
  // Visible trail (Home > State > City > Provider). The matching
  // BreadcrumbList JSON-LD is emitted by the page route.
  breadcrumbs?: Array<{ name: string; url: string }>
}

// Social profiles supported on premium pages. Order here is the render order.
// TikTok has no lucide icon, so it uses the inline glyph below.
const SOCIAL_ORDER = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'] as const
type SocialKey = typeof SOCIAL_ORDER[number]

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06V9.7a5.67 5.67 0 0 0-.77-.05A5.67 5.67 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.29 1.37V7.3a4.29 4.29 0 0 1-3.23-1.48z" />
    </svg>
  )
}

const SOCIAL_META: Record<SocialKey, { label: string, icon: (props: { size?: number }) => JSX.Element }> = {
  instagram: { label: 'Instagram', icon: ({ size = 20 }) => <Instagram size={size} /> },
  facebook: { label: 'Facebook', icon: ({ size = 20 }) => <Facebook size={size} /> },
  tiktok: { label: 'TikTok', icon: ({ size = 20 }) => <TikTokIcon size={size} /> },
  youtube: { label: 'YouTube', icon: ({ size = 20 }) => <Youtube size={size} /> },
  linkedin: { label: 'LinkedIn', icon: ({ size = 20 }) => <Linkedin size={size} /> },
}

// One icon per service family (lib/providerServices.ts). The template used to
// render one card per attached service NAME and map each to one of ten canned
// sentences by keyword, so Gentle Trace showed 19 cards with five distinct
// descriptions. Families dedupe that at the source.
const FAMILY_ICONS: Record<ServiceFamilyKey, typeof Droplet> = {
  pediatric: Heart, senior: Home, dna: FileCheck, drug: Stethoscope, iv: Activity,
  corporate: Briefcase, research: Activity, kits: FileCheck, specimen: Stethoscope,
  lab: Stethoscope, blood: Droplet, other: FileCheck,
}
const DEFAULT_SERVICES = ['Mobile Blood Draw', 'Lab Specimen Collection', 'Corporate Health Screenings']

/**
 * Hero tagline. There is no tagline column yet, so this is the first whole
 * sentence(s) of the provider's own About text within ~140 characters, with
 * scraped site chrome stripped. Providers with no usable prose get a
 * sentence built from their record. When a `tagline` field exists, prefer
 * it here and keep this as the default.
 */
function deriveTagline(provider: EnrichedProvider, location: string): string {
  const a = assessDescription(provider.description, provider.name)
  if (a.kind === 'prose' || a.kind === 'thin') {
    const t = leadingSentences(a.cleaned, 140)
    if (t.length >= 40 && !t.endsWith('\u2026')) return t
  }
  return `Mobile phlebotomy that comes to you${location ? ` across ${location}` : ''}: doctor-ordered lab work collected at home, at work or in care.`
}

// Format phone to (XXX) XXX-XXXX
function formatPhone(phone: string | undefined | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length === 11 && digits[0] === '1') return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  return phone // fallback to original if unexpected format
}

export default function PremiumProviderPage({
  provider,
  mapCoords,
  serviceAreaCities = [],
  serviceAreaZips = [],
  serviceAreaStateAbbr = null,
  breadcrumbs = [],
}: PremiumProviderPageProps) {
  // Derive primaryCitySlug for the outward city link
  const primaryCitySlug = provider.city
    ? provider.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : null

  const location = provider.city ? `${provider.city}, ${provider.state}` : provider.state || ''
  const isVerified = provider.status === 'VERIFIED'

  // Parse languages
  const languages = (provider.languages && provider.languages !== 'nan' && provider.languages.length > 0)
    ? provider.languages.split(',').map(l => l.trim()).filter(Boolean)
    : ['English']

  // Trust signals (defaults — can be made configurable per provider later)
  const trustSignals = [
    { icon: Shield, title: 'Licensed & Insured', description: 'Fully licensed professionals with comprehensive liability coverage' },
    { icon: CheckCircle, title: 'Background Checked', description: 'All staff undergo thorough background screening and credential verification' },
    { icon: Clock, title: 'Flexible Scheduling', description: 'Same-day and next-day appointments available, including evenings and weekends' },
    { icon: FileCheck, title: 'HIPAA Compliant', description: 'Your medical information is protected under strict HIPAA privacy standards' },
  ]

  // Provider-supplied testimonials are stored as a JSON string in
  // `provider.testimonials`. Parse once at render time. If parsing fails or
  // the field is empty, the Patient Reviews section shows the "coming soon"
  // placeholder instead of fabricated quotes.
  const testimonials: Array<{ quote: string, author: string, location: string, rating: number }> = (() => {
    const raw = (provider as any).testimonials
    if (!raw || typeof raw !== 'string') return []
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter(t => t && typeof t.quote === 'string' && typeof t.author === 'string').map(t => ({
        quote: t.quote,
        author: t.author,
        location: t.location || '',
        rating: typeof t.rating === 'number' ? t.rating : 5,
      }))
    } catch {
      return []
    }
  })()

  // Provider-supplied social profiles, stored as a JSON object string in
  // `provider.socialLinks` ({ instagram, facebook, tiktok, youtube, linkedin }).
  // Only https URLs are rendered — anything else is dropped so a bad value
  // can't produce a javascript: link. Empty result hides the row entirely.
  const socials: Array<{ key: SocialKey, url: string }> = (() => {
    const raw = (provider as any).socialLinks
    if (!raw || typeof raw !== 'string') return []
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return []
      return SOCIAL_ORDER
        .filter(key => typeof parsed[key] === 'string' && parsed[key].startsWith('https://'))
        .map(key => ({ key, url: parsed[key] as string }))
    } catch {
      return []
    }
  })()

  // Parse ZIP codes for coverage display
  const zipList = provider.zipCodes
    ? provider.zipCodes.split(',').map(z => z.trim()).filter(Boolean).slice(0, 20)
    : []

  const bookingPhone = provider.phone
  const bookingPhoneFormatted = formatPhone(provider.phone)
  const bookingEmail = provider.email
  const tagline = deriveTagline(provider, location)

  return (
    <PremiumLeadFormProvider providerId={provider.id} defaultCity={provider.city || ''} defaultState={provider.state || ''}>
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* ═══════════════════════════════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 overflow-hidden">
        {/* Decorative pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

        <div className="relative container mx-auto px-4 pt-5 pb-10 md:pt-6 md:pb-12">
          {breadcrumbs.length > 1 && (
            <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto mb-4 text-sm text-teal-50/90">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {breadcrumbs.map((item, i) => (
                  <li key={item.url} className="flex items-center gap-x-2">
                    {i > 0 && <span aria-hidden="true" className="text-teal-100/60">&rsaquo;</span>}
                    {i === breadcrumbs.length - 1
                      ? <span aria-current="page" className="font-medium text-white">{item.name}</span>
                      : <Link href={item.url} className="hover:text-white underline-offset-2 hover:underline">{item.name}</Link>}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Capped hero: ~400px desktop / ~340px mobile so the About, services
              and coverage content starts before 600px. Text beside a constrained
              image card instead of a full-width block below. */}
          <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr,300px] gap-8 md:gap-12 items-center">
            <div className="text-white">
              {/* Logo on a white card so transparent PNGs read on the teal hero.
                  Height-constrained (64px desktop / 48px mobile), width auto,
                  so logos of any aspect ratio render at a legible size. */}
              {provider.logo && (
                <div className="inline-flex items-center bg-white rounded-xl px-3 py-2 shadow-lg mb-4">
                  <Image
                    src={provider.logo}
                    alt={`${provider.name} logo`}
                    width={240}
                    height={64}
                    sizes="240px"
                    quality={90}
                    priority
                    className="h-12 md:h-16 w-auto max-w-[240px] object-contain"
                  />
                </div>
              )}

              {/* Eyebrow: verification, license, languages, availability as chips */}
              <ul className="flex flex-wrap gap-2 mb-4 list-none p-0 m-0" aria-label="Credentials">
                {isVerified && (
                  <li className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1 text-xs font-medium">
                    <CheckCircle size={14} /> Platform Verified
                  </li>
                )}
                <li className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1 text-xs font-medium">
                  <Shield size={14} /> Licensed &amp; Insured
                </li>
                {languages.length > 0 && (
                  <li className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1 text-xs font-medium">
                    <Globe size={14} /> {languages.join(' · ')}
                  </li>
                )}
                {(provider.availability || []).map(a => (
                  <li key={a} className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1 text-xs font-medium">
                    <Clock size={14} /> {a}
                  </li>
                ))}
              </ul>

              {/* H1 carries the keyword and the city, matching the title tag. */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight leading-tight">
                {location ? <>Mobile Phlebotomy in {location} &mdash; {provider.name}</> : <>Mobile Phlebotomy &mdash; {provider.name}</>}
              </h1>

              <p className="text-lg md:text-xl text-teal-50 mb-5 max-w-2xl leading-relaxed">
                {tagline}
              </p>

              {/* Price anchor renders here once structured pricing exists. */}

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <BookNowButton
                  className="bg-white text-teal-700 hover:bg-teal-50 font-bold text-base md:text-lg px-8 py-3.5 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-200 inline-flex items-center justify-center gap-2"
                >
                  <Calendar size={20} />
                  Book Now
                </BookNowButton>
                {bookingPhone && (
                  <TrackedPhoneLink
                    phone={bookingPhone}
                    providerId={provider.id}
                    source="premium_provider_call"
                    className="bg-teal-800/60 hover:bg-teal-800/80 backdrop-blur-sm border border-white/30 text-white font-semibold text-base md:text-lg px-8 py-3.5 rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2"
                  >
                    <Phone size={18} />
                    Call {bookingPhoneFormatted}
                  </TrackedPhoneLink>
                )}
              </div>
              <div className="inline-flex items-center gap-2 text-white/90 mt-4 text-sm md:text-base">
                <MapPin size={16} />
                <span>
                  Serving {location || 'your area'}
                  {provider.serviceRadiusMiles ? ` and up to ${provider.serviceRadiusMiles} miles out` : ''}
                </span>
              </div>
            </div>

            {/* Hero image: poster, else profile photo. Constrained card, priority
                (it is the LCP element), explicit box so nothing shifts. Hidden on
                phones to keep the hero inside ~340px there. */}
            {(provider.heroPoster || provider.profileImage) && (
              <div className="hidden md:block relative w-[300px] h-[340px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/30 bg-white/10 justify-self-end">
                <Image
                  src={provider.heroPoster || provider.profileImage || ''}
                  alt={`${provider.name} — mobile phlebotomy in ${location || 'your area'}`}
                  fill
                  sizes="300px"
                  priority
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Wave divider at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full h-12 md:h-20" preserveAspectRatio="none">
            <path fill="white" d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,37.3C840,32,960,32,1080,37.3C1200,43,1320,53,1380,58.7L1440,64L1440,80L1380,80C1320,80,1200,80,1080,80C960,80,840,80,720,80C600,80,480,80,360,80C240,80,120,80,60,80L0,80Z" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. ABOUT SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section id="about" className="py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12 items-center">
            {/* Provider logo or avatar placeholder */}
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <div className="w-56 h-56 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center border-8 border-white shadow-2xl overflow-hidden">
                  {(provider.profileImage || provider.logo) ? (
                    <Image src={provider.profileImage || provider.logo || ''} alt={provider.name} fill sizes="224px" className="object-cover" />
                  ) : (
                    <User className="w-24 h-24 text-teal-400" strokeWidth={1.5} />
                  )}
                </div>
                {isVerified && (
                  <div className="absolute bottom-2 right-2 bg-teal-500 text-white p-2 rounded-full shadow-lg">
                    <CheckCircle size={24} />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm font-bold text-teal-600 tracking-wider uppercase mb-3">About Us</div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Experienced, compassionate mobile phlebotomy care
              </h2>
              {provider.description && (
                <p className="text-lg text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
                  {provider.description}
                </p>
              )}

              {/* Credentials pills */}
              <div className="flex flex-wrap gap-3 mt-6">
                {isVerified && (
                  <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-800 border border-teal-200 px-4 py-2 rounded-full text-sm font-medium">
                    <Award size={16} />
                    Platform Verified
                  </span>
                )}
                {languages.length > 0 && (
                  <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-full text-sm font-medium">
                    <Globe size={16} />
                    {languages.join(' · ')}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 bg-purple-50 text-purple-800 border border-purple-200 px-4 py-2 rounded-full text-sm font-medium">
                  <Shield size={16} />
                  Licensed & Insured
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. SERVICES SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section id="services" className="py-20 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="text-sm font-bold text-teal-600 tracking-wider uppercase mb-3">Our Services</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional mobile phlebotomy, at your door
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We bring the lab to you — convenient, safe, and professional specimen collection wherever you are.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupServices(provider.services && provider.services.length > 0 ? provider.services : DEFAULT_SERVICES).map((family) => {
              const Icon = FAMILY_ICONS[family.key]
              const extras = family.members.filter(m => m.toLowerCase() !== family.label.toLowerCase())
              return (
                <div
                  key={`${family.key}-${family.label}`}
                  className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-200 border border-gray-100"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-5 shadow-md">
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{family.label}</h3>
                  <p className="text-gray-600 leading-relaxed">{family.description}</p>
                  {extras.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 mt-4 list-none p-0 m-0" aria-label={`${family.label} includes`}>
                      {extras.map(m => (
                        <li key={m} className="text-xs bg-teal-50 text-teal-800 border border-teal-100 rounded-full px-2.5 py-1">{m}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. SERVICE AREA SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section id="service-area" className="py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="text-sm font-bold text-teal-600 tracking-wider uppercase mb-3">Coverage Area</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Where we serve
            </h2>
            <p className="text-lg text-gray-600">
              Based in {location} — serving the surrounding area.
            </p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-2xl p-10 md:p-16 border border-teal-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg mb-6">
                  <MapPin className="text-teal-600" size={40} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {provider.city || 'Local'} Metro Area
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {provider.serviceRadius
                    ? `We travel up to ${provider.serviceRadius} from our primary location.`
                    : `We serve patients throughout ${location} and surrounding communities.`}
                </p>
                <BookNowButton
                  className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-800 transition-colors"
                >
                  Check if we serve your ZIP code
                  <ChevronRight size={18} />
                </BookNowButton>
              </div>

              {zipList.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Covered ZIP codes</h4>
                  <ul className="flex flex-wrap gap-2 list-none p-0 m-0" aria-label="Covered ZIP codes">
                    {zipList.map((zip) => (
                      <li
                        key={zip}
                        className="bg-white border border-teal-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-mono font-medium shadow-sm"
                      >
                        {zip}
                      </li>
                    ))}
                    {provider.zipCodes && provider.zipCodes.split(',').length > 20 && (
                      <li className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        +{provider.zipCodes.split(',').length - 20} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Map loads on request (see ClickToLoadMap). Coordinates come from
                the server-side primary-ZIP lookup; falls back to a text query. */}
            <ClickToLoadMap
              providerName={provider.name}
              label={location || provider.name}
              coords={mapCoords}
              query={[provider.city, provider.state, provider.zipCodes?.split(',')[0]?.trim()].filter(Boolean).join(' ') || undefined}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. WHY CHOOSE US / TRUST SIGNALS
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="text-sm font-bold text-teal-400 tracking-wider uppercase mb-3">Why Choose Us</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Healthcare you can trust
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Every service we provide meets the highest standards of safety, professionalism, and patient care.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustSignals.map((signal) => {
              const Icon = signal.icon
              return (
                <div key={signal.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 mb-5 shadow-lg">
                    <Icon className="text-white" size={30} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{signal.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{signal.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. TESTIMONIALS SECTION
          ═══════════════════════════════════════════════════════════ */}
      {testimonials.length > 0 ? (
        <section className="py-20 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <div className="text-sm font-bold text-teal-600 tracking-wider uppercase mb-3">Patient Reviews</div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What our patients are saying
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-sm border border-gray-100 relative"
                >
                  <div className="flex gap-1 mb-5">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="text-amber-400 fill-amber-400" size={20} />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="font-bold text-gray-900">{t.author}</div>
                    <div className="text-sm text-gray-500">{t.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          7. CONTACT / BOOKING SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-20 md:py-24 bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-10 md:p-14">
                <div className="text-sm font-bold text-teal-600 tracking-wider uppercase mb-3">Get In Touch</div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Ready to book your appointment?
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Request a mobile phlebotomy visit today. Most appointments available same-day or next-day.
                </p>

                <div className="space-y-4 mb-8">
                  {bookingPhone && (
                    <TrackedPhoneLink
                      phone={bookingPhone}
                      providerId={provider.id}
                      source="premium_provider_contact"
                      className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                        <Phone className="text-white" size={22} />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Call us</div>
                        <div className="font-bold text-gray-900 text-lg">{bookingPhoneFormatted}</div>
                      </div>
                    </TrackedPhoneLink>
                  )}

                  {bookingEmail && (
                    <a
                      href={`mailto:${bookingEmail}`}
                      className="flex items-center gap-4 p-4 bg-cyan-50 rounded-xl hover:bg-cyan-100 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
                        <Mail className="text-white" size={22} />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email us</div>
                        <div className="font-bold text-gray-900 break-all">{bookingEmail}</div>
                      </div>
                    </a>
                  )}

                  <div className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="text-gray-600" size={22} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Availability</div>
                      <div className="font-bold text-gray-900">Same-day & next-day appointments</div>
                    </div>
                  </div>
                </div>

                {socials.length > 0 && (
                  <div className="mb-8">
                    <div className="text-sm text-gray-500 mb-3">Follow us</div>
                    <div className="flex flex-wrap gap-3">
                      {socials.map(({ key, url }) => {
                        const { label, icon: Icon } = SOCIAL_META[key]
                        return (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            aria-label={`${provider.name} on ${label}`}
                            title={label}
                            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-teal-600 text-gray-600 hover:text-white flex items-center justify-center transition-colors"
                          >
                            <Icon size={22} />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}

                <BookNowButton
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-lg py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center gap-2"
                >
                  <Calendar size={22} />
                  Request Appointment
                </BookNowButton>
              </div>

              {provider.heroPoster ? (
                // Provider-supplied promotional poster (overrides the generic
                // Compassionate-care card). object-contain + padding so the
                // full poster is visible without cropping, regardless of
                // the aspect ratio difference vs the booking card's height.
                <div className="hidden md:flex relative bg-gradient-to-br from-teal-50 to-cyan-50 items-center justify-center p-6">
                  <Image
                    src={provider.heroPoster || ''}
                    alt={`${provider.name} — mobile phlebotomy`}
                    width={480}
                    height={600}
                    sizes="(max-width: 1024px) 45vw, 480px"
                    className="w-full h-auto max-h-[600px] object-contain rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="hidden md:block relative bg-gradient-to-br from-teal-700 to-cyan-700">
                  <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="text-center text-white">
                      <Heart className="mx-auto mb-6 opacity-80" size={80} strokeWidth={1.5} />
                      <h3 className="text-2xl font-bold mb-3">Compassionate care</h3>
                      <p className="text-teal-50 leading-relaxed">
                        We treat every patient like family. From scheduling to draw, your comfort is our priority.
                      </p>
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7b. SERVICE AREAS COVERED (server-rendered SEO links)
          Outward links to city + state directory pages. Replaces a
          competitor-list block that lives on non-premium pages — paying
          providers don't link to alternatives, but the linking benefit
          to their geographic context is preserved here.
          ═══════════════════════════════════════════════════════════ */}
      <ServiceAreasCovered
        providerSlug={provider.slug}
        cities={serviceAreaCities}
        zipCodes={serviceAreaZips}
        stateAbbr={serviceAreaStateAbbr}
      />

      {/* Service area + state link block — gives Google a clear path
          back into the city/state directory hierarchy. */}
      <section className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <ServiceAreaLinks
            providerSlug={provider.slug}
            primaryCity={provider.city || null}
            primaryCitySlug={primaryCitySlug}
            stateAbbr={serviceAreaStateAbbr}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8. FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm">
              © {new Date().getFullYear()} {provider.name}. All rights reserved.
            </div>
            <div className="text-sm">
              Powered by{' '}
              <Link
                href="https://www.mobilephlebotomy.org"
                className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                MobilePhlebotomy.org
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky call bar on phones: the number stays one tap away while
          scrolling. Hidden on desktop where the hero CTAs are in view. */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-4 py-3 flex gap-3">
        {bookingPhone && (
          <TrackedPhoneLink
            phone={bookingPhone}
            providerId={provider.id}
            source="premium_provider_sticky_call"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 text-white font-semibold py-3 rounded-lg"
            ariaLabel={`Call ${provider.name} at ${bookingPhoneFormatted}`}
          >
            <Phone size={18} /> Call
          </TrackedPhoneLink>
        )}
        <BookNowButton className="flex-1 inline-flex items-center justify-center gap-2 border border-teal-600 text-teal-700 font-semibold py-3 rounded-lg bg-white">
          <Calendar size={18} /> Book
        </BookNowButton>
      </div>
    </div>
    </PremiumLeadFormProvider>
  )
}
