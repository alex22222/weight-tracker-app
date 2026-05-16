/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['@cloudbase/node-sdk']
  },
  swcMinify: false,
  generateBuildId: async () => 'build',
}
