import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db, cloudbaseApp, cloudbaseInitError } from '../../../lib/cloudbase'
import { COLLECTIONS } from '../../../lib/db-adapter'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const debug = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      CLOUDBASE_ENV_ID: process.env.CLOUDBASE_ENV_ID,
      HAS_TCB_SECRET: !!process.env.TCB_SECRET_ID,
      HAS_TENCENT_SECRET: !!process.env.TENCENT_SECRET_ID,
      HAS_TENCENTCLOUD_SECRET: !!process.env.TENCENTCLOUD_SECRETID,
      TENCENT_SECRET_ID_PREFIX: process.env.TENCENT_SECRET_ID ? process.env.TENCENT_SECRET_ID.substring(0, 10) + '...' : null,
      AI_API_KEY_CONFIGURED: !!(process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY),
      AI_API_KEY_PREFIX: (process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY) ? (process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || '').substring(0, 8) + '...' : null,
      AI_MODEL: process.env.AI_MODEL || process.env.DEEPSEEK_MODEL || 'default(deepseek-v4-pro)',
      AI_API_URL: process.env.AI_API_URL || process.env.DEEPSEEK_API_URL || 'default(https://api.deepseek.com/chat/completions)',
    },
    cloudbase: {
      initialized: !!cloudbaseApp,
      hasDatabase: !!db,
      initError: cloudbaseInitError?.message || null,
      appConfig: cloudbaseApp?.config ? {
        envName: cloudbaseApp.config.envName,
        hasSecretId: !!cloudbaseApp.config.secretId,
        hasSecretKey: !!cloudbaseApp.config.secretKey,
        hasSessionToken: !!cloudbaseApp.config.sessionToken,
        secretIdPrefix: cloudbaseApp.config.secretId ? cloudbaseApp.config.secretId.substring(0, 10) + '...' : null,
      } : null,
    },
    collections: {} as any,
    tests: {} as any
  }

  // 测试数据库连接
  try {
    if (db && db.collection) {
      // 测试 users 集合
      try {
        const usersResult = await db.collection(COLLECTIONS.USERS).limit(1).get()
        debug.tests.users = {
          success: true,
          dataType: typeof usersResult,
          hasData: !!usersResult.data,
          dataLength: usersResult.data?.length || 0
        }
        debug.collections.users = usersResult.data?.length || 0
      } catch (e: any) {
        debug.tests.users = { success: false, error: e.message }
      }

      // 测试 weight_entries 集合
      try {
        const weightResult = await db.collection(COLLECTIONS.WEIGHT_ENTRIES).limit(1).get()
        debug.tests.weight_entries = {
          success: true,
          dataType: typeof weightResult,
          hasData: !!weightResult.data,
          dataLength: weightResult.data?.length || 0
        }
        debug.collections.weight_entries = weightResult.data?.length || 0
      } catch (e: any) {
        debug.tests.weight_entries = { success: false, error: e.message }
      }
    } else {
      debug.tests.database = { success: false, error: 'Database not initialized' }
    }
  } catch (e: any) {
    debug.tests.overall = { success: false, error: e.message }
  }

  return NextResponse.json(debug)
}
