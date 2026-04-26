// 检查 CloudBase 数据库中的用户数据
const { db } = require('../src/lib/cloudbase')

async function checkUsers() {
  try {
    const { data } = await db.collection('users').limit(10).get()
    
    console.log('\n===== CloudBase 用户数据 =====')
    console.log(`找到 ${data.length} 个用户\n`)
    
    for (const user of data) {
      console.log(`用户名: ${user.username || 'N/A'}`)
      console.log(`密码: ${user.password ? user.password.substring(0, 30) + '...' : 'null'}`)
      console.log(`密码长度: ${user.password?.length || 0}`)
      console.log(`密码格式: ${user.password?.startsWith('$2') ? 'bcrypt' : (user.password ? '其他' : '空')}`)
      console.log(`OpenID: ${user.wechatOpenId ? '有' : '无'}`)
      console.log(`创建时间: ${user.createdAt}`)
      console.log('---')
    }
  } catch (error) {
    console.error('查询失败:', error.message)
    console.log('\n可能原因：')
    console.log('1. CloudBase 环境未配置')
    console.log('2. 数据库集合不存在')
    console.log('3. 权限不足')
  }
}

checkUsers()
