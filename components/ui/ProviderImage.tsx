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

  if (hasError || !src || (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/'))) {
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