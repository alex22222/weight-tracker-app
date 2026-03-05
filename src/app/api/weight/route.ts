import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, CURRENT_DB } from '../../../lib/db-adapter'

// GET /api/weight - 获取所有体重记录
export async function GET() {
  try {
    const entries = await adapter.getWeightEntries()
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
    const { weight, note, date } = body

    if (!weight || isNaN(parseFloat(weight))) {
      return NextResponse.json({ error: 'Invalid weight value' }, { status: 400 })
    }

    const entry = await adapter.createWeightEntry({
      weight: parseFloat(weight),
      note: note || null,
      date: date ? new Date(date) : new Date(),
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error creating weight entry:', error)
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}

// DELETE /api/weight?id={id} - 删除体重记录
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    await adapter.deleteWeightEntry(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting weight entry:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}