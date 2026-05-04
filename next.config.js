/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  outputFileTracing: true,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['@cloudbase/node-sdk']
  },
  swcMinify: false,
  generateBuildId: async () => 'build',
}
