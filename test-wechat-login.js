/**
 * 微信登录功能测试脚本
 * 
 * 使用方法:
 * 1. 配置 .env 文件中的 WECHAT_APPID 和 WECHAT_SECRET
 * 2. 运行: node test-wechat-login.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 从环境变量读取配置
require('dotenv').config();

const WECHAT_APPID = process.env.WECHAT_APPID;
const WECHAT_SECRET = process.env.WECHAT_SECRET;
const API_BASE = process.env.API_BASE || 'http://localhost:3001';

console.log('========================================');
console.log('🧪 微信登录功能测试工具');
console.log('========================================\n');

// 检查配置
console.log('📋 配置检查:');
console.log(`   API 地址: ${API_BASE}`);
console.log(`   AppID: ${WECHAT_APPID ? (WECHAT_APPID.includes('your-') ? '❌ 是占位符' : '✅ 已配置') : '❌ 未配置'}`);
console.log(`   Secret: ${WECHAT_SECRET ? (WECHAT_SECRET.includes('your-') ? '❌ 是占位符' : '✅ 已配置') : '❌ 未配置'}`);
console.log();

if (!WECHAT_APPID || WECHAT_APPID.includes('your-')) {
  console.error('❌ 错误: 请在 .env 文件中配置 WECHAT_APPID');
  console.log('\n获取方式:');
  console.log('   1. 登录 https://mp.weixin.qq.com/');
  console.log('   2. 进入「开发」→「开发管理」→「开发设置」');
  console.log('   3. 复制 AppID 和 AppSecret\n');
  process.exit(1);
}

// 测试场景
async function runTests() {
  console.log('========================================');
  console.log('🧪 开始测试\n');

  // 测试 1: 检查 API 是否可访问
  console.log('测试 1: 检查后端服务...');
  try {
    const res = await fetch(`${API_BASE}/api/weight`, { method: 'GET' });
    if (res.status === 401 || res.status === 200) {
      console.log('   ✅ 后端服务正常运行\n');
    } else {
      console.log(`   ⚠️  后端返回状态: ${res.status}\n`);
    }
  } catch (err) {
    console.error('   ❌ 无法连接后端服务，请确保服务已启动:');
    console.error('      npm run dev\n');
    process.exit(1);
  }

  // 测试 2: 测试缺少 code 的情况
  console.log('测试 2: 测试缺少 code 参数...');
  try {
    const res = await fetch(`${API_BASE}/api/auth/wechat-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (res.status === 400 && data.error === '缺少登录凭证 code') {
      console.log('   ✅ 参数验证正常\n');
    } else {
      console.log(`   ⚠️  返回: ${JSON.stringify(data)}\n`);
    }
  } catch (err) {
    console.error('   ❌ 请求失败:', err.message, '\n');
  }

  // 测试 3: 测试无效 code 的情况
  console.log('测试 3: 测试无效 code...');
  try {
    const res = await fetch(`${API_BASE}/api/auth/wechat-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'invalid_code_12345' })
    });
    const data = await res.json();
    if (res.status === 400) {
      console.log('   ✅ 微信 API 拒绝无效 code (预期行为)');
      console.log(`   📄 错误信息: ${data.error || data.detail || '未知错误'}\n`);
    } else {
      console.log(`   ⚠️  意外返回: ${JSON.stringify(data)}\n`);
    }
  } catch (err) {
    console.error('   ❌ 请求失败:', err.message, '\n');
  }

  // 测试 4: 数据库检查
  console.log('测试 4: 检查数据库结构...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // 检查 User 表结构
    const result = await prisma.$queryRaw`
      SELECT name FROM pragma_table_info('User') WHERE name IN ('wechatOpenId', 'wechatUnionId', 'nickname')
    `;
    
    const fields = result.map(r => r.name);
    const requiredFields = ['wechatOpenId', 'nickname'];
    const missingFields = requiredFields.filter(f => !fields.includes(f));
    
    if (missingFields.length === 0) {
      console.log('   ✅ 数据库字段完整');
      console.log(`   📄 字段: ${fields.join(', ')}\n`);
    } else {
      console.log(`   ❌ 缺少字段: ${missingFields.join(', ')}`);
      console.log('   请运行: npx prisma migrate dev\n');
    }
    
    await prisma.$disconnect();
  } catch (err) {
    console.error('   ❌ 数据库检查失败:', err.message, '\n');
  }

  console.log('========================================');
  console.log('✅ 基础测试完成\n');
  
  console.log('📱 下一步: 真机测试');
  console.log('   1. 启动微信开发者工具');
  console.log('   2. 导入 weapp 目录');
  console.log('   3. 配置服务器域名');
  console.log('   4. 点击「微信一键登录」按钮\n');
  
  console.log('📝 常见问题:');
  console.log('   - 如果提示 "code 无效", 是正常的（需要用真机获取有效 code）');
  console.log('   - 确保服务器域名已添加到小程序白名单');
  console.log('   - 确保 .env 中的 AppID/Secret 正确\n');
}

// 交互式测试
function interactiveTest() {
  rl.question('是否输入真实微信 code 进行测试? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      rl.question('请输入微信 code: ', async (code) => {
        console.log('\n🔄 正在测试真实 code...');
        try {
          const res = await fetch(`${API_BASE}/api/auth/wechat-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code: code.trim(),
              userInfo: {
                nickName: '测试用户',
                avatarUrl: 'https://example.com/avatar.png',
                gender: 1
              }
            })
          });
          const data = await res.json();
          console.log('\n📄 返回结果:');
          console.log(JSON.stringify(data, null, 2));
          
          if (data.token) {
            console.log('\n✅ 登录成功! Token:', data.token.substring(0, 20) + '...');
            console.log('👤 用户:', data.user);
          } else {
            console.log('\n❌ 登录失败:', data.error || data.detail);
          }
        } catch (err) {
          console.error('\n❌ 请求失败:', err.message);
        }
        rl.close();
      });
    } else {
      rl.close();
    }
  });
}

// 运行测试
runTests().then(() => {
  interactiveTest();
});
