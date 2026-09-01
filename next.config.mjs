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
        // Quick Labs LLC — removed 2026-08-20 at the provider's request.
        // Mary Berry asked to be taken off the list, had to ask a second time
        // after a courtesy email reached her through a path with no
        // suppression check, then confirmed she wanted the listing gone too.
        source: '/provider/quick-labs-llc',
        destination: '/us/pennsylvania/doylestown',
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
      {
        // All Things Phlebotomy LLC (Flint, MI). Not a removal — a slug repair.
        // The submitted business name carried a trailing space, so the listing
        // was created at `all-things-phlebotomy-` with a dangling hyphen, while
        // the clean slug was held by a duplicate a scraper created two days
        // after the owner signed up himself. The duplicate is soft-removed and
        // the real listing now holds the clean slug.
        source: '/provider/all-things-phlebotomy-',
        destination: '/provider/all-things-phlebotomy',
        permanent: true,
      },
      {
        // The retired scraped duplicate, renamed off the clean slug.
        source: '/provider/all-things-phlebotomy-dup-20260826',
        destination: '/provider/all-things-phlebotomy',
        permanent: true,
      },
      {
        // Salina's Mobile Phlebotomy (Colorado Springs). Slug repair, not a
        // removal. The stored business name carried a trailing space and the
        // words "Biometric screening", producing a very long slug ending in a
        // dangling hyphen. She asked to drop those words on her fourth
        // submission of the same business; the listing is the same record.
        source: '/provider/salinas-mobile-phlebotomy-biometric-screening-healthcare-service-',
        destination: '/provider/salinas-mobile-phlebotomy-healthcare-service',
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

      // ── Legacy P3 tier consolidation (2026-08-21) ──────────────────────────
      // The /{city}-{st}/{slug} pages were the last URL tier still splitting
      // ranking signal. Unlike /us/metro/* — which cross-canonicals to its city
      // page and needed no redirects — every legacy page declared ITSELF
      // canonical via its own layout.tsx, and app/sitemap.ts submitted 102 of
      // them. The site was actively telling Google these were distinct pages.
      //
      // Prose from the content-bearing pages was ported into
      // data/city-longform.ts BEFORE these redirects, following the pattern set
      // by the Chicago and San Diego consolidations: port, then redirect, so a
      // 308 never discards copy that was ranking.
      //
      // Manhattan and Queens were the only NYC boroughs missing from
      // CITY_MAPPING while bronx, brooklyn and staten-island all had entries
      // and rendered. They were added rather than folded into
      // /us/new-york/new-york, so all five boroughs now behave the same way and
      // each legacy URL redirects to its own borough page.
      //
      // The remaining cities absent from CITY_MAPPING redirect to their nearest
      // parent city page rather than to a page that does not exist:
      //   beverly-hills, west-hollywood  -> /us/california/los-angeles
      //   livonia, southfield, troy      -> /us/michigan/detroit
      //   bayonne                        -> /us/new-jersey/jersey-city
      // The last six are independent municipalities rather than neighbourhoods
      // of their targets; folding them trades locality precision for a single
      // ranking signal.
      //
      // NOT redirected yet: worcester-ma, lowell-ma, charlotte-nc, columbus-oh
      // (12 URLs). Each carries city-specific prose, but CITY_LONGFORM renders
      // only through a generated static override and none of those four has
      // one. Redirecting them would destroy the copy. Generating the overrides
      // needs scripts/upgrade-city-page.ts, which reads the database.
      { source: '/bayonne-nj/blood-draw-at-home', destination: '/us/new-jersey/jersey-city', permanent: true },
      { source: '/bayonne-nj/in-home-blood-draw', destination: '/us/new-jersey/jersey-city', permanent: true },
      { source: '/bayonne-nj/mobile-phlebotomy', destination: '/us/new-jersey/jersey-city', permanent: true },
      { source: '/beverly-hills-ca/blood-draw-at-home', destination: '/us/california/los-angeles', permanent: true },
      { source: '/beverly-hills-ca/in-home-blood-draw', destination: '/us/california/los-angeles', permanent: true },
      { source: '/beverly-hills-ca/mobile-phlebotomy', destination: '/us/california/los-angeles', permanent: true },
      { source: '/boston-ma/blood-draw-at-home', destination: '/us/massachusetts/boston', permanent: true },
      { source: '/boston-ma/in-home-blood-draw', destination: '/us/massachusetts/boston', permanent: true },
      { source: '/boston-ma/mobile-phlebotomy', destination: '/us/massachusetts/boston', permanent: true },
      { source: '/bronx-ny/blood-draw-at-home', destination: '/us/new-york/bronx', permanent: true },
      { source: '/bronx-ny/in-home-blood-draw', destination: '/us/new-york/bronx', permanent: true },
      { source: '/bronx-ny/mobile-phlebotomy', destination: '/us/new-york/bronx', permanent: true },
      { source: '/brooklyn-ny/blood-draw-at-home', destination: '/us/new-york/brooklyn', permanent: true },
      { source: '/brooklyn-ny/in-home-blood-draw', destination: '/us/new-york/brooklyn', permanent: true },
      { source: '/brooklyn-ny/mobile-phlebotomy', destination: '/us/new-york/brooklyn', permanent: true },
      { source: '/burbank-ca/blood-draw-at-home', destination: '/us/california/burbank', permanent: true },
      { source: '/burbank-ca/in-home-blood-draw', destination: '/us/california/burbank', permanent: true },
      { source: '/burbank-ca/mobile-phlebotomy', destination: '/us/california/burbank', permanent: true },
      { source: '/dallas-tx/blood-draw-at-home', destination: '/us/texas/dallas', permanent: true },
      { source: '/dallas-tx/in-home-blood-draw', destination: '/us/texas/dallas', permanent: true },
      { source: '/dallas-tx/mobile-phlebotomy', destination: '/us/texas/dallas', permanent: true },
      { source: '/dearborn-mi/blood-draw-at-home', destination: '/us/michigan/dearborn', permanent: true },
      { source: '/dearborn-mi/in-home-blood-draw', destination: '/us/michigan/dearborn', permanent: true },
      { source: '/dearborn-mi/mobile-phlebotomy', destination: '/us/michigan/dearborn', permanent: true },
      { source: '/detroit-mi/blood-draw-at-home', destination: '/us/michigan/detroit', permanent: true },
      { source: '/detroit-mi/in-home-blood-draw', destination: '/us/michigan/detroit', permanent: true },
      { source: '/detroit-mi/lab-draw-at-home', destination: '/us/michigan/detroit', permanent: true },
      { source: '/detroit-mi/mobile-phlebotomist', destination: '/us/michigan/detroit', permanent: true },
      { source: '/detroit-mi/mobile-phlebotomy', destination: '/us/michigan/detroit', permanent: true },
      { source: '/glendale-ca/blood-draw-at-home', destination: '/us/california/glendale', permanent: true },
      { source: '/glendale-ca/in-home-blood-draw', destination: '/us/california/glendale', permanent: true },
      { source: '/glendale-ca/mobile-phlebotomy', destination: '/us/california/glendale', permanent: true },
      { source: '/houston-tx/blood-draw-at-home', destination: '/us/texas/houston', permanent: true },
      { source: '/houston-tx/in-home-blood-draw', destination: '/us/texas/houston', permanent: true },
      { source: '/houston-tx/mobile-phlebotomy', destination: '/us/texas/houston', permanent: true },
      { source: '/jersey-city-nj/blood-draw-at-home', destination: '/us/new-jersey/jersey-city', permanent: true },
      { source: '/jersey-city-nj/in-home-blood-draw', destination: '/us/new-jersey/jersey-city', permanent: true },
      { source: '/jersey-city-nj/mobile-phlebotomy', destination: '/us/new-jersey/jersey-city', permanent: true },
      { source: '/livonia-mi/blood-draw-at-home', destination: '/us/michigan/detroit', permanent: true },
      { source: '/livonia-mi/in-home-blood-draw', destination: '/us/michigan/detroit', permanent: true },
      { source: '/livonia-mi/mobile-phlebotomy', destination: '/us/michigan/detroit', permanent: true },
      { source: '/long-beach-ca/blood-draw-at-home', destination: '/us/california/long-beach', permanent: true },
      { source: '/long-beach-ca/in-home-blood-draw', destination: '/us/california/long-beach', permanent: true },
      { source: '/long-beach-ca/mobile-phlebotomy', destination: '/us/california/long-beach', permanent: true },
      { source: '/los-angeles-ca/blood-draw-at-home', destination: '/us/california/los-angeles', permanent: true },
      { source: '/los-angeles-ca/in-home-blood-draw', destination: '/us/california/los-angeles', permanent: true },
      { source: '/los-angeles-ca/lab-draw-at-home', destination: '/us/california/los-angeles', permanent: true },
      { source: '/los-angeles-ca/mobile-phlebotomy', destination: '/us/california/los-angeles', permanent: true },
      { source: '/manhattan-ny/blood-draw-at-home', destination: '/us/new-york/manhattan', permanent: true },
      { source: '/manhattan-ny/in-home-blood-draw', destination: '/us/new-york/manhattan', permanent: true },
      { source: '/manhattan-ny/mobile-phlebotomy', destination: '/us/new-york/manhattan', permanent: true },
      { source: '/miami-fl/blood-draw-at-home', destination: '/us/florida/miami', permanent: true },
      { source: '/miami-fl/in-home-blood-draw', destination: '/us/florida/miami', permanent: true },
      { source: '/miami-fl/mobile-phlebotomy', destination: '/us/florida/miami', permanent: true },
      { source: '/new-york-ny/blood-draw-at-home', destination: '/us/new-york/new-york', permanent: true },
      { source: '/new-york-ny/in-home-blood-draw', destination: '/us/new-york/new-york', permanent: true },
      { source: '/new-york-ny/lab-draw-at-home', destination: '/us/new-york/new-york', permanent: true },
      { source: '/new-york-ny/mobile-phlebotomy', destination: '/us/new-york/new-york', permanent: true },
      { source: '/newark-nj/blood-draw-at-home', destination: '/us/new-jersey/newark', permanent: true },
      { source: '/newark-nj/in-home-blood-draw', destination: '/us/new-jersey/newark', permanent: true },
      { source: '/newark-nj/mobile-phlebotomy', destination: '/us/new-jersey/newark', permanent: true },
      { source: '/pasadena-ca/blood-draw-at-home', destination: '/us/california/pasadena', permanent: true },
      { source: '/pasadena-ca/in-home-blood-draw', destination: '/us/california/pasadena', permanent: true },
      { source: '/pasadena-ca/mobile-phlebotomy', destination: '/us/california/pasadena', permanent: true },
      { source: '/queens-ny/blood-draw-at-home', destination: '/us/new-york/queens', permanent: true },
      { source: '/queens-ny/in-home-blood-draw', destination: '/us/new-york/queens', permanent: true },
      { source: '/queens-ny/mobile-phlebotomy', destination: '/us/new-york/queens', permanent: true },
      { source: '/san-diego-ca/blood-draw-at-home', destination: '/us/california/san-diego', permanent: true },
      { source: '/san-diego-ca/in-home-blood-draw', destination: '/us/california/san-diego', permanent: true },
      { source: '/santa-monica-ca/blood-draw-at-home', destination: '/us/california/santa-monica', permanent: true },
      { source: '/santa-monica-ca/in-home-blood-draw', destination: '/us/california/santa-monica', permanent: true },
      { source: '/santa-monica-ca/mobile-phlebotomy', destination: '/us/california/santa-monica', permanent: true },
      { source: '/southfield-mi/blood-draw-at-home', destination: '/us/michigan/detroit', permanent: true },
      { source: '/southfield-mi/in-home-blood-draw', destination: '/us/michigan/detroit', permanent: true },
      { source: '/southfield-mi/mobile-phlebotomy', destination: '/us/michigan/detroit', permanent: true },
      { source: '/staten-island-ny/blood-draw-at-home', destination: '/us/new-york/staten-island', permanent: true },
      { source: '/staten-island-ny/in-home-blood-draw', destination: '/us/new-york/staten-island', permanent: true },
      { source: '/staten-island-ny/mobile-phlebotomy', destination: '/us/new-york/staten-island', permanent: true },
      { source: '/torrance-ca/blood-draw-at-home', destination: '/us/california/torrance', permanent: true },
      { source: '/torrance-ca/in-home-blood-draw', destination: '/us/california/torrance', permanent: true },
      { source: '/torrance-ca/mobile-phlebotomy', destination: '/us/california/torrance', permanent: true },
      { source: '/troy-mi/blood-draw-at-home', destination: '/us/michigan/detroit', permanent: true },
      { source: '/troy-mi/in-home-blood-draw', destination: '/us/michigan/detroit', permanent: true },
      { source: '/troy-mi/mobile-phlebotomy', destination: '/us/michigan/detroit', permanent: true },
      { source: '/warren-mi/blood-draw-at-home', destination: '/us/michigan/warren', permanent: true },
      { source: '/warren-mi/in-home-blood-draw', destination: '/us/michigan/warren', permanent: true },
      { source: '/warren-mi/mobile-phlebotomy', destination: '/us/michigan/warren', permanent: true },
      { source: '/west-hollywood-ca/blood-draw-at-home', destination: '/us/california/los-angeles', permanent: true },
      { source: '/west-hollywood-ca/in-home-blood-draw', destination: '/us/california/los-angeles', permanent: true },
      { source: '/west-hollywood-ca/mobile-phlebotomy', destination: '/us/california/los-angeles', permanent: true },
    ]
  },
}

export default nextConfig