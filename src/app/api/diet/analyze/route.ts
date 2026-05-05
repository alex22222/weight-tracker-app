import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/cloudbase'
import { getUserFromRequest } from '../../../../lib/auth'
import { analyzeDietImage } from '../../../../lib/ai-client'

export const dynamic = 'force-dynamic'

const MAX_DAILY_UPLOADS = 3

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 后台执行 AI 分析（不阻塞 HTTP 响应）
async function runAnalysisInBackground(recordId: string, image: string) {
  try {
    console.log(`[AI Background] Starting analysis for record ${recordId}`)
    const result = await analyzeDietImage(image)
    console.log(`[AI Background] Result for ${recordId}:`, JSON.stringify(result))

    const dietCollection = db.collection('diet_records')
    if (result.canCalculate) {
      await dietCollection.doc(recordId).update({
        status: 'completed',
        calories: result.calories ?? 0,
        foodItems: result.foodItems || [],
        analysis: result.analysis || '',
        completedAt: new Date(),
      })
    } else {
      await dietCollection.doc(recordId).update({
        status: 'failed',
        error: result.reason || '无法计算',
        completedAt: new Date(),
      })
    }
  } catch (err: any) {
    console.error(`[AI Background] Error for ${recordId}:`, err)
    const dietCollection = db.collection('diet_records')
    await dietCollection.doc(recordId).update({
      status: 'failed',
      error: err.message || '分析异常',
      completedAt: new Date(),
    })
  }
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

    // 创建"分析中"记录
    const record = {
      userId: user.userId,
      date: today,
      status: 'analyzing',
      calories: 0,
      foodItems: [],
      analysis: '',
      imageSnapshot: image.slice(0, 200) + '...',
      createdAt: new Date(),
    }

    const addRes = await dietCollection.add(record)
    const recordId = addRes.id
    console.log('[API /diet/analyze] Record created, id:', recordId)

    // 后台启动 AI 分析（不 await，立即返回）
    runAnalysisInBackground(recordId, image)

    return NextResponse.json({
      success: true,
      taskId: recordId,
      status: 'analyzing',
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

// GET /api/diet/analyze?id=xxx 查询分析状态
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return NextResponse.json({ error: '缺少任务ID' }, { status: 400 })
    }

    const dietCollection = db.collection('diet_records')
    const res = await dietCollection.doc(taskId).get()
    // CloudBase Node SDK 的 doc().get() 返回 { data: [doc] } 或 { data: doc }
    const record = Array.isArray(res.data) ? res.data[0] : res.data

    if (!record) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }

    // 兼容类型不一致（string vs number）
    if (String(record.userId) !== String(user.userId)) {
      console.log('[GET /diet/analyze] User mismatch:', { recordUserId: record.userId, requestUserId: user.userId })
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    // 兼容旧数据：没有 status 字段的视为 completed
    const status = record.status || 'completed'
    return NextResponse.json({
      success: true,
      status,
      calories: record.calories,
      foodItems: record.foodItems,
      analysis: record.analysis,
      error: record.error,
    })
  } catch (error: any) {
    console.error('[API /diet/analyze] GET Error:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
