/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@cloudbase/node-sdk', 'tencentcloud-sdk-nodejs']
  }
}

module.exports = nextConfig
