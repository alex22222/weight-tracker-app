/**
 * 获取用户最近记录
 * GET /api/last-record?type=weight|reading
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'
import { getUserFromRequest } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'weight') {
      const entry = await adapter.getLastWeightEntryByUser(user.userId)
      return NextResponse.json({ entry })
    }

    if (type === 'reading') {
      const entry = await adapter.getLastReadingEntryByUser(user.userId)
      return NextResponse.json({ entry })
    }

    if (type === 'running') {
      const entry = await adapter.getLastRunningEntryByUser(user.userId)
      return NextResponse.json({ entry })
    }

    if (type === 'cycling') {
      const entry = await adapter.getLastCyclingEntryByUser(user.userId)
      return NextResponse.json({ entry })
    }

    return NextResponse.json({ error: '无效的类型' }, { status: 400 })
  } catch (error) {
    console.error('获取最近记录失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
