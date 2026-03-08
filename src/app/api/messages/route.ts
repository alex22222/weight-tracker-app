import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../lib/db-adapter'

// 验证 JWT token 的简单实现
function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    // 简单解析 token (格式: base64(username:userId:timestamp))
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, userId] = decoded.split(':')
    if (!username || !userId) return null
    return { userId: parseInt(userId), username }
  } catch {
    return null
  }
}

// GET /api/messages - 获取当前用户的消息列表
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const messages = await adapter.getMessagesByUser(user.userId)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error getting messages:', error)
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 })
  }
}

// PATCH /api/messages - 标记消息为已读
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, markAll } = body

    if (markAll) {
      await adapter.markAllMessagesAsRead(user.userId)
      return NextResponse.json({ message: '全部已标记为已读' })
    }

    if (!messageId) {
      return NextResponse.json({ error: '缺少消息ID' }, { status: 400 })
    }

    await adapter.markMessageAsRead(messageId)
    return NextResponse.json({ message: '已标记为已读' })
  } catch (error) {
    console.error('Error marking message as read:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// DELETE /api/messages - 删除消息
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('id')

    if (!messageId) {
      return NextResponse.json({ error: '缺少消息ID' }, { status: 400 })
    }

    await adapter.deleteMessage(parseInt(messageId))
    return NextResponse.json({ message: '消息已删除' })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
