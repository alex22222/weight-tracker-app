import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter, MessageType } from '../../../lib/db-adapter'
import { getUserFromRequest } from '../../../lib/auth'

// GET /api/tasks - 获取用户的打卡任务列表
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
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
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, type, startDate, endDate, memberUsernames } = body

    if (!title || !type || !startDate || !endDate) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 创建任务
    const task = await adapter.createTask({
      title: title.trim(),
      description: description?.trim() || '',
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      creatorId: user.userId,
    })

    if (!task.id) {
      return NextResponse.json({ error: '创建任务失败' }, { status: 500 })
    }

    // 添加创建者为成员
    await adapter.addTaskMember({
      taskId: task.id,
      userId: user.userId,
    })
    await adapter.updateTaskMemberStatus(task.id, user.userId, 'joined')

    // 邀请其他成员
    if (memberUsernames && Array.isArray(memberUsernames)) {
      for (const username of memberUsernames) {
        const targetUser = await adapter.findUserByUsername(username)
        if (targetUser && targetUser.id) {
          await adapter.addTaskMember({
            taskId: task.id,
            userId: targetUser.id,
          })
          // 发送邀请消息
          await adapter.createMessage({
            type: MessageType.SYSTEM_MESSAGE,
            content: `${user.username} 邀请你参加打卡任务「${title}」`,
            senderId: user.userId,
            receiverId: targetUser.id,
          })
        }
      }
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: '创建任务失败' }, { status: 500 })
  }
}

// PATCH /api/tasks - 更新任务或接受/拒绝邀请
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, action, checkInData } = body

    if (!taskId) {
      return NextResponse.json({ error: '缺少任务ID' }, { status: 400 })
    }

    const task = await adapter.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    // 处理接受/拒绝邀请
    if (action === 'accept') {
      await adapter.updateTaskMemberStatus(taskId, user.userId, 'joined')
      return NextResponse.json({ message: '已接受邀请' })
    }

    if (action === 'decline') {
      await adapter.updateTaskMemberStatus(taskId, user.userId, 'declined')
      return NextResponse.json({ message: '已拒绝邀请' })
    }

    // 处理打卡
    if (action === 'checkin' && checkInData) {
      // 验证成员身份
      const members = await adapter.getTaskMembers(taskId)
      const myMember = members.find((m: any) => String(m.userId) === String(user.userId))
      
      if (!myMember || myMember.status !== 'joined') {
        return NextResponse.json({ error: '不是任务成员，无法打卡' }, { status: 403 })
      }

      // 创建体重或读书记录
      let entryId: string
      if (checkInData.type === 'weight') {
        const entry = await adapter.createWeightEntry({
          weight: parseFloat(checkInData.weight),
          note: checkInData.note || '',
          date: new Date(),
          userId: user.userId,
        })
        entryId = String(entry.id!)
      } else {
        const entry = await adapter.createReadingEntry({
          bookName: checkInData.bookName,
          pages: parseInt(checkInData.pages),
          note: checkInData.note || '',
          date: new Date(),
          userId: user.userId,
        })
        entryId = String(entry.id!)
      }

      // 创建打卡记录
      await adapter.createTaskCheckIn({
        taskId,
        userId: user.userId,
        entryId,
        entryType: checkInData.type,
      })

      // 更新成员打卡次数
      await adapter.incrementTaskMemberCount(taskId, user.userId)

      return NextResponse.json({ message: '打卡成功' })
    }

    // 更新任务信息（仅限创建者）
    if (String(task.creatorId) !== String(user.userId)) {
      return NextResponse.json({ error: '无权修改此任务' }, { status: 403 })
    }

    const updateData: any = {}
    if (body.title) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || ''
    if (body.startDate) updateData.startDate = new Date(body.startDate)
    if (body.endDate) updateData.endDate = new Date(body.endDate)
    if (body.status) updateData.status = body.status

    await adapter.updateTask(taskId, updateData)

    return NextResponse.json({ message: '更新成功' })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: '更新任务失败' }, { status: 500 })
  }
}

// DELETE /api/tasks?id={id} - 删除任务
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少任务ID' }, { status: 400 })
    }

    const task = await adapter.getTaskById(id)
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    // 只有创建者可以删除
    if (String(task.creatorId) !== String(user.userId)) {
      return NextResponse.json({ error: '无权删除此任务' }, { status: 403 })
    }

    await adapter.deleteTask(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: '删除任务失败' }, { status: 500 })
  }
}
