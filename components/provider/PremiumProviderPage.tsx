'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Clock, Shield, CheckCircle, Award, Globe,
  Calendar, Heart, Star, ChevronRight, User, Droplet, Home,
  Briefcase, Activity, Stethoscope, FileCheck
} from 'lucide-react'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { trackPhoneClick } from '@/lib/trackPhoneClick'
import type { EnrichedProvider } from '@/lib/providers'

interface PremiumProviderPageProps {
  provider: EnrichedProvider
}

// Map service names to icons and unique descriptions for visual presentation
function getServiceDetails(service: string): { icon: typeof Droplet, description: string } {
  const s = service.toLowerCase()
  if (s.includes('blood') || s.includes('draw') || s.includes('phlebotomy')) {
    return { icon: Droplet, description: 'Routine and specialty venipuncture for doctor-ordered lab work, done at your home or office.' }
  }
  if (s.includes('corporate') || s.includes('wellness')) {
    return { icon: Briefcase, description: 'On-site biometric screenings and wellness panels for employers, HR programs, and company benefits days.' }
  }
  if (s.includes('screening')) {
    return { icon: Briefcase, description: 'Pre-employment, insurance, and health screenings performed at your preferred location.' }
  }
  if (s.includes('pediatric')) {
    return { icon: Heart, description: 'Gentle, child-focused draws performed by phlebotomists trained in pediatric technique.' }
  }
  if (s.includes('geriatric') || s.includes('elderly')) {
    return { icon: Heart, description: 'In-home care for seniors and homebound patients who can\'t easily travel to a lab.' }
  }
  if (s.includes('iv') || s.includes('therapy') || s.includes('hydration')) {
    return { icon: Activity, description: 'Mobile IV infusions and hydration therapy administered by licensed professionals at your location.' }
  }
  if (s.includes('diagnostic') || s.includes('monitoring')) {
    return { icon: Activity, description: 'Ongoing diagnostic testing and health monitoring delivered to your door on a regular schedule.' }
  }
  if (s.includes('specimen') || s.includes('collection')) {
    return { icon: Stethoscope, description: 'Urine, saliva, and other specimen collection following lab chain-of-custody protocols.' }
  }
  if (s.includes('lab')) {
    return { icon: Stethoscope, description: 'Full-service mobile lab collection — we handle pickup and delivery to Quest, Labcorp, or your preferred lab.' }
  }
  if (s.includes('home') || s.includes('mobile')) {
    return { icon: Home, description: 'We come to you — homes, offices, assisted living, or anywhere you need professional draw services.' }
  }
  return { icon: FileCheck, description: 'Professional service delivered with care, on your schedule, at the location you choose.' }
}

// Format phone to (XXX) XXX-XXXX
function formatPhone(phone: string | undefined | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length === 11 && digits[0] === '1') return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  return phone // fallback to original if unexpected format
}

export default function PremiumProviderPage({ provider }: PremiumProviderPageProps) {
  const [leadFormOpen, setLeadFormOpen] = useState(false)

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

  // Real testimonials will appear once the provider collects them
  // (Never ship fabricated reviews — section shows placeholder state until provider supplies real ones)
  const testimonials: Array<{ quote: string, author: string, location: string, rating: number }> = []

  // Parse ZIP codes for coverage display
  const zipList = provider.zipCodes
    ? provider.zipCodes.split(',').map(z => z.trim()).filter(Boolean).slice(0, 20)
    : []

  const bookingPhone = provider.phone
  const bookingPhoneFormatted = formatPhone(provider.phone)
  const bookingEmail = provider.email

  return (
    <div className="min-h-screen bg-white">
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

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Verified badge */}
            {isVerified && (
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 mb-6 text-white text-sm font-medium">
                <CheckCircle size={16} />
                Platform Verified Provider
              </div>
            )}

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              {provider.name}
            </h1>

            <p className="text-xl md:text-2xl text-teal-50 mb-4 max-w-2xl mx-auto leading-relaxed">
              Professional mobile phlebotomy services — licensed, insured, and ready to come to you.
            </p>

            <div className="inline-flex items-center gap-2 text-white/90 mb-10">
              <MapPin size={20} />
              <span className="text-lg font-medium">Serving {location}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setLeadFormOpen(true)}
                className="bg-white text-teal-700 hover:bg-teal-50 font-bold text-lg px-10 py-4 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-200 inline-flex items-center gap-2"
              >
                <Calendar size={22} />
                Book Now
              </button>
              {bookingPhone && (
                <a
                  href={`tel:${bookingPhone}`}
                  onClick={() => trackPhoneClick({ providerId: provider.id, source: 'premium_provider_call' })}
                  className="bg-teal-800/60 hover:bg-teal-800/80 backdrop-blur-sm border border-white/30 text-white font-semibold text-lg px-10 py-4 rounded-lg transition-all duration-200 inline-flex items-center gap-2"
                >
                  <Phone size={20} />
                  Call {bookingPhoneFormatted}
                </a>
              )}
            </div>
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
                  {provider.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={provider.logo} alt={provider.name} className="w-full h-full object-cover" />
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
            {(provider.services && provider.services.length > 0 ? provider.services : [
              'Mobile Blood Draw',
              'Lab Specimen Collection',
              'Wellness Testing',
              'Corporate Health Screenings',
              'Home Health Services',
              'Clinical Trials Support',
            ]).map((service) => {
              const { icon: Icon, description } = getServiceDetails(service)
              return (
                <div
                  key={service}
                  className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-200 border border-gray-100"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-5 shadow-md">
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service}</h3>
                  <p className="text-gray-600 leading-relaxed">{description}</p>
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
                <button
                  onClick={() => setLeadFormOpen(true)}
                  className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-800 transition-colors"
                >
                  Check if we serve your ZIP code
                  <ChevronRight size={18} />
                </button>
              </div>

              {zipList.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Covered ZIP codes</h4>
                  <div className="flex flex-wrap gap-2">
                    {zipList.map((zip) => (
                      <span
                        key={zip}
                        className="bg-white border border-teal-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-mono font-medium shadow-sm"
                      >
                        {zip}
                      </span>
                    ))}
                    {provider.zipCodes && provider.zipCodes.split(',').length > 20 && (
                      <span className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        +{provider.zipCodes.split(',').length - 20} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
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
      ) : (
        <section className="py-20 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center">
              <div className="text-sm font-bold text-teal-600 tracking-wider uppercase mb-3">Patient Reviews</div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Reviews coming soon
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                We&apos;re collecting patient feedback. If you&apos;ve worked with {provider.name}, we&apos;d love to hear about your experience.
              </p>
              <div className="flex justify-center gap-1 opacity-30">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-amber-400 fill-amber-400" size={28} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

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
                    <a
                      href={`tel:${bookingPhone}`}
                      className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                        <Phone className="text-white" size={22} />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Call us</div>
                        <div className="font-bold text-gray-900 text-lg">{bookingPhoneFormatted}</div>
                      </div>
                    </a>
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

                <button
                  onClick={() => setLeadFormOpen(true)}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-lg py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center gap-2"
                >
                  <Calendar size={22} />
                  Request Appointment
                </button>
              </div>

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
            </div>
          </div>
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

      {/* Lead form modal — always attribute to the provider whose premium page generated the click */}
      <LeadFormModal
        isOpen={leadFormOpen}
        onClose={() => setLeadFormOpen(false)}
        defaultCity={provider.city || ''}
        defaultState={provider.state || ''}
        defaultZip=""
        preferredProviderId={provider.id}
        source="premium_provider_page"
      />
    </div>
  )
}
