import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/settings - 获取用户设置
export async function GET() {
  try {
    let settings = await prisma.userSettings.findFirst()
    
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          height: 170,
          targetWeight: 65,
        },
      })
    }
    
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

    let settings = await prisma.userSettings.findFirst()
    
    if (settings) {
      settings = await prisma.userSettings.update({
        where: { id: settings.id },
        data: {
          height: parseFloat(height),
          targetWeight: parseFloat(targetWeight),
        },
      })
    } else {
      settings = await prisma.userSettings.create({
        data: {
          height: parseFloat(height),
          targetWeight: parseFloat(targetWeight),
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}