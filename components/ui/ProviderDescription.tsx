/**
 * Server-render-safe provider description with:
 *   - Word-boundary truncation at ~180 chars
 *   - "Read more" inline expand via native <details> (no JS required)
 *   - Junk-flag short-circuit → renders "Contact for details." instead
 *
 * Full text is always present in the rendered HTML (inside the <details>
 * element), so Googlebot sees the complete content for SEO. The visible
 * truncation is purely a UX layer.
 */

const DEFAULT_TRUNCATE_AT = 180

interface ProviderDescriptionProps {
  description: string | null | undefined
  flagged?: boolean
  truncateAt?: number
  className?: string
}

/**
 * Find a word-boundary cut at or before the target length so we don't slice
 * a word in half (e.g. "specia…" instead of "speci…"). Falls back to the
 * raw cut if there's no whitespace in the first N chars.
 */
function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const slice = text.slice(0, maxLength)
  const lastSpace = slice.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.6) return slice.slice(0, lastSpace).trimEnd()
  return slice.trimEnd()
}

export function ProviderDescription({
  description,
  flagged,
  truncateAt = DEFAULT_TRUNCATE_AT,
  className = '',
}: ProviderDescriptionProps) {
  if (!description || !description.trim()) return null

  if (flagged) {
    return (
      <p className={`text-gray-500 italic ${className}`}>
        Contact for details.
      </p>
    )
  }

  const text = description.trim()
  if (text.length <= truncateAt) {
    return <p className={`text-gray-600 ${className}`}>{text}</p>
  }

  const truncated = truncateAtWordBoundary(text, truncateAt)
  const remainder = text.slice(truncated.length).trimStart()

  return (
    <details className={`provider-description group ${className}`}>
      <summary className="text-gray-600 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span>{truncated}</span>
        <span className="text-gray-400 group-open:hidden">… </span>
        <span className="text-primary-600 font-medium group-open:hidden hover:underline">Read more</span>
      </summary>
      <p className="text-gray-600 mt-1">
        <span className="sr-only">{truncated} </span>
        {remainder}
      </p>
      <span className="text-primary-600 font-medium hidden group-open:inline cursor-pointer text-sm mt-1 hover:underline">
        Show less
      </span>
    </details>
  )
}
