'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'

/**
 * Service-area map that does not load Google Maps until asked.
 *
 * The premium template embedded the Google Maps iframe on every visit. It is
 * the heaviest third-party asset on the page and most visitors never touch
 * it. This renders a light static card with the location and a "Load map"
 * button; the iframe is created only on click. A plain link opens Google
 * Maps in a new tab for people who just want directions.
 */
export function ClickToLoadMap({
  providerName, label, coords, query,
}: { providerName: string; label: string; coords?: { lat: number; lng: number }; query?: string }) {
  const [loaded, setLoaded] = useState(false)
  const target = coords ? `${coords.lat},${coords.lng}` : query
  if (!target) return null
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(target)}&z=12&output=embed`
  const openSrc = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`

  if (loaded) {
    return (
      <div className="mt-8 rounded-xl overflow-hidden border border-teal-100 shadow-md bg-white">
        <iframe
          title={`${providerName} service area map`}
          src={embedSrc}
          width="100%"
          height="380"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-xl border border-teal-100 shadow-md bg-white p-8 md:p-10 flex flex-col items-center text-center" style={{ minHeight: 220 }}>
      <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mb-4">
        <MapPin className="text-teal-600" size={28} />
      </div>
      <div className="text-lg font-semibold text-gray-900">{label}</div>
      <p className="text-sm text-gray-500 mt-1 mb-5">Interactive map loads on request so the page stays fast.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Load map
        </button>
        <a
          href={openSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-teal-200 text-teal-700 hover:bg-teal-50 font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  )
}
