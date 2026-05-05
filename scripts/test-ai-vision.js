#!/usr/bin/env node
/**
 * 本地测试 AI API 是否支持图片识别（无需部署）
 * 
 * 用法:
 *   AI_API_KEY=your-key AI_MODEL=kimi-latest node scripts/test-ai-vision.js
 * 
 * 可选环境变量:
 *   AI_API_KEY    - API 密钥（必填）
 *   AI_API_URL    - API 地址，默认 https://api.moonshot.cn/v1/chat/completions
 *   AI_MODEL      - 模型名，默认 kimi-latest
 *   AI_TIMEOUT_MS - 超时毫秒，默认 30000
 */

const API_KEY = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY
const API_URL = process.env.AI_API_URL || 'https://api.moonshot.cn/v1/chat/completions'
const MODEL = process.env.AI_MODEL || 'kimi-latest'
const TIMEOUT = parseInt(process.env.AI_TIMEOUT_MS || '30000', 10)

if (!API_KEY) {
  console.error('❌ 请设置环境变量 AI_API_KEY')
  console.error('   示例: AI_API_KEY=sk-xxx node scripts/test-ai-vision.js')
  process.exit(1)
}

console.log(`\n🔧 配置信息:`)
console.log(`   API: ${API_URL}`)
console.log(`   模型: ${MODEL}`)
console.log(`   超时: ${TIMEOUT}ms\n`)

// 一个极小的 1x1 红色像素 PNG（base64）
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

async function testText() {
  console.log('📡 测试 1: 纯文本连通性（预期 1-3 秒返回）')
  const start = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const elapsed = Date.now() - start

    if (!res.ok) {
      const text = await res.text()
      console.log(`   ❌ 失败 (${elapsed}ms) HTTP ${res.status}: ${text.slice(0, 300)}\n`)
      return false
    }

    console.log(`   ✅ 成功 (${elapsed}ms)\n`)
    return true
  } catch (err) {
    clearTimeout(timeoutId)
    console.log(`   ❌ 异常 (${Date.now() - start}ms): ${err.name === 'AbortError' ? '超时' : err.message}\n`)
    return false
  }
}

async function testVision() {
  console.log('📡 测试 2: 图片识别（发送 1x1 像素测试图）')
  const start = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What color is this image?' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${TEST_IMAGE_BASE64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 100,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const elapsed = Date.now() - start

    if (!res.ok) {
      const text = await res.text()
      console.log(`   ❌ 失败 (${elapsed}ms) HTTP ${res.status}: ${text.slice(0, 500)}\n`)
      return false
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '(无内容)'
    console.log(`   ✅ 成功 (${elapsed}ms)`)
    console.log(`   💬 AI 回复: ${content.trim()}\n`)
    return true
  } catch (err) {
    clearTimeout(timeoutId)
    console.log(`   ❌ 异常 (${Date.now() - start}ms): ${err.name === 'AbortError' ? '超时' : err.message}\n`)
    return false
  }
}

async function main() {
  const textOk = await testText()
  if (!textOk) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('结论: API Key 或模型配置有误，纯文本都无法连通。')
    console.log('请检查 AI_API_KEY、AI_MODEL、AI_API_URL 是否正确。')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    process.exit(1)
  }

  const visionOk = await testVision()

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (visionOk) {
    console.log('结论: ✅ 该模型支持图片识别，且响应正常。')
    console.log('小程序超时问题可能出在：')
    console.log('  1. 实际食物图片太大，base64 编码后传输慢')
    console.log('  2. 微信小程序网络层超时（建议后端改异步轮询）')
    console.log('  3. CloudRun 容器有其他限制')
  } else {
    console.log('结论: ❌ 该模型不支持图片识别（vision）。')
    console.log('解决方案:')
    console.log('  • 换用支持 vision 的模型，如 kimi-latest、kimi-k1、kimi-k1.5')
    console.log('  • 或者改用文本描述输入（让用户打字描述食物）')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main().catch(console.error)
