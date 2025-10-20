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
  async redirects() {
    return [
      {
        source: '/provider/mc-mobile-phlebotomist-667',
        destination: '/search',
        permanent: false,
      },
    ]
  },
}

export default nextConfig