import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../lib/db-adapter'

// GET /api/settings - 获取用户设置
export async function GET() {
  try {
    const settings = await adapter.getUserSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST /api/settings - 更新用户设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { height, targetWeight } = body

    if (!height || !targetWeight || isNaN(parseFloat(height)) || isNaN(parseFloat(targetWeight))) {
      return NextResponse.json({ error: 'Invalid values' }, { status: 400 })
    }

    const settings = await adapter.updateUserSettings({
      height: parseFloat(height),
      targetWeight: parseFloat(targetWeight),
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}