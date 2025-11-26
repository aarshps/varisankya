/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Enable static HTML export for Android
    trailingSlash: true,
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
}

module.exports = nextConfig
