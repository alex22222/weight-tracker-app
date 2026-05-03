import { NextResponse } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GET /api/reading/recommendations - 获取推荐书籍列表
export async function GET() {
  try {
    const books = await adapter.getBookRecommendations()
    return NextResponse.json({ books })
  } catch (error) {
    console.error('Error fetching book recommendations:', error)
    return NextResponse.json({ books: [] }, { status: 500 })
  }
}
