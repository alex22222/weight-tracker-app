import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'
import { getUserFromRequest } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/usage - 上报使用时长增量
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { deltaSeconds } = body

    const delta = parseInt(deltaSeconds, 10)
    if (isNaN(delta) || delta < 0 || delta > 3600) {
      return NextResponse.json({ error: '无效的使用时长' }, { status: 400 })
    }

    await adapter.updateUserUsageTime(user.userId, delta)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API /usage] POST Error:', error?.message || error)
    return NextResponse.json({ error: '上报失败' }, { status: 500 })
  }
}
