import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter, MessageType } from '../../../lib/db-adapter'

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

// GET /api/tasks - 获取用户的打卡任务列表
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (taskId) {
      // 获取单个任务详情
      const task = await adapter.getTaskById(taskId)
      if (!task) {
        return NextResponse.json({ error: '任务不存在' }, { status: 404 })
      }

      // 获取任务成员
      const members = await adapter.getTaskMembers(taskId)
      const memberDetails = await Promise.all(
        members.map(async (m: any) => {
          const userInfo = await adapter.findUserById(m.userId)
          return {
            id: m.id,
            userId: m.userId,
            username: userInfo?.nickname || userInfo?.username || '未知用户',
            avatar: userInfo?.avatar || null,
            status: m.status,
            totalCount: m.totalCount || 0,
            joinedAt: m.joinedAt,
          }
        })
      )

      // 获取打卡记录
      const checkIns = await adapter.getTaskCheckIns(taskId)
      const checkInDetails = await Promise.all(
        checkIns.map(async (c: any) => {
          const userInfo = await adapter.findUserById(c.userId)
          let entryDetail: any = null
          if (c.entryType === 'weight') {
            const entries = await adapter.getWeightEntriesByUser(c.userId)
            entryDetail = entries.find((e: any) => String(e.id) === String(c.entryId)) || null
          } else {
            const entries = await adapter.getReadingEntriesByUser(c.userId)
            entryDetail = entries.find((e: any) => String(e.id) === String(c.entryId)) || null
          }
          return {
            id: c.id,
            userId: c.userId,
            username: userInfo?.nickname || userInfo?.username || '未知用户',
            avatar: userInfo?.avatar || null,
            entryType: c.entryType,
            checkedAt: c.checkedAt,
            detail: entryDetail,
          }
        })
      )

      // 检查当前用户是否是成员
      const currentMember = members.find((m: any) => String(m.userId) === String(user.userId))

      return NextResponse.json({
        task: {
          ...task,
          isCreator: String(task.creatorId) === String(user.userId),
          memberStatus: currentMember?.status || null,
        },
        members: memberDetails,
        checkIns: checkInDetails,
      })
    }

    // 获取用户的所有任务
    const tasks = await adapter.getTasksByUser(user.userId)
    
    // 更新任务状态（自动开始已到时间的任务）
    const now = new Date()
    for (const task of tasks) {
      if (task.status === 'pending' && new Date(task.startDate) <= now) {
        await adapter.updateTask(task.id!, { status: 'active' })
        task.status = 'active'
      }
    }

    // 获取每个任务的成员数
    const tasksWithMemberCount = await Promise.all(
      tasks.map(async (t) => {
        const members = await adapter.getTaskMembers(t.id!)
        const joinedCount = members.filter((m: any) => m.status === 'joined').length
        const isCreator = String(t.creatorId) === String(user.userId)
        const myMember = members.find((m: any) => String(m.userId) === String(user.userId))
        return {
          ...t,
          memberCount: joinedCount,
          isCreator,
          myStatus: myMember?.status || null,
        }
      })
    )

    return NextResponse.json({ tasks: tasksWithMemberCount })
  } catch (error) {
    console.error('Error getting tasks:', error)
    return NextResponse.json({ error: '获取任务列表失败' }, { status: 500 })
  }
}

// POST /api/tasks - 创建新任务
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, type, startDate, endDate, invitees } = body

    // 验证输入
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: '请输入任务标题' }, { status: 400 })
    }

    if (!type || !['fitness', 'reading'].includes(type)) {
      return NextResponse.json({ error: '请选择有效的任务类型' }, { status: 400 })
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: '请设置开始和结束时间' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (end <= start) {
      return NextResponse.json({ error: '结束时间必须晚于开始时间' }, { status: 400 })
    }

    // 确定初始状态
    const initialStatus = start <= now ? 'active' : 'pending'

    // 创建任务
    const task = await adapter.createTask({
      title: title.trim(),
      description: description?.trim() || null,
      type,
      startDate: start,
      endDate: end,
      creatorId: user.userId,
    })

    // 添加创建者为成员
    await adapter.addTaskMember({
      taskId: task.id!,
      userId: user.userId,
    })
    await adapter.updateTaskMemberStatus(task.id!, user.userId, 'joined')

    // 邀请好友
    if (invitees && Array.isArray(invitees) && invitees.length > 0) {
      for (const friendId of invitees) {
        // 添加为任务成员
        await adapter.addTaskMember({
          taskId: task.id!,
          userId: friendId,
        })

        // 发送邀请消息
        await adapter.createMessage({
          type: MessageType.CHANNEL_INVITE,
          content: `${user.username} 邀请你参加打卡任务「${title}」`,
          senderId: user.userId,
          receiverId: friendId,
        })
      }
    }

    return NextResponse.json({
      message: '任务创建成功',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        startDate: task.startDate,
        endDate: task.endDate,
        status: initialStatus,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: '创建任务失败' }, { status: 500 })
  }
}

