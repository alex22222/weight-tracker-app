import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import { testCloudBaseConnection, cloudbaseInitError } from '../../../lib/cloudbase'
import { adapter, CURRENT_DB } from '../../../lib/db-adapter'

export const dynamic = 'force-dynamic'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: CURRENT_DB,
    cloudbase: {
      initialized: !cloudbaseInitError,
      initError: cloudbaseInitError?.message || null,
      connection: null as any
    },
    collections: {} as any
  }
  
  // 测试 CloudBase 连接
  const connTest = await testCloudBaseConnection()
  health.cloudbase.connection = connTest
  
  // 测试各集合访问
  try {
    const users = await adapter.getAllUsers()
    health.collections.users = { count: users.length, status: 'ok' }
  } catch (e: any) {
    health.collections.users = { status: 'error', error: e.message }
  }
  
  try {
    // 尝试获取一个体重记录来测试
    const testEntries = await adapter.getAllWeightEntries()
    health.collections.weight_entries = { count: testEntries.length, status: 'ok' }
  } catch (e: any) {
    health.collections.weight_entries = { status: 'error', error: e.message }
  }
  
  // 如果连接失败，返回 500
  if (!connTest.success) {
    health.status = 'error'
    return NextResponse.json(health, { status: 500 })
  }
  
  return NextResponse.json(health)
}
