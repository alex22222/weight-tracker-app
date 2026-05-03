/**
 * 积分相关 API
 * GET  /api/points - 获取用户积分统计
 * GET  /api/points?type=logs - 获取积分记录
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { pointsService } from '../../../lib/points-service';
import { getUserFromRequest } from '../../../lib/auth';

export const dynamic = 'force-dynamic'

// GET /api/points - 获取用户积分统计
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // 获取积分记录
    if (type === 'logs') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      
      const { logs, total } = await pointsService.getUserPointsLogs(
        user.userId,
        { page, limit }
      );
      
      return NextResponse.json({ logs, total });
    }

    // 获取积分统计
    const summary = await pointsService.getUserPointsSummary(user.userId);
    return NextResponse.json(summary);
    
  } catch (error) {
    console.error('获取积分信息失败:', error);
    return NextResponse.json({ error: '获取积分信息失败' }, { status: 500 });
  }
}
