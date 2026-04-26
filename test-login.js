/**
 * 登录测试脚本
 * 模拟各种密码格式的登录场景
 */

const { createHash } = require('crypto')
const bcrypt = require('bcryptjs')

// 模拟用户数据
const testUsers = [
  { username: 'admin', password: '123123', storedHash: createHash('sha256').update('123123').digest('hex'), type: 'SHA256' },
  { username: 'user1', password: 'password123', storedHash: bcrypt.hashSync('password123', 10), type: 'bcrypt' },
  { username: 'user2', password: 'plaintext123', storedHash: 'plaintext123', type: 'plain' },
]

console.log('===== 登录测试 =====\n')

testUsers.forEach(user => {
  console.log(`\n测试用户: ${user.username} (${user.type})`)
  console.log(`输入密码: ${user.password}`)
  console.log(`存储密码: ${user.storedHash.substring(0, 30)}...`)
  
  // 模拟登录验证逻辑
  const storedPassword = user.storedHash
  const isBcryptHash = storedPassword.startsWith('$2')
  const isSha256Hash = /^[a-f0-9]{64}$/i.test(storedPassword)
  
  let isPasswordValid = false
  
  if (isBcryptHash) {
    isPasswordValid = bcrypt.compareSync(user.password, storedPassword)
    console.log(`验证方式: bcrypt`)
  } else if (isSha256Hash) {
    const hashedInput = createHash('sha256').update(user.password).digest('hex')
    isPasswordValid = hashedInput === storedPassword
    console.log(`验证方式: SHA256`)
  } else {
    isPasswordValid = user.password === storedPassword
    console.log(`验证方式: 明文`)
  }
  
  console.log(`验证结果: ${isPasswordValid ? '✅ 通过' : '❌ 失败'}`)
})

console.log('\n\n===== 诊断建议 =====')
console.log('1. 如果 admin 用户无法登录，可能是数据库中的密码不是 SHA256 格式')
console.log('2. 如果密码验证通过但返回 401，可能是 JWT_SECRET 不匹配')
console.log('3. 建议检查 CloudBase 数据库中 admin 用户的实际密码格式')
