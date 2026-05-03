import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'
import { testCloudBaseConnection } from '../../../lib/cloudbase'
import { getUserFromRequest, validators } from '../../../lib/auth'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GET /api/weight - 获取用户的体重记录
export async function GET(request: NextRequest) {
  console.log('[API /weight] GET request received')
  
  try {
    // 只能从 Token 获取 userId，不允许从 query 获取
    const user = getUserFromRequest(request)
    console.log('[API /weight] User:', user?.userId)
    
    if (!user) {
      console.log('[API /weight] No valid token')
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 测试 CloudBase 连接
    const connTest = await testCloudBaseConnection()
    console.log('[API /weight] CloudBase connection:', connTest)
    
    if (!connTest.success) {
      console.error('[API /weight] CloudBase not connected:', connTest.error)
      return NextResponse.json({ 
        error: '数据库连接失败', 
        details: connTest.error,
        entries: [] 
      }, { status: 500 })
    }

    console.log('[API /weight] Fetching entries for user:', user.userId)
    const entries = await adapter.getWeightEntriesByUser(user.userId)
    console.log('[API /weight] Entries fetched:', entries.length)
    
    return NextResponse.json({ entries })
  } catch (error: any) {
    console.error('[API /weight] Error:', error)
    return NextResponse.json({ 
      error: '获取记录失败',
      entries: []
    }, { status: 500 })
  }
}

// POST /api/weight - 添加或更新体重记录（同一天覆盖）
export async function POST(request: NextRequest) {
  console.log('[API /weight] POST request received')
  
  try {
    // 验证用户身份
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { weight, note, date, imageUrl } = body

    // 验证体重
    const weightValidation = validators.weight(weight)
    if (!weightValidation.valid) {
      return NextResponse.json({ error: weightValidation.message }, { status: 400 })
    }

    // 验证日期
    const dateValidation = validators.date(date || new Date().toISOString())
    if (!dateValidation.valid) {
      return NextResponse.json({ error: dateValidation.message }, { status: 400 })
    }

    const entryDate = dateValidation.value!
    const dateStr = entryDate.toISOString().split('T')[0] // YYYY-MM-DD
    
    // 清理备注（防 XSS）
    const sanitizedNote = validators.sanitizeString(note || '', 500)
    
    console.log('[API /weight] Processing entry for user:', user.userId, 'date:', dateStr, 'weight:', weightValidation.value)
    
    // 检查是否已有同一天的记录
    const existingEntries = await adapter.getWeightEntriesByUser(user.userId)
    const existingEntry = existingEntries.find(e => {
      const entryDateStr = new Date(e.date).toISOString().split('T')[0]
      return entryDateStr === dateStr
    })
    
    let entry
    if (existingEntry && existingEntry.id) {
      // 验证记录所有权
      if (String(existingEntry.userId) !== String(user.userId)) {
        return NextResponse.json({ error: '无权修改此记录' }, { status: 403 })
      }
      
      // 更新已有记录
      console.log('[API /weight] Updating existing entry:', existingEntry.id)
      entry = await adapter.updateWeightEntry(existingEntry.id, {
        weight: weightValidation.value!,
        note: sanitizedNote || undefined,
        imageUrl: imageUrl || undefined,
        date: entryDate,
      })
      console.log('[API /weight] Entry updated:', entry)
    } else {
      // 创建新记录
      entry = await adapter.createWeightEntry({
        weight: weightValidation.value!,
        note: sanitizedNote || undefined,
        imageUrl: imageUrl || undefined,
        date: entryDate,
        userId: user.userId,
      })
      console.log('[API /weight] Entry created:', entry)
    }

    return NextResponse.json(entry)
  } catch (error: any) {
    console.error('[API /weight] POST Error:', error)
    return NextResponse.json({ error: '保存记录失败' }, { status: 500 })
  }
}

// DELETE /api/weight?id={id} - 删除体重记录
export async function DELETE(request: NextRequest) {
  console.log('[API /weight] DELETE request received')
  
  try {
    // 验证用户身份
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '无效的记录ID' }, { status: 400 })
    }

    // 验证记录是否属于该用户
    const entry = await adapter.getWeightEntryById(id)

    if (!entry) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }

    if (String(entry.userId) !== String(user.userId)) {
      return NextResponse.json({ error: '无权删除此记录' }, { status: 403 })
    }

    await adapter.deleteWeightEntry(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API /weight] DELETE Error:', error)
    return NextResponse.json({ error: '删除记录失败' }, { status: 500 })
  }
}
