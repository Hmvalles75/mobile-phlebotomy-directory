'use client'

interface RatingBadgeProps {
  rating: number
  reviewsCount?: number
  variant?: 'default' | 'compact' | 'featured'
  showReviews?: boolean
  className?: string
}

export function RatingBadge({ 
  rating, 
  reviewsCount, 
  variant = 'default',
  showReviews = true,
  className = '' 
}: RatingBadgeProps) {
  // Determine rating quality for styling
  const getRatingStyle = (rating: number) => {
    if (rating >= 4.8) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (rating >= 4.5) return 'bg-green-100 text-green-800 border-green-200'
    if (rating >= 4.0) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getTrustBadge = (rating: number) => {
    if (rating >= 4.8) return { text: 'Excellent', icon: '🏆' }
    if (rating >= 4.5) return { text: 'Top Rated', icon: '⭐' }
    if (rating >= 4.0) return { text: 'Highly Rated', icon: '✨' }
    return null
  }

  const ratingStyle = getRatingStyle(rating)
  const trustBadge = getTrustBadge(rating)

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 text-sm ${className}`}>
        <span className="text-yellow-500">⭐</span>
        <span className="font-medium text-gray-900">{Number(rating).toFixed(1)}</span>
        {showReviews && reviewsCount && (
          <span className="text-gray-600">({reviewsCount})</span>
        )}
      </div>
    )
  }

  if (variant === 'featured') {
    return (
      <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
        {trustBadge && (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${ratingStyle}`}>
            <span>{trustBadge.icon}</span>
            <span>{trustBadge.text}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-yellow-500 text-lg">⭐</span>
          <span className="font-bold text-gray-900">{Number(rating).toFixed(1)}</span>
          {showReviews && reviewsCount && (
            <span className="text-gray-600 text-sm">({reviewsCount} reviews)</span>
          )}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {trustBadge && (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${ratingStyle}`}>
          <span>{trustBadge.icon}</span>
          <span>{trustBadge.text}</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">⭐</span>
        <span className="font-medium text-gray-900">{Number(rating).toFixed(1)}</span>
        {showReviews && reviewsCount && (
          <span className="text-gray-600">({reviewsCount} review{reviewsCount !== 1 ? 's' : ''})</span>
        )}
      </div>
    </div>
  )
}

// Helper component for multiple star display
export function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base', 
    lg: 'text-lg'
  }

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]}`} aria-label={`${rating} out of 5 stars`}>
      {/* Full stars */}
      {Array.from({ length: fullStars }, (_, i) => (
        <span key={`full-${i}`} className="text-yellow-500">★</span>
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <span className="text-yellow-500 relative">
          <span className="text-gray-300">★</span>
          <span className="absolute inset-0 overflow-hidden w-1/2 text-yellow-500">★</span>
        </span>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }, (_, i) => (
        <span key={`empty-${i}`} className="text-gray-300">★</span>
      ))}
    </div>
  )
}

export default RatingBadge