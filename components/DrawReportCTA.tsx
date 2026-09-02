'use client'

// Client only so the subscribe link can report a click. The component holds no
// server data — it is presentational — so the boundary costs nothing.
import { ga4 } from '@/lib/ga4'

export default function DrawReportCTA() {
  return (
    <div className="bg-primary-50 rounded-xl p-8 md:p-10 text-center">
      <span className="text-3xl mb-3 block">📬</span>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">The Draw Report</h3>
      <p className="text-sm text-primary-600 font-semibold mb-4">Free newsletter for mobile phlebotomists</p>
      <p className="text-gray-600 leading-relaxed max-w-xl mx-auto mb-6">
        Tips on getting patients, billing insurance, landing contracts, and growing your practice. Delivered to your inbox.
      </p>
      <a
        href="https://thedrawreport.beehiiv.com/subscribe"
        target="_blank"
        rel="noopener noreferrer"
        // A click, not a subscription: the form lives on beehiiv.com and the
        // outcome is not observable from here.
        onClick={() => ga4.newsletterCtaClick({ source: 'draw_report_cta' })}
        className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        Subscribe Free
      </a>
    </div>
  )
}
