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
    ]
  },
}

export default nextConfig