import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'

// 验证 Token
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

// GET /api/channels/ranking - 获取排行榜
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    // 获取所有频道
    const allChannels = await adapter.getFitnessChannels()
    
    // 收集所有成员
    const memberMap = new Map()
    
    for (const channel of allChannels) {
      if (channel.members && Array.isArray(channel.members)) {
        for (const member of channel.members) {
          const userId = String(member.userId)
          if (!memberMap.has(userId)) {
            memberMap.set(userId, {
              userId,
              nickname: member.username || '用户',
              avatar: '',
              total: 0,
              streak: 0
            })
          }
        }
      }
    }

    // 获取当前用户信息
    const currentUser = await adapter.getUserById(user.userId)
    if (currentUser && !memberMap.has(String(user.userId))) {
      memberMap.set(String(user.userId), {
        userId: String(user.userId),
        nickname: currentUser.nickname || currentUser.username || '我',
        avatar: currentUser.avatar || '',
        total: 0,
        streak: 0
      })
    }

    // 获取所有打卡记录并统计
    // 这里简化处理，获取所有用户的体重记录作为示例
    // 实际应该获取频道的打卡记录
    const allUsers = await adapter.getAllUsers()
    const ranking: Array<{
      userId: string
      nickname: string
      avatar: string
      total: number
      streak: number
    }> = []

    for (const u of allUsers.slice(0, 10)) {
      const userId = String(u.id)
      
      // 获取体重记录数作为总打卡数
      const weightEntries = await adapter.getWeightEntriesByUser(userId)
      
      // 计算连续打卡天数（简化计算）
      const streak = calculateStreak(weightEntries)
      
      ranking.push({
        userId,
        nickname: u.nickname || u.username || '用户',
        avatar: u.avatar || '',
        total: weightEntries.length,
        streak
      })
    }

    // 按总打卡数排序
    ranking.sort((a, b) => b.total - a.total)

    // 确保当前用户在列表中
    const currentUserIndex = ranking.findIndex(r => r.userId === String(user.userId))
    if (currentUserIndex === -1 && currentUser) {
      const weightEntries = await adapter.getWeightEntriesByUser(user.userId)
      ranking.push({
        userId: String(user.userId),
        nickname: currentUser.nickname || currentUser.username || '我',
        avatar: currentUser.avatar || '',
        total: weightEntries.length,
        streak: calculateStreak(weightEntries)
      })
      // 重新排序
      ranking.sort((a, b) => b.total - a.total)
    }

    return NextResponse.json({ ranking })
  } catch (error) {
    console.error('Error getting ranking:', error)
    return NextResponse.json({ error: '获取排行榜失败' }, { status: 500 })
  }
}

// 计算连续打卡天数
function calculateStreak(entries: any[]): number {
  if (entries.length === 0) return 0
  
  // 按日期去重并排序
  const dates = Array.from(new Set(entries.map((e: any) => new Date(e.date).toISOString().split('T')[0])) as Set<string>).sort().reverse()
  
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  // 检查今天或昨天是否有打卡
  if (dates[0] === today || dates[0] === yesterday) {
    streak = 1
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1])
      const currDate = new Date(dates[i])
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000)
      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }
  }
  
  return streak
}
