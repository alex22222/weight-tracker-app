import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// 验证 admin
async function verifyAdmin(adminId: string | null) {
  if (!adminId) return null
  const admin = await adapter.getUserById(adminId)
  if (!admin || admin.username !== 'admin') return null
  return admin
}

// GET /api/admin/feedback?adminId={adminId} - 获取所有反馈
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    const admin = await verifyAdmin(adminId)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const feedback = await adapter.getAllFeedback()
    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

// PATCH /api/admin/feedback - 更新反馈状态
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, feedbackId, status } = body

    const admin = await verifyAdmin(adminId)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!feedbackId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    await adapter.updateFeedbackStatus(feedbackId, status)
    return NextResponse.json({ message: 'Feedback updated' })
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
  }
}
