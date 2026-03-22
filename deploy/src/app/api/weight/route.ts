import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { prisma } from '../../../lib/db'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GET /api/weight?userId={userId} - 获取用户的体重记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const entries = await prisma.weightEntry.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { date: 'desc' },
    })
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
    const { weight, note, date, userId } = body

    if (!weight || isNaN(parseFloat(weight))) {
      return NextResponse.json({ error: 'Invalid weight value' }, { status: 400 })
    }

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const entry = await prisma.weightEntry.create({
      data: {
        weight: parseFloat(weight),
        note: note || null,
        date: date ? new Date(date) : new Date(),
        userId: parseInt(userId),
      },
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
    const userId = searchParams.get('userId')

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 验证记录是否属于该用户
    const entry = await prisma.weightEntry.findFirst({
      where: { id: parseInt(id), userId: parseInt(userId) },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 })
    }

    await prisma.weightEntry.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting weight entry:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
