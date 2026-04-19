/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['@cloudbase/node-sdk']
  },
  swcMinify: false
}
