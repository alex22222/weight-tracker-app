import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../lib/db-adapter'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// 验证 Token 获取用户信息
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

// 获取用户ID（优先从Token，其次从参数）
async function getUserId(request: NextRequest): Promise<string | null> {
  // 1. 尝试从 Token 获取
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    const user = verifyToken(token)
    if (user) return user.userId
  }
  
  // 2. 尝试从 Query 参数获取（GET/DELETE）
  const { searchParams } = new URL(request.url)
  const userIdFromQuery = searchParams.get('userId')
  if (userIdFromQuery) return userIdFromQuery
  
  // 3. 尝试从 Body 获取（POST）
  try {
    const body = await request.json()
    if (body.userId) return body.userId
  } catch {
    // 解析 Body 失败，忽略
  }
  
  return null
}

// GET /api/weight?userId={userId} - 获取用户的体重记录
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const entries = await adapter.getWeightEntriesByUser(userId)
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching weight entries:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

// POST /api/weight - 添加体重记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weight, note, date, userId: userIdFromBody } = body

    // 获取 userId（优先从 Token，其次从 Body）
    let userId: string | null = null
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      const user = verifyToken(token)
      if (user) userId = user.userId
    }
    
    // 如果 Token 中没有，使用 Body 中的 userId
    if (!userId && userIdFromBody) {
      userId = userIdFromBody
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!weight || isNaN(parseFloat(weight))) {
      return NextResponse.json({ error: 'Invalid weight value' }, { status: 400 })
    }

    const entry = await adapter.createWeightEntry({
      weight: parseFloat(weight),
      note: note || null,
      date: date ? new Date(date) : new Date(),
      userId: userId,
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error creating weight entry:', error)
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}

// DELETE /api/weight?id={id}&userId={userId} - 删除体重记录
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userIdFromQuery = searchParams.get('userId')

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // 获取 userId（优先从 Token，其次从 Query）
    let userId: string | null = null
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      const user = verifyToken(token)
      if (user) userId = user.userId
    }
    
    if (!userId && userIdFromQuery) {
      userId = userIdFromQuery
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 验证记录是否属于该用户
    const entry = await adapter.getWeightEntryById(id)

    if (!entry || entry.userId !== userId) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 })
    }

    await adapter.deleteWeightEntry(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting weight entry:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
