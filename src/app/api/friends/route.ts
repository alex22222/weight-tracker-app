import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter, MessageType, FriendStatus } from '../../../lib/db-adapter'
import { getUserFromRequest } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/friends - 获取好友列表和待处理请求
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
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

    if (type === 'activity') {
      // 获取好友的最新打卡动态
      const activities = await adapter.getFriendsRecentActivity(user.userId)
      return NextResponse.json({ activities })
    }

    if (type === 'suggestions') {
      // 获取可能认识的用户（所有非admin用户，排除已经是好友的）
      const allUsers = await adapter.getAllUsers()
      const friends = await adapter.getFriendsByUser(user.userId)
      
      // 获取已是好友的用户ID列表（转为字符串比较）
      const friendIds = new Set(
        friends
          .map((f: any) => String(f.friendId || f.userId))
          .filter(Boolean)
      )
      
      // 当前用户ID转为字符串
      const currentUserId = String(user.userId)
      
      console.log('[Friends Suggestions] Current user:', currentUserId)
      console.log('[Friends Suggestions] Total users:', allUsers.length)
      console.log('[Friends Suggestions] Friend IDs:', Array.from(friendIds))
      
      // 过滤：排除admin、排除自己、排除已是好友的
      const suggestions = allUsers
        .filter((u: any) => u.username !== 'admin')                          // 排除admin
        .filter((u: any) => String(u.id) !== currentUserId)                  // 排除自己（强制字符串比较）
        .filter((u: any) => !friendIds.has(String(u.id)))                    // 排除已是好友的
        .map((u: any) => ({
          id: u.id,
          username: u.username,
          nickname: u.nickname || null,                                       // 保留原始nickname
          avatar: u.avatar || null,                                           // 头像URL
          displayName: u.nickname || u.username                               // 展示用名称（昵称优先）
        }))
      
      console.log('[Friends Suggestions] Filtered suggestions:', suggestions.length)
      
      return NextResponse.json({ suggestions })
    }

    // 获取所有好友关系，状态值转换为大写
    const friends = await adapter.getFriendsByUser(user.userId)
    const friendsWithUpperCaseStatus = friends.map((f: any) => ({
      ...f,
      status: f.status?.toUpperCase?.() || f.status
    }))
    return NextResponse.json({ friends: friendsWithUpperCaseStatus })
  } catch (error) {
    console.error('Error getting friends:', error)
    return NextResponse.json({ error: '获取好友列表失败' }, { status: 500 })
  }
}

// POST /api/friends - 发送好友请求
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
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
    
    if (!targetUserId) {
      return NextResponse.json({ error: '用户信息无效' }, { status: 400 })
    }

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
      friendRequestId: friendRequest.id,
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
    const user = getUserFromRequest(request)
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
    const requestToUserId = (friendRequest as any).friendId
    if (String(requestToUserId) !== String(user.userId)) {
      return NextResponse.json({ error: '无权操作此请求' }, { status: 403 })
    }

    const fromUserId = (friendRequest as any).userId

    if (action === 'accept') {
      // 接受好友请求
      await adapter.updateFriendStatus(friendId, 'accepted')
      
      // 发送接受通知
      await adapter.createMessage({
        type: MessageType.FRIEND_ACCEPT,
        content: `${user.username} 已接受你的好友请求`,
        senderId: user.userId,
        receiverId: fromUserId,
      })
      
      return NextResponse.json({ message: '已接受好友请求' })
    } else {
      // 拒绝好友请求
      await adapter.updateFriendStatus(friendId, 'rejected')
      
      // 发送拒绝通知
      await adapter.createMessage({
        type: MessageType.FRIEND_REJECT,
        content: `${user.username} 拒绝了你的好友请求`,
        senderId: user.userId,
        receiverId: fromUserId,
      })
      
      return NextResponse.json({ message: '已拒绝好友请求' })
    }
  } catch (error) {
    console.error('Error handling friend request:', error)
    return NextResponse.json({ error: '处理好友请求失败' }, { status: 500 })
  }
}

// DELETE /api/friends?id={id} - 删除好友
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('id')

    if (!friendId) {
      return NextResponse.json({ error: '缺少好友ID' }, { status: 400 })
    }

    await adapter.deleteFriend(friendId, user.userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting friend:', error)
    return NextResponse.json({ error: '删除好友失败' }, { status: 500 })
  }
}
