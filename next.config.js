/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // This enables static export for Vercel deployment
  trailingSlash: true, // This ensures all routes have trailing slashes for consistency
}

module.exports = nextConfig