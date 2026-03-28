import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, MessageType, FriendStatus } from '../../../lib/db-adapter'
import { verifyToken } from '../../../lib/auth'

// 验证 Token
function getUserFromToken(request: NextRequest): { userId: number; username: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/friends - 获取好友列表和待处理请求
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'pending') {
      // 获取待处理的好友请求
      const requests = await adapter.getPendingFriendRequests(user.userId)
      return NextResponse.json({ requests })
    }

    // 获取所有好友关系
    const friends = await adapter.getFriendsByUser(user.userId)
    return NextResponse.json({ friends })
  } catch (error) {
    console.error('Error getting friends:', error)
    return NextResponse.json({ error: '获取好友列表失败' }, { status: 500 })
  }
}

// POST /api/friends - 发送好友请求
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: '请输入用户名' }, { status: 400 })
    }
    
    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: '无效的用户名格式' }, { status: 400 })
    }

    // 不能添加自己为好友
    if (username.toLowerCase() === user.username.toLowerCase()) {
      return NextResponse.json({ error: '不能添加自己为好友' }, { status: 400 })
    }

    // 查找目标用户
    const targetUser = await adapter.findUserByUsername(username)
    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const targetUserId = (targetUser as any).id || (targetUser as any)._id

    // 检查是否已经是好友或已有待处理请求
    const existingRequest = await adapter.findFriendRequest(
      user.userId,
      targetUserId
    )
    
    if (existingRequest) {
      return NextResponse.json({ error: '已经发送过好友请求' }, { status: 409 })
    }

    // 创建好友请求
    const friendRequest = await adapter.createFriendRequest({
      userId: user.userId,
      friendId: targetUserId,
    })

    // 发送系统消息通知对方
    await adapter.createMessage({
      type: MessageType.FRIEND_REQUEST,
      content: `${user.username} 请求添加你为好友`,
      senderId: user.userId,
      receiverId: targetUserId,
    })

    return NextResponse.json({ message: '好友请求已发送' }, { status: 201 })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json({ error: '发送好友请求失败' }, { status: 500 })
  }
}

// PATCH /api/friends - 接受或拒绝好友请求
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { friendId, action } = body

    if (!friendId || !action) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }
    
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }

    // 查找好友请求
    const friendRequest = await adapter.findFriendById(friendId)
    if (!friendRequest) {
      return NextResponse.json({ error: '好友请求不存在' }, { status: 404 })
    }

    // 验证权限（只能处理发给自己的请求）
    const requestToUserId = (friendRequest as any).toUserId
    if (requestToUserId !== user.userId) {
      return NextResponse.json({ error: '无权操作此请求' }, { status: 403 })
    }

    const fromUserId = (friendRequest as any).fromUserId

    if (action === 'accept') {
      // 接受好友请求
      await adapter.updateFriendStatus(friendId, 'accepted')
      
      // 发送接受通知
      await adapter.createMessage({
        type: MessageType.FRIEND_ACCEPT,
        content: `${user.username} 已接受你的好友请求`,
        receiverId: fromUserId,
        senderId: user.userId,
      })
      
      return NextResponse.json({ message: '已接受好友请求' })
    } else {
      // 拒绝好友请求
      await adapter.updateFriendStatus(friendId, 'rejected')
      
      // 发送拒绝通知
      await adapter.createMessage({
        type: MessageType.FRIEND_REJECT,
        content: `${user.username} 拒绝了你的好友请求`,
        receiverId: fromUserId,
        senderId: user.userId,
      })
      
      return NextResponse.json({ message: '已拒绝好友请求' })
    }
  } catch (error) {
    console.error('Error handling friend request:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// DELETE /api/friends - 删除好友
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('id')

    if (!friendId || isNaN(parseInt(friendId))) {
      return NextResponse.json({ error: '无效的好友ID' }, { status: 400 })
    }

    // 查找好友关系
    const friendRequest = await adapter.findFriendById(parseInt(friendId))
    if (!friendRequest) {
      return NextResponse.json({ error: '好友关系不存在' }, { status: 404 })
    }

    // 验证权限（只能删除与自己相关的好友关系）
    const fromUserId = (friendRequest as any).fromUserId
    const toUserId = (friendRequest as any).toUserId
    
    if (fromUserId !== user.userId && toUserId !== user.userId) {
      return NextResponse.json({ error: '无权删除此好友' }, { status: 403 })
    }

    await adapter.deleteFriendById(friendId)
    return NextResponse.json({ message: '好友已删除' })
  } catch (error) {
    console.error('Error deleting friend:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
