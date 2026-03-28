import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../lib/db-adapter'

// 验证 Token
function getUserFromToken(request: NextRequest): { userId: string; username: string } | null {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return null
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, userId] = decoded.split(':')
    if (!username || !userId) return null
    return { userId, username }
  } catch {
    return null
  }
}

// GET /api/messages - 获取当前用户的消息列表
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
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
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, markAll } = body

    if (markAll) {
      // 标记当前用户的所有消息为已读
      await adapter.markAllMessagesAsRead(user.userId)
      return NextResponse.json({ message: '全部已标记为已读' })
    }

    if (!messageId || isNaN(parseInt(messageId))) {
      return NextResponse.json({ error: '无效的消息ID' }, { status: 400 })
    }

    // 验证消息是否属于当前用户
    const messages = await adapter.getMessagesByUser(user.userId)
    const message = messages.find((m: any) => 
      (m.id || m._id)?.toString() === messageId.toString()
    )
    
    if (!message) {
      return NextResponse.json({ error: '消息不存在或无权限' }, { status: 404 })
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
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('id')

    if (!messageId || isNaN(parseInt(messageId))) {
      return NextResponse.json({ error: '无效的消息ID' }, { status: 400 })
    }

    // 验证消息是否属于当前用户
    const messages = await adapter.getMessagesByUser(user.userId)
    const message = messages.find((m: any) => 
      (m.id || m._id)?.toString() === messageId.toString()
    )
    
    if (!message) {
      return NextResponse.json({ error: '消息不存在或无权限删除' }, { status: 404 })
    }

    await adapter.deleteMessage(parseInt(messageId))
    return NextResponse.json({ message: '消息已删除' })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
