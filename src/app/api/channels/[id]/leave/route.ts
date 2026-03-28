import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../../../lib/db-adapter'

// 验证 Token
function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, userId] = decoded.split(':')
    if (!username || !userId) return null
    return { userId, username }
  } catch {
    return null
  }
}

// GET /api/channels/[id]/leave - 获取频道的请假申请列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const channelId = params.id
    const leaves = await adapter.getLeaveRequests(channelId)

    // 获取频道信息以检查权限
    const channel = await adapter.getFitnessChannelById(channelId)
    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    const isOwner = channel.creatorId === user.userId

    // 如果不是创建者，只能看到自己的请假申请
    const filteredLeaves = isOwner 
      ? leaves 
      : leaves.filter((l: any) => l.userId === user.userId)

    // 计算用户的请假天数统计
    const userLeaves = leaves.filter((l: any) => l.userId === user.userId && l.status === 'approved')
    const totalDays = userLeaves.reduce((sum: number, l: any) => {
      const start = new Date(l.startDate)
      const end = new Date(l.endDate)
      return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }, 0)

    return NextResponse.json({ 
      leaves: filteredLeaves,
      leaveStats: { totalDays, usedDays: totalDays },
      maxLeaveDays: 3,
      isOwner,
    })
  } catch (error) {
    console.error('Error getting leave requests:', error)
    return NextResponse.json({ error: '获取请假申请失败' }, { status: 500 })
  }
}

// POST /api/channels/[id]/leave - 提交请假申请
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const channelId = params.id
    const body = await request.json()
    const { startDate, endDate, reason } = body

    if (!startDate || !endDate) {
      return NextResponse.json({ error: '请选择请假日期' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      return NextResponse.json({ error: '结束日期不能早于开始日期' }, { status: 400 })
    }

    // 检查频道是否存在
    const channel = await adapter.getFitnessChannelById(channelId)
    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    // 检查是否允许请假
    const maxLeaveDays = 3

    // 计算申请请假天数
    const requestDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // 计算用户已请假天数
    const leaves = await adapter.getLeaveRequests(channelId)
    const userLeaves = leaves.filter((l: any) => l.userId === user.userId && l.status === 'approved')
    const totalDays = userLeaves.reduce((sum: number, l: any) => {
      const s = new Date(l.startDate)
      const e = new Date(l.endDate)
      return sum + Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }, 0)

    if (totalDays + requestDays > maxLeaveDays) {
      return NextResponse.json({ 
        error: `请假天数超限`,
        message: `您已请假 ${totalDays} 天，最多可请假 ${maxLeaveDays} 天，本次申请 ${requestDays} 天将超出限制。`,
      }, { status: 400 })
    }

    const leave = await adapter.createLeaveRequest({
      channelId,
      userId: user.userId,
      startDate: start,
      endDate: end,
      reason: reason?.trim(),
    })

    return NextResponse.json({ message: '请假申请已提交', leave }, { status: 201 })
  } catch (error) {
    console.error('Error creating leave request:', error)
    return NextResponse.json({ error: '提交请假申请失败' }, { status: 500 })
  }
}

// PATCH /api/channels/[id]/leave - 审批请假申请（仅创建者）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const channelId = params.id
    const body = await request.json()
    const { requestId, action } = body

    if (!requestId || !action) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    // 检查频道是否存在
    const channel = await adapter.getFitnessChannelById(channelId)
    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    // 检查权限（仅创建者可以审批）
    if (channel.creatorId !== user.userId) {
      return NextResponse.json({ error: '无权审批请假申请' }, { status: 403 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    await adapter.updateLeaveStatus(requestId, status)

    return NextResponse.json({ 
      message: action === 'approve' ? '已批准请假申请' : '已拒绝请假申请' 
    })
  } catch (error) {
    console.error('Error updating leave request:', error)
    return NextResponse.json({ error: '审批请假申请失败' }, { status: 500 })
  }
}
