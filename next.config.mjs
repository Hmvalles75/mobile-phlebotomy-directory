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
      {
        source: '/provider/provider-:id',
        destination: '/find-providers',
        permanent: true,
      },
    ]
  },
}

export default nextConfig