/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' since we need API routes for authentication
  trailingSlash: true, // This ensures all routes have trailing slashes for consistency
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
}

module.exports = nextConfig