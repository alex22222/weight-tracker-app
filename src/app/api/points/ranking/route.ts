import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { pointsService } from '../../../../lib/points-service'
import { getUserFromRequest } from '../../../../lib/auth'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GET /api/points/ranking - 获取积分排行榜
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const ranking = await pointsService.getPointsRanking(limit)
    return NextResponse.json({ ranking })
  } catch (error) {
    console.error('Error fetching points ranking:', error)
    return NextResponse.json({ error: '获取排行失败' }, { status: 500 })
  }
}
