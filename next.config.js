/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['*.tcb.qcloud.la'] // 允许 CloudBase 存储域名
  },
  experimental: {
    serverComponentsExternalPackages: ['@cloudbase/node-sdk', 'tencentcloud-sdk-nodejs']
  },
  // 生产环境禁用控制台日志
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // 环境变量配置
  env: {
    CUSTOM_KEY: 'my-value',
  },
  // 重定向配置
  async redirects() {
    return []
  },
  // 头部配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
