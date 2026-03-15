import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../lib/db-adapter'
import { verifyToken } from '../../../lib/auth'

// 获取当前用户ID
function getUserId(request: NextRequest): number | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const user = verifyToken(token)
  return user?.userId || null
}

// GET /api/weight - 获取当前用户的体重记录
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    // 只获取当前用户的记录
    const entries = await adapter.getWeightEntries(userId)
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching weight entries:', error)
    return NextResponse.json({ error: '获取记录失败' }, { status: 500 })
  }
}

// POST /api/weight - 添加体重记录（关联当前用户）
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { weight, note, date } = body

    // 验证输入
    if (!weight || isNaN(parseFloat(weight))) {
      return NextResponse.json({ error: '无效的体重值' }, { status: 400 })
    }
    
    const weightValue = parseFloat(weight)
    if (weightValue <= 0 || weightValue > 500) {
      return NextResponse.json({ error: '体重值应在 0-500 kg 之间' }, { status: 400 })
    }

    // 创建记录时关联用户ID
    const entry = await adapter.createWeightEntry({
      weight: weightValue,
      note: note?.substring(0, 200) || null, // 限制备注长度
      date: date ? new Date(date) : new Date(),
      userId,
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error creating weight entry:', error)
    return NextResponse.json({ error: '添加记录失败' }, { status: 500 })
  }
}

// DELETE /api/weight?id={id} - 删除体重记录（验证所有权）
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: '无效的记录ID' }, { status: 400 })
    }

    // 获取所有记录并找到要删除的
    const entries = await adapter.getWeightEntries(userId)
    const entryToDelete = entries.find((e: any) => 
      (e.id || e._id)?.toString() === id
    )

    if (!entryToDelete) {
      return NextResponse.json({ error: '记录不存在或无权限删除' }, { status: 404 })
    }

    await adapter.deleteWeightEntry(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting weight entry:', error)
    return NextResponse.json({ error: '删除记录失败' }, { status: 500 })
  }
}
