import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../lib/db-adapter'
import { testCloudBaseConnection } from '../../../lib/cloudbase'

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
  
  // 2. 尝试从 Query 参数获取
  const { searchParams } = new URL(request.url)
  const userIdFromQuery = searchParams.get('userId')
  if (userIdFromQuery) return userIdFromQuery
  
  return null
}

// GET /api/weight?userId={userId} - 获取用户的体重记录
export async function GET(request: NextRequest) {
  console.log('[API /weight] GET request received')
  
  try {
    const userId = await getUserId(request)
    console.log('[API /weight] User ID:', userId)
    
    if (!userId) {
      console.log('[API /weight] No user ID found')
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 测试 CloudBase 连接
    const connTest = await testCloudBaseConnection()
    console.log('[API /weight] CloudBase connection:', connTest)
    
    if (!connTest.success) {
      console.error('[API /weight] CloudBase not connected:', connTest.error)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: connTest.error,
        entries: [] 
      }, { status: 500 })
    }

    console.log('[API /weight] Fetching entries for user:', userId)
    const entries = await adapter.getWeightEntriesByUser(userId)
    console.log('[API /weight] Entries fetched:', entries.length)
    
    return NextResponse.json({ entries })
  } catch (error: any) {
    console.error('[API /weight] Error:', error.message || error)
    return NextResponse.json({ 
      error: 'Failed to fetch entries',
      details: error.message,
      entries: []
    }, { status: 500 })
  }
}

// POST /api/weight - 添加或更新体重记录（同一天覆盖）
export async function POST(request: NextRequest) {
  console.log('[API /weight] POST request received')
  
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

    const entryDate = date ? new Date(date) : new Date()
    const dateStr = entryDate.toISOString().split('T')[0] // YYYY-MM-DD
    
    console.log('[API /weight] Processing entry for user:', userId, 'date:', dateStr, 'weight:', weight)
    
    // 检查是否已有同一天的记录
    const existingEntries = await adapter.getWeightEntriesByUser(userId)
    const existingEntry = existingEntries.find(e => {
      const entryDateStr = new Date(e.date).toISOString().split('T')[0]
      return entryDateStr === dateStr
    })
    
    let entry
    if (existingEntry) {
      // 更新已有记录
      console.log('[API /weight] Updating existing entry:', existingEntry.id)
      entry = await adapter.updateWeightEntry(existingEntry.id, {
        weight: parseFloat(weight),
        note: note || null,
        date: entryDate,
      })
      console.log('[API /weight] Entry updated:', entry)
    } else {
      // 创建新记录
      entry = await adapter.createWeightEntry({
        weight: parseFloat(weight),
        note: note || null,
        date: entryDate,
        userId: userId,
      })
      console.log('[API /weight] Entry created:', entry)
    }

    return NextResponse.json(entry)
  } catch (error: any) {
    console.error('[API /weight] POST Error:', error.message || error)
    return NextResponse.json({ error: 'Failed to create entry', details: error.message }, { status: 500 })
  }
}

// DELETE /api/weight?id={id}&userId={userId} - 删除体重记录
export async function DELETE(request: NextRequest) {
  console.log('[API /weight] DELETE request received')
  
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
  } catch (error: any) {
    console.error('[API /weight] DELETE Error:', error.message || error)
    return NextResponse.json({ error: 'Failed to delete entry', details: error.message }, { status: 500 })
  }
}
