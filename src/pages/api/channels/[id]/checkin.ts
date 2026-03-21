import { NextApiRequest, NextApiResponse } from 'next'
import { adapter } from '../../../../lib/db-adapter'

function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, userId] = decoded.split(':')
    if (!username || !userId) return null
    return { userId: parseInt(userId), username }
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })

  const user = verifyToken(token)
  if (!user) return res.status(401).json({ error: '无效token' })

  const channelId = parseInt(req.query.id as string)

  if (req.method === 'GET') {
    const checkIns = await adapter.getCheckInsByChannel(channelId)
    
    // 获取所有用户ID并查询用户信息
    const userIds = Array.from(new Set(checkIns.map(ci => ci.userId)))
    const users = await Promise.all(userIds.map(id => adapter.getUserById(id)))
    const userMap = new Map(users.filter(Boolean).map(u => [u!.id, u]))
    
    // 为每个打卡记录添加用户名
    const checkInsWithUser = checkIns.map(ci => ({
      ...ci,
      username: userMap.get(ci.userId)?.username || `用户${ci.userId}`,
    }))
    
    return res.status(200).json({ checkIns: checkInsWithUser })
  }

  if (req.method === 'POST') {
    const { checkDate, duration, note, imageUrl } = req.body

    if (!checkDate) {
      return res.status(400).json({ error: '请选择日期' })
    }

    // 验证日期格式 YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(checkDate)) {
      return res.status(400).json({ error: '日期格式错误' })
    }

    // 检查是否已打卡
    const existing = await adapter.getCheckInByDate(channelId, user.userId, checkDate)
    if (existing) {
      return res.status(409).json({ error: '该日期已打卡' })
    }

    // 创建打卡 - 使用 UTC 时间
    const [year, month, day] = checkDate.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

    const checkIn = await adapter.createCheckIn({
      channelId,
      userId: user.userId,
      checkDate: date,
      duration: duration || 30,
      note,
      imageUrl,
    })

    return res.status(201).json({ message: '打卡成功', checkIn })
  }

  return res.status(405).json({ error: '方法不允许' })
}