// PATCH /api/tasks - 更新任务（加入/退出/提前结束）
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, action, entryId, entryType } = body

    if (!taskId || !action) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const task = await adapter.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    if (action === 'join') {
      // 接受邀请加入任务
      const member = await adapter.getTaskMember(taskId, user.userId)
      if (!member) {
        return NextResponse.json({ error: '你未被邀请参加此任务' }, { status: 403 })
      }
      if (member.status !== 'invited') {
        return NextResponse.json({ error: '你已经处理过此邀请' }, { status: 400 })
      }
      await adapter.updateTaskMemberStatus(taskId, user.userId, 'joined')
      return NextResponse.json({ message: '已成功加入任务' })
    }

    if (action === 'decline') {
      // 拒绝邀请
      const member = await adapter.getTaskMember(taskId, user.userId)
      if (!member || member.status !== 'invited') {
        return NextResponse.json({ error: '无效的邀请' }, { status: 400 })
      }
      await adapter.updateTaskMemberStatus(taskId, user.userId, 'declined')
      return NextResponse.json({ message: '已拒绝邀请' })
    }

    if (action === 'leave') {
      // 退出任务
      const member = await adapter.getTaskMember(taskId, user.userId)
      if (!member || member.status !== 'joined') {
        return NextResponse.json({ error: '你不是此任务的成员' }, { status: 400 })
      }
      // 创建者不能退出，只能结束任务
      if (String(task.creatorId) === String(user.userId)) {
        return NextResponse.json({ error: '创建者不能退出，请使用结束任务' }, { status: 400 })
      }
      await adapter.updateTaskMemberStatus(taskId, user.userId, 'removed')
      return NextResponse.json({ message: '已退出任务' })
    }

    if (action === 'complete') {
      // 提前结束任务（仅创建者）
      if (String(task.creatorId) !== String(user.userId)) {
        return NextResponse.json({ error: '只有创建者可以提前结束任务' }, { status: 403 })
      }
      await adapter.updateTask(taskId, { status: 'completed' })
      return NextResponse.json({ message: '任务已结束' })
    }

    if (action === 'cancel') {
      // 取消任务（仅创建者，且任务未开始）
      if (String(task.creatorId) !== String(user.userId)) {
        return NextResponse.json({ error: '只有创建者可以取消任务' }, { status: 403 })
      }
      if (task.status !== 'pending') {
        return NextResponse.json({ error: '只能取消未开始的任务' }, { status: 400 })
      }
      await adapter.updateTask(taskId, { status: 'cancelled' })
      return NextResponse.json({ message: '任务已取消' })
    }

    if (action === 'checkin') {
      // 打卡
      if (!entryId || !entryType) {
        return NextResponse.json({ error: '缺少打卡记录信息' }, { status: 400 })
      }
      if (!['weight', 'reading'].includes(entryType)) {
        return NextResponse.json({ error: '无效的打卡类型' }, { status: 400 })
      }

      // 检查任务状态
      if (task.status !== 'active') {
        return NextResponse.json({ error: '任务未在进行中' }, { status: 400 })
      }

      // 检查是否是成员
      const member = await adapter.getTaskMember(taskId, user.userId)
      if (!member || member.status !== 'joined') {
        return NextResponse.json({ error: '你不是此任务的成员' }, { status: 403 })
      }

      // 检查记录是否已存在
      const existingCheckIns = await adapter.getUserTaskCheckIns(taskId, user.userId)
      const alreadyChecked = existingCheckIns.some((c: any) => 
        String(c.entryId) === String(entryId) && c.entryType === entryType
      )
      if (alreadyChecked) {
        return NextResponse.json({ error: '此记录已同步到任务' }, { status: 409 })
      }

      // 创建打卡记录
      const checkIn = await adapter.createTaskCheckIn({
        taskId,
        userId: user.userId,
        entryId,
        entryType,
      })

      // 发送消息通知其他成员
      const members = await adapter.getTaskMembers(taskId)
      const userInfo = await adapter.findUserById(user.userId)
      for (const m of members) {
        if (String(m.userId) !== String(user.userId) && m.status === 'joined') {
          await adapter.createMessage({
            type: MessageType.CHANNEL_CHECKIN,
            content: `${userInfo?.nickname || userInfo?.username || '有人'} 在任务「${task.title}」中完成打卡`,
            senderId: user.userId,
            receiverId: m.userId,
          })
        }
      }

      return NextResponse.json({
        message: '打卡成功',
        checkIn: {
          id: checkIn.id,
          entryType: checkIn.entryType,
          checkedAt: checkIn.checkedAt,
        }
      })
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// DELETE /api/tasks - 删除任务
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return NextResponse.json({ error: '缺少任务ID' }, { status: 400 })
    }

    const task = await adapter.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    // 只有创建者可以删除
    if (String(task.creatorId) !== String(user.userId)) {
      return NextResponse.json({ error: '只有创建者可以删除任务' }, { status: 403 })
    }

    await adapter.deleteTask(taskId)
    return NextResponse.json({ message: '任务已删除' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
