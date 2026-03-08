import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, MessageType, FriendStatus } from '../../../lib/db-adapter'

// 类型定义
type FriendStatusValue = typeof FriendStatus[keyof typeof FriendStatus]

// 验证 JWT token 的简单实现
function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, userId] = decoded.split(':')
    if (!username || !userId) return null
    return { userId: parseInt(userId), username }
  } catch {
    return null
  }
}

// GET /api/friends - 获取好友列表和待处理请求
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ error: '请输入用户名' }, { status: 400 })
    }

    // 不能添加自己为好友
    if (username === user.username) {
      return NextResponse.json({ error: '不能添加自己为好友' }, { status: 400 })
    }

    // 查找目标用户
    const targetUser = await adapter.findUserByUsername(username)
    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 检查是否已经是好友或已有待处理请求
    const existingRequest = await adapter.findFriendRequest(
      user.userId,
      (targetUser as unknown as { id: number }).id || (targetUser as unknown as { _id: string })._id as unknown as number
    )
    
    if (existingRequest) {
      return NextResponse.json({ error: '已经发送过好友请求' }, { status: 409 })
    }

    // 创建好友请求
    const friendRequest = await adapter.createFriendRequest(
      user.userId,
      (targetUser as unknown as { id: number }).id || (targetUser as unknown as { _id: string })._id as unknown as number
    )

    // 发送系统消息通知对方
    await adapter.createMessage({
      type: MessageType.FRIEND_REQUEST,
      title: '好友请求',
      content: `${user.username} 请求添加你为好友`,
      fromUserId: user.userId,
      toUserId: (targetUser as unknown as { id: number }).id || (targetUser as unknown as { _id: string })._id as unknown as number,
      relatedData: JSON.stringify({ friendId: (friendRequest as unknown as { id: number }).id || (friendRequest as unknown as { _id: string })._id }),
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const body = await request.json()
    const { friendId, action } = body

    if (!friendId || !action) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    // 查找好友请求
    const friendRequest = await adapter.findFriendById(friendId)
    if (!friendRequest) {
      return NextResponse.json({ error: '好友请求不存在' }, { status: 404 })
    }

    // 验证权限（只能处理发给自己的请求）
    const requestToUserId = (friendRequest as unknown as { toUserId: number }).toUserId || 
                           (friendRequest as unknown as { toUserId: string }).toUserId as unknown as number
    if (requestToUserId !== user.userId) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 })
    }

    if (action === 'accept') {
      // 接受好友请求
      await adapter.updateFriendStatus(friendId, FriendStatus.ACCEPTED)
      
      // 发送接受通知
      const fromUserId = (friendRequest as unknown as { fromUserId: number }).fromUserId || 
                        (friendRequest as unknown as { fromUserId: string }).fromUserId as unknown as number
      await adapter.createMessage({
        type: MessageType.FRIEND_ACCEPT,
        title: '好友请求已接受',
        content: `${user.username} 已接受你的好友请求`,
        toUserId: fromUserId,
        fromUserId: user.userId,
      })
      
      return NextResponse.json({ message: '已接受好友请求' })
    } else if (action === 'reject') {
      // 拒绝好友请求
      await adapter.updateFriendStatus(friendId, FriendStatus.REJECTED)
      
      // 发送拒绝通知
      const fromUserId = (friendRequest as unknown as { fromUserId: number }).fromUserId || 
                        (friendRequest as unknown as { fromUserId: string }).fromUserId as unknown as number
      await adapter.createMessage({
        type: MessageType.FRIEND_REJECT,
        title: '好友请求被拒绝',
        content: `${user.username} 拒绝了你的好友请求`,
        toUserId: fromUserId,
        fromUserId: user.userId,
      })
      
      return NextResponse.json({ message: '已拒绝好友请求' })
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 })
  } catch (error) {
    console.error('Error handling friend request:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// DELETE /api/friends - 删除好友
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
    const friendId = searchParams.get('id')

    if (!friendId) {
      return NextResponse.json({ error: '缺少好友ID' }, { status: 400 })
    }

    await adapter.deleteFriend(parseInt(friendId))
    return NextResponse.json({ message: '好友已删除' })
  } catch (error) {
    console.error('Error deleting friend:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
