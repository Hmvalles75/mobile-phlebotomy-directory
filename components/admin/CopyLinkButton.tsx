'use client'

import { useState } from 'react'

interface Props {
  url: string
  label?: string
  className?: string
}

export default function CopyLinkButton({ url, label = 'Copy share link', className = '' }: Props) {
  const [copied, setCopied] = useState(false)
  const onClick = async () => {
    try {
      // Resolve to absolute URL at click-time so it works regardless of dev/prod
      const absolute = url.startsWith('http')
        ? url
        : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`
      await navigator.clipboard.writeText(absolute)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: open prompt for manual copy
      // eslint-disable-next-line no-alert
      window.prompt('Copy this link:', url)
    }
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors ${className}`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}
