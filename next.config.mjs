import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_URL?.replace('https://', '') || 'cdn.videoffers.com'
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon'
      }
    ]
  }
}

export default withNextIntl(nextConfig)
