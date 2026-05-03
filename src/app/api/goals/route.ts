import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'
import { getUserFromRequest } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/goals - 获取用户的目标列表
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let goals
    if (status === 'active') {
      goals = await adapter.getActiveGoalsByUser(user.userId)
    } else {
      goals = await adapter.getGoalsByUser(user.userId)
    }

    return NextResponse.json({
      goals: goals.map(g => ({
        id: g.id,
        title: g.title,
        description: g.description,
        category: g.category,
        targetCount: g.targetCount,
        currentCount: g.currentCount || 0,
        unit: g.unit,
        frequency: g.frequency,
        startDate: g.startDate ? new Date(g.startDate).toISOString().split('T')[0] : null,
        endDate: g.endDate ? new Date(g.endDate).toISOString().split('T')[0] : null,
        status: g.status,
        createdAt: g.createdAt,
      }))
    })
  } catch (error) {
    console.error('Error getting goals:', error)
    return NextResponse.json({ error: '获取目标失败' }, { status: 500 })
  }
}

// POST /api/goals - 创建新目标
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, targetCount, unit, frequency, startDate, endDate } = body

    // 验证输入
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: '请输入目标标题' }, { status: 400 })
    }

    if (!category || !['fitness', 'reading', 'study', 'work', 'life', 'other'].includes(category)) {
      return NextResponse.json({ error: '请选择有效的分类' }, { status: 400 })
    }

    if (!targetCount || isNaN(parseInt(targetCount)) || parseInt(targetCount) <= 0) {
      return NextResponse.json({ error: '请输入有效的目标次数' }, { status: 400 })
    }

    if (!unit || typeof unit !== 'string') {
      return NextResponse.json({ error: '请输入单位' }, { status: 400 })
    }

    if (!frequency || !['daily', 'weekly', 'monthly', 'once'].includes(frequency)) {
      return NextResponse.json({ error: '请选择有效的频率' }, { status: 400 })
    }

    // 创建目标
    const goal = await adapter.createGoal({
      title: title.trim(),
      description: description?.trim() || null,
      category,
      targetCount: parseInt(targetCount),
      unit: unit.trim(),
      frequency,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      userId: user.userId,
    })

    return NextResponse.json({
      message: '目标创建成功',
      goal: {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        targetCount: goal.targetCount,
        currentCount: 0,
        unit: goal.unit,
        frequency: goal.frequency,
        startDate: goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : null,
        endDate: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : null,
        status: goal.status,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: '创建目标失败' }, { status: 500 })
  }
}

// PATCH /api/goals - 更新目标进度或状态
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, increment } = body

    if (!id) {
      return NextResponse.json({ error: '缺少目标ID' }, { status: 400 })
    }

    // 验证目标所有权
    const goal = await adapter.getGoalById(id)
    if (!goal) {
      return NextResponse.json({ error: '目标不存在' }, { status: 404 })
    }

    if (String(goal.userId) !== String(user.userId)) {
      return NextResponse.json({ error: '无权操作此目标' }, { status: 403 })
    }

    if (action === 'increment') {
      // 增加进度
      await adapter.incrementGoalProgress(id, increment || 1)
      const updatedGoal = await adapter.getGoalById(id)
      return NextResponse.json({
        message: '进度更新成功',
        goal: {
          id: updatedGoal?.id,
          currentCount: updatedGoal?.currentCount || 0,
          status: updatedGoal?.status,
        }
      })
    } else if (action === 'complete') {
      // 标记完成
      await adapter.updateGoal(id, { status: 'completed' })
      return NextResponse.json({ message: '目标已完成' })
    } else if (action === 'abandon') {
      // 放弃目标
      await adapter.updateGoal(id, { status: 'abandoned' })
      return NextResponse.json({ message: '目标已放弃' })
    } else {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: '更新目标失败' }, { status: 500 })
  }
}

// DELETE /api/goals - 删除目标
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少目标ID' }, { status: 400 })
    }

    // 验证目标所有权
    const goal = await adapter.getGoalById(id)
    if (!goal) {
      return NextResponse.json({ error: '目标不存在' }, { status: 404 })
    }

    if (String(goal.userId) !== String(user.userId)) {
      return NextResponse.json({ error: '无权删除此目标' }, { status: 403 })
    }

    await adapter.deleteGoal(id)
    return NextResponse.json({ message: '目标已删除' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: '删除目标失败' }, { status: 500 })
  }
}
