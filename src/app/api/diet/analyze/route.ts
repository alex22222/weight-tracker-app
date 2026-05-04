import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/cloudbase'
import { getUserFromRequest } from '../../../../lib/auth'
import { analyzeDietImage } from '../../../../lib/deepseek'

export const dynamic = 'force-dynamic'

const MAX_DAILY_UPLOADS = 3

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export async function POST(request: NextRequest) {
  console.log('[API /diet/analyze] POST request received')

  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { image } = body

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: '请上传图片' }, { status: 400 })
    }

    const today = getTodayString()
    const dietCollection = db.collection('diet_records')

    // 检查今日上传次数
    const countRes = await dietCollection.where({ userId: user.userId, date: today }).count()
    const todayCount = countRes.total || 0

    if (todayCount >= MAX_DAILY_UPLOADS) {
      return NextResponse.json(
        { error: '今日上传次数已达上限（3次）', remainingToday: 0 },
        { status: 429 }
      )
    }

    // 调用 DeepSeek 分析
    const result = await analyzeDietImage(image)

    if (!result.canCalculate) {
      return NextResponse.json({
        success: false,
        error: result.reason || '无法计算',
        remainingToday: MAX_DAILY_UPLOADS - todayCount,
      })
    }

    // 保存到数据库
    const record = {
      userId: user.userId,
      date: today,
      calories: result.calories ?? 0,
      foodItems: result.foodItems || [],
      analysis: result.analysis || '',
      createdAt: new Date(),
    }

    await dietCollection.add(record)
    console.log('[API /diet/analyze] Record saved for user:', user.userId)

    return NextResponse.json({
      success: true,
      calories: result.calories,
      foodItems: result.foodItems,
      analysis: result.analysis,
      remainingToday: MAX_DAILY_UPLOADS - todayCount - 1,
    })
  } catch (error: any) {
    console.error('[API /diet/analyze] Error:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
