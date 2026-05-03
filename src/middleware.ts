import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// CORS 允许的域名
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://localhost:3000',
      'https://spaceflag.site',
      'https://www.spaceflag.site',
      'https://www.spaceflag.site.tcbaccess.tencentcloudbase.com',
    ]

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  
  // 判断 origin 是否允许
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')
  
  // 预检请求处理
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // 普通请求：继续处理，在响应中添加 CORS 头
  const response = NextResponse.next()
  
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  
  // 安全头
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

// 匹配 API 路由和静态资源
export const config = {
  matcher: ['/api/:path*'],
}
