import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from "../../../../../lib/db-adapter"
import { getUserFromRequest } from "../../../../../lib/auth"

// 验证 Token


// GET /api/channels/[id]/comments - 获取频道评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    

    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const channelId = params.id
    const comments = await adapter.getChannelComments(channelId)

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error getting comments:', error)
    return NextResponse.json({ error: '获取评论失败' }, { status: 500 })
  }
}

// POST /api/channels/[id]/comments - 发表评论
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    

    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const channelId = params.id
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: '评论内容不能超过500字' }, { status: 400 })
    }

    const comment = await adapter.createChannelComment({
      channelId,
      userId: user.userId,
      content: content.trim(),
    })

    return NextResponse.json({ message: '评论成功', comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: '发表评论失败' }, { status: 500 })
  }
}

// DELETE /api/channels/[id]/comments?commentId=xxx - 删除评论
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    

    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ error: '缺少评论ID' }, { status: 400 })
    }

    await adapter.deleteChannelComment(commentId)

    return NextResponse.json({ message: '评论已删除' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: '删除评论失败' }, { status: 500 })
  }
}
