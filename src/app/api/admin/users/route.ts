import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import { adapter } from '../../../../lib/db-adapter'

// GET /api/admin/users - 获取所有用户信息（管理员专用）
export async function GET() {
  try {
    // 这里应该添加管理员权限验证
    // 暂时直接返回所有用户（生产环境需要添加认证中间件）
    
    const users = await adapter.getAllUsers()
    
    // 移除密码字段，只返回必要信息
    const safeUsers = users.map(user => ({
      id: user._id || user.id,
      username: user.username,
      role: user.role || 'user',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
    
    return NextResponse.json(safeUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
