/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Next/image refuses SVG by default for security (SVG can contain
    // embedded JS). Provider logos uploaded by us into /public/images
    // are trusted; enable rendering with strict CSP + attachment headers
    // so any future externally-sourced SVG still can't execute scripts.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mobilephlebotomy.org',
      },
      {
        protocol: 'https',
        hostname: 'www.mobilephlebotomy.org',
      },
      // Allow all external image domains for provider logos
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/provider/mc-mobile-phlebotomist-667',
        destination: '/mobile-phlebotomist',
      },
    ]
  },
  async redirects() {
    return [
      // Redirect non-www to www for canonical domain
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'mobilephlebotomy.org',
          },
        ],
        destination: 'https://www.mobilephlebotomy.org/:path*',
        permanent: true,
      },
      {
        source: '/provider/provider-:id',
        destination: '/search',
        permanent: true,
      },
      // Redirect /mobile-phlebotomy-prices to existing /mobile-phlebotomy-cost page
      {
        source: '/mobile-phlebotomy-prices',
        destination: '/mobile-phlebotomy-cost',
        permanent: true,
      },
      // Consolidate the legacy hardcoded CAREWITHLUVS landing page into the
      // canonical provider detail URL. The premium template on /provider/[slug]
      // now renders the same rich layout via the premiumPage flag, so the
      // standalone page is redundant. 301 preserves any accumulated SEO
      // authority from backlinks pointing at the Maryland URL.
      {
        source: '/maryland/carewithluvs-mobile-phlebotomy',
        destination: '/provider/carewithluvs-llc',
        permanent: true,
      },
      // $199 premium-page vanity URL for Gentle Trace Mobile (Columbus OH, paid
      // 2026-07). Clean address she can put on cards/flyers; redirects to her
      // premium provider page. Same pattern as CAREWITHLUVS above.
      {
        source: '/ohio/gentle-trace-mobile-phlebotomy',
        destination: '/provider/gentle-trace-mobile',
        permanent: true,
      },
      // Removed-at-provider-request 301s. Listing rows still exist in the DB
      // with removedAt set (preserving Lead.routedToId history and blocking
      // the unique slug), but the public page now redirects to the closest
      // canonical location page. Add an entry here for each removed provider
      // until volume justifies a DB-driven middleware redirect.
      {
        // Site canonicalizes /us/<full-state-slug>/<city>; 2-letter abbreviation
        // URLs (/us/ny/...) 301-redirect to the slug form. Pointing removal
        // redirects directly at the slug avoids a 2-hop chain.
        source: '/provider/just-a-pinch-mobile-phlebotomy',
        destination: '/us/new-york/saint-albans',
        permanent: true,
      },
      {
        source: '/provider/comfortcare-mobile-labs',
        destination: '/us/california/sacramento',
        permanent: true,
      },
      {
        // Stub record cleanup 2026-06-18 — generic "Mobile Phlebotomist"
        // placeholder in Brooklyn Park, MN with no real contact info.
        source: '/provider/mobile-phlebotomist',
        destination: '/us/minnesota/minneapolis',
        permanent: true,
      },
      {
        // Removed at provider request 2026-07-16 (Tiffani Fouse, opted out).
        source: '/provider/veni-vidi-vici-private-labsllc',
        destination: '/us/california/los-angeles',
        permanent: true,
      },
      {
        // Removed at provider request 2026-08-02 (Everlene McAllister,
        // Diamond Wellness Solutions, Las Vegas — withdrew authorization).
        source: '/provider/diamond-wellness-solutions',
        destination: '/us/nevada/las-vegas',
        permanent: true,
      },
      // ── URL consolidation pilot (2026-07) ──────────────────────────────
      // Phoenix, San Diego, and San Antonio each had a canonical
      // /us/{state}/{city} page plus a P2 /us/metro/{city} duplicate (and,
      // for San Diego, a P3 /{city}-{st}/mobile-phlebotomy duplicate) — all
      // self-canonicalizing and competing in search. Collapse the duplicates
      // into the /us/ page. 301 preserves accrued authority; the /us/ pages
      // now carry the ported long-form copy. Intent-variant P3 pages
      // (/san-diego-ca/in-home-blood-draw etc.) are a different keyword and
      // are intentionally left in place.
      { source: '/us/metro/phoenix', destination: '/us/arizona/phoenix', permanent: true },
      { source: '/us/metro/san-antonio', destination: '/us/texas/san-antonio', permanent: true },
      { source: '/us/metro/san-diego', destination: '/us/california/san-diego', permanent: true },
      { source: '/san-diego-ca/mobile-phlebotomy', destination: '/us/california/san-diego', permanent: true },

      // ── Consolidation batch 1: Chicago (2026-08-07) ────────────────────
      // Verification case for the remaining batches (Michigan, Texas, rest).
      // Prerequisites met before shipping: /us/illinois/chicago is generated
      // with LocalBusiness, FAQPage and BreadcrumbList schema, its canonical
      // resolves through SITE_URL to the www host, and the legacy page's
      // long-form prose has been ported into data/city-longform.ts so the
      // redirect target does not lose the copy that was ranking.
      //
      // ALL variants fold, superseding the pilot's keep-the-intent-variants
      // rule. That rule assumed the variants earned their own traffic; GSC
      // says otherwise — 60 variant pages produced ~25 clicks in three months
      // and Chicago's produced zero. Splitting a city's signal three ways to
      // protect nothing is a bad trade.
      //
      // Sources are enumerated from disk by
      // scripts/discover-legacy-city-routes.ts (--city=chicago-il --emit), not
      // from a suffix list — variants are inconsistent per city
      // (lab-draw-at-home and mobile-phlebotomist each appear only a handful
      // of times) and a hardcoded list would miss them.
      { source: '/us/metro/chicago', destination: '/us/illinois/chicago', permanent: true },
      { source: '/chicago-il/blood-draw-at-home', destination: '/us/illinois/chicago', permanent: true },
      { source: '/chicago-il/in-home-blood-draw', destination: '/us/illinois/chicago', permanent: true },
      { source: '/chicago-il/mobile-phlebotomy', destination: '/us/illinois/chicago', permanent: true },
    ]
  },
}

export default nextConfig