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
      // Add other trusted domains as needed
      // For example, if you use a CDN:
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.mobilephlebotomy.org',
      // },
    ],
  },
}

export default nextConfig