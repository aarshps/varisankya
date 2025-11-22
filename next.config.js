/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' since we need API routes for authentication
  trailingSlash: true, // This ensures all routes have trailing slashes for consistency
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

module.exports = nextConfig