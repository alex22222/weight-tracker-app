import { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

export const config = {
  api: {
    bodyParser: false, // 禁用默认 body 解析，手动处理 multipart
  },
}

// 验证 token
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

// 简单的 multipart 解析
async function parseMultipart(req: NextApiRequest): Promise<{ fields: Record<string, string>; file?: { filename: string; data: Buffer; mimetype: string } }> {
  return new Promise((resolve, reject) => {
    let data = Buffer.alloc(0)
    req.on('data', chunk => {
      data = Buffer.concat([data, chunk])
    })
    req.on('end', () => {
      try {
        const contentType = req.headers['content-type'] || ''
        const boundary = contentType.split('boundary=')[1]
        if (!boundary) {
          resolve({ fields: {} })
          return
        }

        const parts = data.toString('binary').split(`--${boundary}`)
        const fields: Record<string, string> = {}
        let file: { filename: string; data: Buffer; mimetype: string } | undefined

        for (const part of parts) {
          if (part.includes('Content-Disposition')) {
            const nameMatch = part.match(/name="([^"]+)"/)
            const filenameMatch = part.match(/filename="([^"]+)"/)
            
            if (filenameMatch) {
              // 文件字段
              const filename = filenameMatch[1]
              const mimetypeMatch = part.match(/Content-Type:\s*([^\r\n]+)/)
              const mimetype = mimetypeMatch ? mimetypeMatch[1].trim() : 'application/octet-stream'
              
              // 提取文件数据（在空行之后）
              const dataStart = part.indexOf('\r\n\r\n') + 4
              const dataEnd = part.lastIndexOf('\r\n')
              const fileData = Buffer.from(part.substring(dataStart, dataEnd), 'binary')
              
              file = { filename, data: fileData, mimetype }
            } else if (nameMatch) {
              // 普通字段
              const name = nameMatch[1]
              const valueStart = part.indexOf('\r\n\r\n') + 4
              const valueEnd = part.lastIndexOf('\r\n')
              fields[name] = part.substring(valueStart, valueEnd)
            }
          }
        }

        resolve({ fields, file })
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' })
  }

  try {
    // 从 query 参数中获取 token
    const token = req.query.token as string
    if (!token) {
      return res.status(401).json({ error: '未登录' })
    }

    const user = verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: '无效token' })
    }

    // 解析 multipart
    const { file } = await parseMultipart(req)

    if (!file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: '不支持的文件类型: ' + file.mimetype })
    }

    // 限制文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.data.length > maxSize) {
      return res.status(400).json({ error: '文件大小超过限制' })
    }

    // 生成唯一文件名
    const ext = file.filename.split('.').pop() || 'jpg'
    const hash = crypto.randomBytes(16).toString('hex')
    const filename = `${hash}.${ext}`

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
      await fs.access(uploadDir)
    } catch {
      await fs.mkdir(uploadDir, { recursive: true })
    }

    // 保存文件
    const filepath = join(uploadDir, filename)
    await fs.writeFile(filepath, file.data)

    // 返回完整文件 URL
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = req.headers.host || 'localhost:54112'
    const url = `${protocol}://${host}/uploads/${filename}`

    return res.status(201).json({
      message: '上传成功',
      url,
      filename
    })

  } catch (error) {
    console.error('上传错误:', error)
    return res.status(500).json({ error: '上传失败' })
  }
}
