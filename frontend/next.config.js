/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimizado para containers y Vercel
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ]
      }
    ]
  }
}
module.exports = nextConfig
