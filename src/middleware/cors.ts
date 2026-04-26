import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 允许的域名列表
const allowedOrigins = [
  'https://spaceflag.site',
  'https://www.spaceflag.site',
  'https://api.spaceflag.site',
  'http://localhost:3000',
  // 微信小程序没有 Origin，通过 referer 或自定义 header 判断
]

export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const referer = request.headers.get('referer') || ''
  
  // 检查是否是允许的域名，或者是微信小程序（无 origin）
  const isAllowed = allowedOrigins.some(allowed => 
    origin.includes(allowed) || referer.includes(allowed)
  ) || !origin // 微信小程序请求通常没有 origin

  // 创建响应
  const response = NextResponse.next()

  // 设置 CORS 头
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  return response
}

// 处理 OPTIONS 预检请求
export function handleCorsPreflight(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  return null
}
