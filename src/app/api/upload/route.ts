import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const config = {
  api: {
    // we handle multipart ourselves using formData, disable built‑in parser
    bodyParser: false
  }
}

export async function POST(request: NextRequest) {
  console.log('=== 上传请求 ===')

  try {
    // 从 query 获取 token
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || ''

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证 token (简单验证)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const parts = decoded.split(':')
      if (parts.length < 2) {
        return NextResponse.json({ error: '无效token' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: '无效token' }, { status: 401 })
    }

    // use the Web API to parse multipart form data rather than hacking it ourselves
    const formData = await request.formData()
    const fileField = formData.get('file') as File | null
    if (!fileField) {
      console.error('表单中没有 file 字段，所有字段：', Array.from(formData.keys()))
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    const filename = fileField.name || 'img.jpg'
    const arrayBuffer = await fileField.arrayBuffer()
    const fileData = Buffer.from(arrayBuffer)

    console.log('数据大小:', fileData.length)
    if (fileData.length === 0) {
      return NextResponse.json({ error: '空文件' }, { status: 400 })
    }

    // 保存到磁盘（注意 serverless 环境可能不允许写入，此时应改为云存储）
    const ext = filename.split('.').pop() || 'jpg'
    const newName = `img_${Date.now()}.${ext}`
    // 在不确定环境时，使用临时目录
    const baseDir = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads')
    const dir = baseDir

    try {
      if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    } catch (mkdirErr) {
      console.error('创建目录失败', mkdirErr)
      // 如果创建目录失败，可能没有写权限
    }

    try {
      await writeFile(join(dir, newName), fileData)
      console.log('已保存:', newName)
    } catch (writeErr) {
      console.error('写入文件失败', writeErr)
      // 在 serverless 平台不能写磁盘，返回明确错误
      return NextResponse.json({ error: '无法保存文件，请检查服务器配置' }, { status: 500 })
    }

    return NextResponse.json({
      message: '成功',
      url: `/uploads/${newName}`
    })
  } catch (err) {
    console.error('错误:', err)
    return NextResponse.json({
      error: '失败: ' + (err as Error).message
    }, { status: 500 })
  }
}
