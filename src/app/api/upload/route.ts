import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cloudbaseApp } from '../../../lib/cloudbase'

// 验证 Token 获取用户ID
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

// POST /api/upload - 上传文件到 CloudBase 存储
export async function POST(request: NextRequest) {
  console.log('=== 上传请求 ===')

  try {
    // 从 query 获取 token
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || ''

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证 token
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效token' }, { status: 401 })
    }

    // 解析表单数据
    const formData = await request.formData()
    const fileField = formData.get('file') as File | null
    if (!fileField) {
      console.error('表单中没有 file 字段')
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    const filename = fileField.name || 'img.jpg'
    const arrayBuffer = await fileField.arrayBuffer()
    const fileData = Buffer.from(arrayBuffer)

    console.log('数据大小:', fileData.length, '用户:', user.userId)
    if (fileData.length === 0) {
      return NextResponse.json({ error: '空文件' }, { status: 400 })
    }

    // 生成文件名
    const ext = filename.split('.').pop() || 'jpg'
    const newName = `avatar_${user.userId}_${Date.now()}.${ext}`
    const cloudPath = `uploads/${newName}`

    try {
      // 使用 CloudBase 云存储上传
      const result = await cloudbaseApp.uploadFile({
        cloudPath: cloudPath,
        fileContent: fileData,
      })

      console.log('上传成功:', result)

      // 获取文件的临时访问链接
      let fileUrl = result.fileID
      if (result.fileID && result.fileID.startsWith('cloud://')) {
        // 需要转换为临时 URL
        try {
          const tempUrlResult = await cloudbaseApp.getTempFileURL({
            fileList: [result.fileID]
          })
          if (tempUrlResult.fileList && tempUrlResult.fileList[0] && tempUrlResult.fileList[0].tempFileURL) {
            fileUrl = tempUrlResult.fileList[0].tempFileURL
            console.log('获取临时URL成功:', fileUrl)
          }
        } catch (urlErr) {
          console.error('获取临时URL失败:', urlErr)
          // 使用备用 URL 格式
          fileUrl = `https://${process.env.CLOUDBASE_ENV_ID}.tcb.qcloud.la/${cloudPath}`
        }
      }

      return NextResponse.json({
        message: '成功',
        url: fileUrl,
        fileID: result.fileID
      })
    } catch (uploadErr: any) {
      console.error('上传失败:', uploadErr)
      
      // 如果云存储失败，返回 base64 数据（备用方案）
      const base64Data = fileData.toString('base64')
      const dataUrl = `data:image/${ext};base64,${base64Data}`
      
      console.log('使用 base64 备用方案')
      return NextResponse.json({
        message: '成功（base64）',
        url: dataUrl,
        warning: '云存储上传失败，使用 base64 编码'
      })
    }
  } catch (err: any) {
    console.error('错误:', err)
    return NextResponse.json({
      error: '失败: ' + err.message
    }, { status: 500 })
  }
}
