import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic'

// 使用 Open-Meteo 免费天气 API (无需 API Key)
// 默认使用北京坐标
const DEFAULT_LAT = 39.9042
const DEFAULT_LON = 116.4074

// 天气代码映射
const weatherCodes: Record<number, { label: string; icon: string }> = {
  0: { label: '晴', icon: '☀️' },
  1: { label: '多云', icon: '🌤️' },
  2: { label: '多云', icon: '⛅' },
  3: { label: '阴', icon: '☁️' },
  45: { label: '雾', icon: '🌫️' },
  48: { label: '雾凇', icon: '🌫️' },
  51: { label: '毛毛雨', icon: '🌦️' },
  53: { label: '小雨', icon: '🌦️' },
  55: { label: '中雨', icon: '🌧️' },
  61: { label: '小雨', icon: '🌧️' },
  63: { label: '中雨', icon: '🌧️' },
  65: { label: '大雨', icon: '🌧️' },
  71: { label: '小雪', icon: '🌨️' },
  73: { label: '中雪', icon: '🌨️' },
  75: { label: '大雪', icon: '🌨️' },
  80: { label: '阵雨', icon: '🌦️' },
  81: { label: '雷阵雨', icon: '⛈️' },
  82: { label: '暴雨', icon: '⛈️' },
  95: { label: '雷雨', icon: '⛈️' },
  96: { label: '雷暴', icon: '⛈️' },
  99: { label: '强雷暴', icon: '⛈️' },
}

// 获取天气信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat') || DEFAULT_LAT
    const lon = searchParams.get('lon') || DEFAULT_LON

    // Open-Meteo API
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`,
      { next: { revalidate: 300 } } // 缓存5分钟
    )

    if (!response.ok) {
      throw new Error('Failed to fetch weather')
    }

    const data = await response.json()
    const current = data.current
    const weatherCode = current.weather_code
    const weatherInfo = weatherCodes[weatherCode] || { label: '未知', icon: '❓' }

    return NextResponse.json({
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      weather: weatherInfo.label,
      icon: weatherInfo.icon,
      unit: data.current_units?.temperature_2m || '°C',
    })
  } catch (error) {
    console.error('Error fetching weather:', error)
    // 返回默认数据
    return NextResponse.json({
      temperature: 20,
      humidity: 50,
      weather: '晴',
      icon: '☀️',
      unit: '°C',
    })
  }
}
