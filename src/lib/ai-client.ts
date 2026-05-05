/**
 * 通用 AI 视觉分析客户端（OpenAI 兼容格式）
 * 支持 DeepSeek / Kimi(Moonshot) / 硅基流动 等任意 OpenAI 兼容 API
 */

const API_KEY = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || ''
const API_URL = process.env.AI_API_URL || process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions'
const MODEL = process.env.AI_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro'
const TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || '1')
const TIMEOUT_MS = 120000 // 硬编码 120 秒，不受环境变量覆盖

export interface DietAnalysisResult {
  canCalculate: boolean
  calories?: number
  foodItems?: string[]
  analysis?: string
  reason?: string
  rawResponse?: string // 调试：记录 AI 原始回复
}

const SYSTEM_PROMPT = `你是一个专业的营养师。请识别图片中的食物，并估算总卡路里。

非常重要：你必须且只能返回一个 JSON 对象，不要包含任何 markdown 代码块标记（如 \`\`\`json），不要包含任何解释文字。

成功识别的格式：
{
  "canCalculate": true,
  "foodItems": ["食物1 约xxx千卡", "食物2 约xxx千卡"],
  "totalCalories": 450,
  "analysis": "这顿饭以碳水化合物为主，建议搭配更多蛋白质..."
}

无法识别的格式：
{
  "canCalculate": false,
  "reason": "无法计算：图片中未能识别出食物"
}`

export async function testAIConnection(): Promise<{ success: boolean; latencyMs: number; error?: string; model?: string }> {
  if (!API_KEY) {
    return { success: false, latencyMs: 0, error: 'API key not configured' }
  }

  const start = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        temperature: TEMPERATURE,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latencyMs = Date.now() - start

    if (!response.ok) {
      const text = await response.text()
      return { success: false, latencyMs, error: `HTTP ${response.status}: ${text.slice(0, 200)}`, model: MODEL }
    }

    return { success: true, latencyMs, model: MODEL }
  } catch (error: any) {
    clearTimeout(timeoutId)
    const latencyMs = Date.now() - start
    if (error.name === 'AbortError') {
      return { success: false, latencyMs, error: 'Connection timeout (15s)', model: MODEL }
    }
    return { success: false, latencyMs, error: error.message || String(error), model: MODEL }
  }
}

// 从 AI 回复中提取 JSON
function extractJSON(content: string): { json: any; raw: string } | null {
  // 策略 1: 尝试提取 markdown 代码块中的 JSON
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim())
      return { json: parsed, raw: content }
    } catch {
      // 代码块内容不是有效 JSON，继续尝试其他策略
    }
  }

  // 策略 2: 找第一个 { 和最后一个 } 之间的内容
  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = content.slice(firstBrace, lastBrace + 1)
    try {
      const parsed = JSON.parse(jsonStr)
      return { json: parsed, raw: content }
    } catch {
      // 不是有效 JSON
    }
  }

  // 策略 3: 尝试找所有可能的 JSON 对象
  const matches = content.match(/\{[\s\S]*?\}/g)
  if (matches) {
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match)
        if (parsed && typeof parsed === 'object') {
          return { json: parsed, raw: content }
        }
      } catch {
        // 继续尝试下一个
      }
    }
  }

  return null
}

export async function analyzeDietImage(base64Image: string): Promise<DietAnalysisResult> {
  if (!API_KEY) {
    console.error('[AI] API key not configured (AI_API_KEY or DEEPSEEK_API_KEY)')
    return { canCalculate: false, reason: 'AI 服务未配置' }
  }

  console.log(`[AI] Starting diet analysis, model=${MODEL}, timeout=${TIMEOUT_MS}ms, imageLength=${base64Image.length}`)
  const startTime = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: base64Image.startsWith('data:')
                    ? base64Image
                    : `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: TEMPERATURE,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const elapsed = Date.now() - startTime
    console.log(`[AI] Response received in ${elapsed}ms, status=${response.status}`)

    if (!response.ok) {
      const text = await response.text()
      console.error('[AI] API error:', response.status, text)
      return {
        canCalculate: false,
        reason: `AI 服务异常 (${response.status}): ${text.slice(0, 200)}`,
        rawResponse: text.slice(0, 500),
      }
    }

    const data = await response.json()
    const content: string = data.choices?.[0]?.message?.content || ''
    console.log('[AI] Raw content:', content.slice(0, 500))

    // 提取 JSON
    const extracted = extractJSON(content)
    if (!extracted) {
      console.error('[AI] No JSON found in response:', content)
      return {
        canCalculate: false,
        reason: 'AI 返回格式错误，无法解析',
        rawResponse: content.slice(0, 500),
      }
    }

    const parsed = extracted.json
    console.log('[AI] Parsed JSON:', JSON.stringify(parsed))

    if (!parsed.canCalculate) {
      return {
        canCalculate: false,
        reason: parsed.reason || '无法计算',
        rawResponse: content.slice(0, 500),
      }
    }

    return {
      canCalculate: true,
      calories: typeof parsed.totalCalories === 'number' ? parsed.totalCalories : undefined,
      foodItems: Array.isArray(parsed.foodItems) ? parsed.foodItems : [],
      analysis: typeof parsed.analysis === 'string' ? parsed.analysis : '',
      rawResponse: content.slice(0, 500),
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    const elapsed = Date.now() - startTime
    if (error.name === 'AbortError') {
      console.error(`[AI] Request aborted after ${elapsed}ms (timeout=${TIMEOUT_MS}ms)`)
      return { canCalculate: false, reason: `请求超时（${Math.round(elapsed / 1000)}秒），无法计算` }
    }
    console.error('[AI] Error:', error)
    return { canCalculate: false, reason: '无法计算' }
  }
}
