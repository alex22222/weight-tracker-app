/**
 * 微信登录功能诊断报告
 * 运行: node diagnose-wechat-login.js
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         🔍 微信登录功能完整诊断报告                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let issues = [];
let warnings = [];
let checks = [];

// 检查 1: 环境变量
console.log('📋 检查 1: 环境变量配置');
console.log('─────────────────────────────────────────');
const WECHAT_APPID = process.env.WECHAT_APPID;
const WECHAT_SECRET = process.env.WECHAT_SECRET;

if (!WECHAT_APPID || WECHAT_APPID.includes('your-')) {
  issues.push({
    type: '严重',
    msg: 'WECHAT_APPID 未配置或为占位符',
    fix: '在 .env 文件中设置真实的微信小程序 AppID'
  });
  console.log('   ❌ WECHAT_APPID: 未配置');
} else {
  console.log(`   ✅ WECHAT_APPID: ${WECHAT_APPID.substring(0, 8)}...`);
}

if (!WECHAT_SECRET || WECHAT_SECRET.includes('your-')) {
  issues.push({
    type: '严重',
    msg: 'WECHAT_SECRET 未配置或为占位符',
    fix: '在 .env 文件中设置真实的微信小程序 AppSecret'
  });
  console.log('   ❌ WECHAT_SECRET: 未配置');
} else {
  console.log(`   ✅ WECHAT_SECRET: ${WECHAT_SECRET.substring(0, 8)}...`);
}
console.log();

// 检查 2: 文件结构
console.log('📋 检查 2: 项目文件结构');
console.log('─────────────────────────────────────────');
const basePath = process.cwd();
const requiredFiles = [
  'src/app/api/auth/wechat-login/route.ts',
  'weapp/pages/login/login.js',
  'weapp/pages/login/login.wxml',
  'prisma/schema.prisma',
  '.env'
];

for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(basePath, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) {
    issues.push({
      type: '严重',
      msg: `缺少文件: ${file}`,
      fix: '检查文件是否被误删'
    });
  }
}
console.log();

// 检查 3: 数据库迁移
console.log('📋 检查 3: 数据库迁移状态');
console.log('─────────────────────────────────────────');
const migrationsDir = path.join(basePath, 'prisma', 'migrations');
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter(f => 
    fs.statSync(path.join(migrationsDir, f)).isDirectory()
  );
  const wechatMigration = migrations.find(m => m.includes('wechat'));
  
  if (wechatMigration) {
    console.log(`   ✅ 微信登录迁移已创建: ${wechatMigration}`);
  } else {
    warnings.push({
      type: '警告',
      msg: '未找到微信登录相关的数据库迁移',
      fix: '运行: npx prisma migrate dev --name add_wechat_fields'
    });
    console.log('   ⚠️  未找到微信登录相关迁移');
  }
  
  console.log(`   📄 总迁移数: ${migrations.length}`);
} else {
  issues.push({
    type: '警告',
    msg: '未找到迁移目录',
    fix: '运行: npx prisma migrate dev'
  });
  console.log('   ❌ 未找到迁移目录');
}
console.log();

// 检查 4: API 路由
console.log('📋 检查 4: API 路由配置');
console.log('─────────────────────────────────────────');
const apiRouteFile = path.join(basePath, 'src/app/api/auth/wechat-login/route.ts');
if (fs.existsSync(apiRouteFile)) {
  const content = fs.readFileSync(apiRouteFile, 'utf-8');
  const checks = [
    { name: 'jscode2session 接口调用', pattern: /jscode2session/ },
    { name: 'OpenID 处理', pattern: /openid/ },
    { name: 'Token 生成', pattern: /generateToken/ },
    { name: '错误处理', pattern: /catch.*error/ },
  ];
  
  for (const check of checks) {
    const found = check.pattern.test(content);
    console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
    if (!found) {
      issues.push({
        type: '严重',
        msg: `API 缺少: ${check.name}`,
        fix: '检查 wechat-login/route.ts 文件'
      });
    }
  }
}
console.log();

// 检查 5: 小程序代码
console.log('📋 检查 5: 小程序登录代码');
console.log('─────────────────────────────────────────');
const loginJsFile = path.join(basePath, 'weapp/pages/login/login.js');
if (fs.existsSync(loginJsFile)) {
  const content = fs.readFileSync(loginJsFile, 'utf-8');
  const checks = [
    { name: 'wx.login 调用', pattern: /wx\.login/ },
    { name: 'wx.getUserProfile 调用', pattern: /wx\.getUserProfile/ },
    { name: '/auth/wechat-login 请求', pattern: /\/auth\/wechat-login/ },
    { name: '登录类型切换', pattern: /loginType/ },
    { name: '错误处理', pattern: /catch/ },
  ];
  
  for (const check of checks) {
    const found = check.pattern.test(content);
    console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
    if (!found) {
      warnings.push({
        type: '警告',
        msg: `小程序可能缺少: ${check.name}`,
        fix: '检查 login.js 文件'
      });
    }
  }
}
console.log();

// 检查 6: 依赖包
console.log('📋 检查 6: 依赖包');
console.log('─────────────────────────────────────────');
const packageJson = JSON.parse(fs.readFileSync(path.join(basePath, 'package.json'), 'utf-8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

const requiredDeps = ['@prisma/client', 'next'];
for (const dep of requiredDeps) {
  const found = dep in dependencies;
  console.log(`   ${found ? '✅' : '❌'} ${dep}`);
  if (!found) {
    issues.push({
      type: '严重',
      msg: `缺少依赖: ${dep}`,
      fix: `npm install ${dep}`
    });
  }
}
console.log();

// 总结
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                        诊断总结                             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ 所有检查通过！微信登录功能已准备就绪。\n');
} else {
  if (issues.length > 0) {
    console.log(`❌ 发现 ${issues.length} 个严重问题:\n`);
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. [${issue.type}] ${issue.msg}`);
      console.log(`      解决方案: ${issue.fix}\n`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  发现 ${warnings.length} 个警告:\n`);
    warnings.forEach((warn, i) => {
      console.log(`   ${i + 1}. [${warn.type}] ${warn.msg}`);
      console.log(`      建议: ${warn.fix}\n`);
    });
  }
}

// 真机测试指南
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    真机测试指南                             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📱 测试步骤:');
console.log('   1. 配置 .env 文件中的 WECHAT_APPID 和 WECHAT_SECRET');
console.log('   2. 启动后端服务: npm run dev');
console.log('   3. 打开微信开发者工具');
console.log('   4. 导入 weapp 目录');
console.log('   5. 配置服务器域名（ request 合法域名 ）');
console.log('   6. 点击「微信一键登录」按钮\n');

console.log('🔧 常见问题及解决方案:\n');

const commonIssues = [
  {
    symptom: '提示 "code 无效" 或 "40029"',
    cause: 'code 已被使用过或已过期',
    solution: '这是正常的，code 只能使用一次且5分钟有效'
  },
  {
    symptom: '提示 "请求失败" 或网络错误',
    cause: '后端服务未启动或域名未配置',
    solution: '1. 确保 npm run dev 已运行\n      2. 在小程序后台配置服务器域名'
  },
  {
    symptom: '提示 "缺少登录凭证 code"',
    cause: '小程序未正确调用 wx.login',
    solution: '检查微信开发者工具基础库版本（建议 2.19.0+）'
  },
  {
    symptom: '用户信息为 null',
    cause: '用户拒绝了 getUserProfile 授权',
    solution: '这是正常的，系统会用默认昵称+头像'
  },
  {
    symptom: '数据库报错 "Unknown field' + '"',
    cause: '数据库结构未更新',
    solution: '运行: npx prisma migrate dev'
  }
];

commonIssues.forEach((issue, i) => {
  console.log(`   ${i + 1}. 问题: ${issue.symptom}`);
  console.log(`      原因: ${issue.cause}`);
  console.log(`      解决: ${issue.solution}\n`);
});

console.log('📚 参考文档:');
console.log('   - 微信登录文档: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html');
console.log('   - 本项目文档: WECHAT_LOGIN.md\n');
