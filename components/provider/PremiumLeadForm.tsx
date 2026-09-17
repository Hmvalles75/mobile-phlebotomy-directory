'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { LeadFormModal } from '@/components/ui/LeadFormModal'

/**
 * The only state on a premium provider page: whether the lead-form modal is
 * open. Until 2026-09-17 the entire 727-line template was a client component
 * because of this one boolean, so the whole page body shipped as hydration
 * payload. Now the server-rendered template wraps itself in this provider and
 * drops <BookNowButton> wherever a CTA needs to open the form.
 */

interface Ctx { open: () => void }
const LeadFormCtx = createContext<Ctx>({ open: () => {} })

export function PremiumLeadFormProvider({
  providerId, defaultCity, defaultState, children,
}: { providerId: string; defaultCity: string; defaultState: string; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <LeadFormCtx.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      {/* Always attribute to the provider whose premium page generated the click */}
      <LeadFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultCity={defaultCity}
        defaultState={defaultState}
        defaultZip=""
        preferredProviderId={providerId}
        source="premium_provider_page"
      />
    </LeadFormCtx.Provider>
  )
}

export function BookNowButton({ className, children, ariaLabel }: { className?: string; children: ReactNode; ariaLabel?: string }) {
  const { open } = useContext(LeadFormCtx)
  return (
    <button type="button" onClick={open} className={className} aria-label={ariaLabel}>
      {children}
    </button>
  )
}
