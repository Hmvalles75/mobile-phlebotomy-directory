'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ProviderImageProps {
  src: string
  alt: string
  className?: string
}

export function ProviderImage({ src, alt, className }: ProviderImageProps) {
  const [hasError, setHasError] = useState(false)

  // Check if it's a valid image URL
  const isValidImageUrl = src &&
    (src.startsWith('http://') || src.startsWith('https://')) &&
    !src.startsWith('data:') && // Exclude data URLs (base64 placeholders)
    src.length > 10 // Exclude very short URLs

  if (hasError || !isValidImageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <span className="text-4xl text-gray-400">🏥</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      priority
      onError={() => setHasError(true)}
    />
  )
}