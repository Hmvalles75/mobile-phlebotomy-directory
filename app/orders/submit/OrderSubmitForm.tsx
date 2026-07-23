'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitClientOrder, type SubmitState } from './actions'

const initialState: SubmitState = { ok: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-md text-sm font-semibold"
    >
      {pending ? 'Submitting…' : 'Submit order for review'}
    </button>
  )
}

export default function OrderSubmitForm() {
  const [state, formAction] = useFormState(submitClientOrder, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {/* Honeypot — visually hidden, off-screen; real users never fill it. */}
      <div aria-hidden className="absolute left-[-9999px] top-[-9999px]" tabIndex={-1}>
        <label>
          Company (leave blank)
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block sm:col-span-2">
          <span className="block text-sm font-medium text-gray-700 mb-1">Patient name <span className="text-red-500">*</span></span>
          <input name="patientName" required maxLength={120} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Contact name <span className="text-gray-400 font-normal">(if different)</span></span>
          <input name="patientContactName" maxLength={120} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></span>
          <input name="patientPhone" type="tel" required maxLength={40} placeholder="(555) 123-4567" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></span>
          <input name="patientEmail" type="email" maxLength={200} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-sm font-medium text-gray-700 mb-1">Street address <span className="text-red-500">*</span></span>
          <input name="patientAddress" required maxLength={200} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></span>
          <input name="patientCity" required maxLength={80} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></span>
          <input name="patientState" required maxLength={2} placeholder="IL" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">ZIP <span className="text-red-500">*</span></span>
          <input name="patientZip" required maxLength={10} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Requested date/time window <span className="text-gray-400 font-normal">(optional)</span></span>
          <input name="requestedWindow" maxLength={200} placeholder="e.g. Mon–Wed mornings" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(anything the phlebotomist should know)</span></span>
          <textarea name="patientNotes" rows={3} maxLength={2000} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </label>
      </div>

      <p className="text-xs text-gray-500">
        Your order goes to our team for review before scheduling — you’ll get a tracking link once it’s submitted. Pricing and provider assignment are handled by our team.
      </p>
      <SubmitButton />
    </form>
  )
}
