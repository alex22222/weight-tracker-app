import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cloudbaseApp } from '../../../lib/cloudbase'
import { verifyToken } from '../../../lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST /api/voice - 语音录音上传并识别体重
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || ''

    console.log('[Voice] === POST /api/voice ===')
    console.log('[Voice] hasToken:', !!token)

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      console.log('[Voice] invalid token')
      return NextResponse.json({ error: '无效token' }, { status: 401 })
    }
    console.log('[Voice] user:', user.userId)

    const formData = await request.formData()
    const fileField = formData.get('file') as File | null
    console.log('[Voice] hasFile:', !!fileField)

    if (!fileField) {
      return NextResponse.json({ error: '没有上传录音文件' }, { status: 400 })
    }

    console.log('[Voice] file:', fileField.name, 'type:', fileField.type, 'size:', fileField.size)

    const arrayBuffer = await fileField.arrayBuffer()
    const audioData = Buffer.from(arrayBuffer)

    console.log('[Voice] audioData length:', audioData.length)

    if (audioData.length === 0) {
      return NextResponse.json({ error: '空文件' }, { status: 400 })
    }

    // 上传录音到 CloudBase 存储
    const cloudPath = `voice/${user.userId}_${Date.now()}.mp3`
    console.log('[Voice] uploading to cloudbase:', cloudPath)
    const uploadResult = await cloudbaseApp.uploadFile({
      cloudPath,
      fileContent: audioData,
    })
    const fileID = uploadResult.fileID
    console.log('[Voice] uploadResult fileID:', fileID)

    // 获取临时 URL
    let audioUrl = fileID
    if (fileID?.startsWith('cloud://')) {
      const tempUrlResult = await cloudbaseApp.getTempFileURL({
        fileList: [fileID]
      })
      if (tempUrlResult.fileList?.[0]?.tempFileURL) {
        audioUrl = tempUrlResult.fileList[0].tempFileURL
        console.log('[Voice] tempFileURL obtained')
      } else {
        console.error('[Voice] getTempFileURL failed:', JSON.stringify(tempUrlResult))
        return NextResponse.json({ error: '获取音频访问链接失败' }, { status: 500 })
      }
    }

    console.log('[Voice] calling transcribeVoice, audioUrl length:', audioUrl?.length)

    // 调用腾讯云语音识别
    const text = await transcribeVoice(audioUrl)
    console.log('[Voice] transcribeVoice result:', text)

    if (!text) {
      console.log('[Voice] transcribeVoice returned null/empty')
      return NextResponse.json({ error: '语音识别失败，请重试' }, { status: 500 })
    }

    // 从识别结果提取体重数字
    const weight = extractWeight(text)
    console.log('[Voice] extracted weight:', weight, 'from text:', text)

    if (!weight) {
      return NextResponse.json({
        error: `未识别到体重数字（识别内容：${text}）`,
        text
      }, { status: 400 })
    }

    const cost = Date.now() - startTime
    console.log('[Voice] success, weight:', weight, 'cost:', cost + 'ms')

    return NextResponse.json({
      text,
      weight,
      fileID
    })
  } catch (error: any) {
    const cost = Date.now() - startTime
    console.error('[Voice] Error:', error.message, 'stack:', error.stack, 'cost:', cost + 'ms')
    return NextResponse.json(
      { error: error.message || '处理失败' },
      { status: 500 }
    )
  }
}

// 调用腾讯云语音识别
async function transcribeVoice(audioUrl: string): Promise<string | null> {
  console.log('[Voice] [ASR] initializing client...')
  console.log('[Voice] [ASR] CB_SECRET_ID exists:', !!process.env.CB_SECRET_ID)
  console.log('[Voice] [ASR] CB_SECRET_KEY exists:', !!process.env.CB_SECRET_KEY)

  const tencentCloud = require('tencentcloud-sdk-nodejs-asr')
  const AsrClient = tencentCloud.asr.v20190614.Client

  const client = new AsrClient({
    credential: {
      secretId: process.env.CB_SECRET_ID || '',
      secretKey: process.env.CB_SECRET_KEY || '',
    },
    region: 'ap-shanghai',
  })
  console.log('[Voice] [ASR] client created, region: ap-shanghai')

  const params = {
    EngineModelType: '16k_zh',
    ChannelNum: 1,
    ResTextFormat: 0,
    SourceType: 0,
    Url: audioUrl,
  }

  console.log('[Voice] [ASR] CreateRecTask params:', JSON.stringify({
    ...params,
    Url: audioUrl?.substring(0, 60) + '...'
  }))

  let result
  try {
    result = await client.CreateRecTask(params)
    console.log('[Voice] [ASR] CreateRecTask raw response:', JSON.stringify(result, null, 2))
  } catch (err: any) {
    console.error('[Voice] [ASR] CreateRecTask threw:', err.message, err.code)
    if (err.code) console.error('[Voice] [ASR] error code:', err.code)
    if (err.data) console.error('[Voice] [ASR] error data:', JSON.stringify(err.data))
    return null
  }

  const taskId = result?.Data?.TaskId
  console.log('[Voice] [ASR] TaskId:', taskId)

  if (!taskId) {
    console.error('[Voice] [ASR] No TaskId. Full response:', JSON.stringify(result, null, 2))
    if (result?.Response?.Error) {
      console.error('[Voice] [ASR] API Error:', JSON.stringify(result.Response.Error))
    }
    return null
  }

  // 轮询等待识别结果
  console.log('[Voice] [ASR] polling for results...')
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000))
    try {
      const res = await client.DescribeTaskStatus({ TaskId: taskId })
      const status = res?.Data?.Status
      console.log('[Voice] [ASR] poll', i + 1, 'status:', status)

      if (status === 2) {
        const resultText = res.Data?.Result || null
        console.log('[Voice] [ASR] success, result:', resultText)
        return resultText
      }
      if (status === 3) {
        console.error('[Voice] [ASR] task failed:', JSON.stringify(res?.Data))
        return null
      }
    } catch (pollErr: any) {
      console.error('[Voice] [ASR] poll error:', pollErr.message)
      continue
    }
  }
  console.error('[Voice] [ASR] poll timeout after 30s')
  return null
}

// 从语音文本提取体重数字
function extractWeight(text: string): number | null {
  const chineseNumMap: Record<string, string> = {
    '零': '0', '一': '1', '二': '2', '三': '3', '四': '4',
    '五': '5', '六': '6', '七': '7', '八': '8', '九': '9',
    '点': '.'
  }

  let normalized = text
  for (const [cn, ar] of Object.entries(chineseNumMap)) {
    normalized = normalized.replace(new RegExp(cn, 'g'), ar)
  }

  // 匹配 xxx 公斤 / xxx kg
  const kgMatch = normalized.match(/(\d+\.?\d*)\s*(公?斤|kg|KG)/)
  if (kgMatch) {
    const val = parseFloat(kgMatch[1])
    if (val >= 20 && val <= 300) return val
  }

  // 匹配 xxx 斤（除以2）
  const jinMatch = normalized.match(/(\d+\.?\d*)\s*斤/)
  if (jinMatch) {
    const val = parseFloat(jinMatch[1]) / 2
    if (val >= 20 && val <= 300) return val
  }

  // 提取所有数字，取第一个合理的
  const allNums = normalized.match(/\d+\.?\d*/g)
  if (allNums) {
    for (const n of allNums) {
      const val = parseFloat(n)
      if (val >= 20 && val <= 300) return val
    }
  }

  return null
}
