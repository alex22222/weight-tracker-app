/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Ensure proper output for Docker
  distDir: '.next',
  // External packages that should not be bundled
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@cloudbase/node-sdk'],
  },
}

module.exports = nextConfig
