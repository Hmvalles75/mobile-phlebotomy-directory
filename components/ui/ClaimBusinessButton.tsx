'use client'

import { useState } from 'react'
import { ClaimBusinessForm } from './ClaimBusinessForm'

interface ClaimBusinessButtonProps {
  providerId: string
  providerName: string
}

export function ClaimBusinessButton({ providerId, providerName }: ClaimBusinessButtonProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Own this business?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Claim your listing to update information, respond to reviews, and get verified.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Claim This Business
        </button>
      </div>

      {/* Modal for Claim Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Claim Your Business</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <ClaimBusinessForm
                providerId={providerId}
                providerName={providerName}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
