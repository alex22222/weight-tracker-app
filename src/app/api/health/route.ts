import { NextResponse } from 'next/server'

// GET /api/health - 健康检查
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}

// POST /api/health - 健康检查（兼容）
export async function POST() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}
