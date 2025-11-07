'use client'

import { useState } from 'react'
import { ReportIssueModal } from './ReportIssueModal'
import { ga4 } from '@/lib/ga4'

interface ReportIssueButtonProps {
  providerId: string
  providerName: string
}

export function ReportIssueButton({ providerId, providerName }: ReportIssueButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    ga4.reportClick({ provider_id: providerId, provider_name: providerName })
    setIsModalOpen(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="text-sm text-gray-600 hover:text-primary-600 underline"
      >
        Report incorrect information
      </button>

      <ReportIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        providerId={providerId}
        providerName={providerName}
      />
    </>
  )
}
