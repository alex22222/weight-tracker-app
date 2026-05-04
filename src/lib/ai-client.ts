/**
 * 通用 AI 视觉分析客户端（OpenAI 兼容格式）
 * 支持 DeepSeek / Kimi(Moonshot) / 硅基流动 等任意 OpenAI 兼容 API
 */

const API_KEY = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || ''
const API_URL = process.env.AI_API_URL || process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions'
const MODEL = process.env.AI_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro'
const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || process.env.DEEPSEEK_TIMEOUT_MS || '30000', 10)

export interface DietAnalysisResult {
  canCalculate: boolean
  calories?: number
  foodItems?: string[]
  analysis?: string
  reason?: string
}

const SYSTEM_PROMPT = `请识别图片中的食物，并估算总卡路里。请严格按以下 JSON 格式返回，不要包含任何 markdown 代码块或其他多余文字：
{
  "canCalculate": true,
  "foodItems": ["食物1 约xxx千卡", "食物2 约xxx千卡"],
  "totalCalories": 450,
  "analysis": "这顿饭以碳水化合物为主，建议搭配更多蛋白质..."
}
如果图片中没有食物、无法识别、图片模糊或不是食物图片，返回：
{
  "canCalculate": false,
  "reason": "无法计算：图片中未能识别出食物"
}`

export async function analyzeDietImage(base64Image: string): Promise<DietAnalysisResult> {
  if (!API_KEY) {
    console.error('[AI] API key not configured (AI_API_KEY or DEEPSEEK_API_KEY)')
    return { canCalculate: false, reason: 'AI 服务未配置' }
  }

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
          {
            role: 'user',
            content: [
              { type: 'text', text: SYSTEM_PROMPT },
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
        temperature: 0.3,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const text = await response.text()
      console.error('[AI] API error:', response.status, text)
      return { canCalculate: false, reason: `AI 服务异常 (${response.status}): ${text.slice(0, 200)}` }
    }

    const data = await response.json()
    const content: string = data.choices?.[0]?.message?.content || ''

    // 尝试从内容中提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[AI] No JSON found in response:', content)
      return { canCalculate: false, reason: '无法计算' }
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('[AI] JSON parse error:', e, 'content:', content)
      return { canCalculate: false, reason: '无法计算' }
    }

    if (!parsed.canCalculate) {
      return {
        canCalculate: false,
        reason: parsed.reason || '无法计算',
      }
    }

    return {
      canCalculate: true,
      calories: typeof parsed.totalCalories === 'number' ? parsed.totalCalories : undefined,
      foodItems: Array.isArray(parsed.foodItems) ? parsed.foodItems : [],
      analysis: typeof parsed.analysis === 'string' ? parsed.analysis : '',
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      console.error('[AI] Request timeout')
      return { canCalculate: false, reason: '请求超时，无法计算' }
    }
    console.error('[AI] Error:', error)
    return { canCalculate: false, reason: '无法计算' }
  }
}
