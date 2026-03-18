console.error('>>> Loading next.config.js...');

/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    console.error('>>> generateBuildId called!');
    return 'test-build-id';
  }
}

console.error('>>> next.config.js loaded, generateBuildId:', typeof nextConfig.generateBuildId);

module.exports = nextConfig
