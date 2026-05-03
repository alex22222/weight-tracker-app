import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from "../../../lib/db-adapter"
import { getUserFromRequest } from "../../../lib/auth"

export const dynamic = 'force-dynamic'

// 验证 Token
function getUserFromToken(request: NextRequest): { userId: string; username: string } | null {
  try {
    return getUserFromRequest(request)
  } catch {
    return null
  }
}

// POST /api/feedback - 提交反馈
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { type, content, contact } = body

    if (!type || !content) {
      return NextResponse.json({ error: '反馈类型和内容不能为空' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: '反馈内容不能超过1000字' }, { status: 400 })
    }

    const result = await adapter.createFeedback({
      userId: user.userId,
      type,
      content,
      contact: contact || ''
    })

    return NextResponse.json({ 
      message: '反馈提交成功', 
      id: result.id 
    })
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json({ error: '提交失败' }, { status: 500 })
  }
}

// GET /api/feedback - 获取当前用户的反馈列表
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const feedback = await adapter.getFeedbackByUser(user.userId)
    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error getting feedback:', error)
    return NextResponse.json({ error: '获取反馈失败' }, { status: 500 })
  }
}
