/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
    ]
  },
}

export default nextConfig