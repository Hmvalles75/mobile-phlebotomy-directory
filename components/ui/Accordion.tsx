"use client"

import { useState } from "react"

type AccordionProps = {
  summary: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SimpleAccordion({ summary, children, defaultOpen = true }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="border rounded-lg bg-gray-100">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm md:text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span>{summary}</span>
        <span className="ml-3 text-xs md:text-sm text-gray-600">
          {open ? "Hide details ↑" : "Read full guide ↓"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm md:text-base space-y-3 text-gray-700">
          {children}
        </div>
      )}
    </section>
  )
}
