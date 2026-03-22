import { NextResponse } from 'next/server'

/**
 * 健康检查 API
 * 用于 CloudRun 健康检查和负载均衡
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'weight-tracker-api',
    version: process.env.npm_package_version || '1.0.0',
  }, { status: 200 })
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
