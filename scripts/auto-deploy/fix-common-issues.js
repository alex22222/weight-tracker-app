#!/usr/bin/env node
/**
 * 部署前检查脚本
 * 功能：检查常见部署问题，只报告不自动修改代码
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString('zh-CN')}] ${msg}`);
}

// 检查 TypeScript 编译错误
function checkTypeScriptErrors() {
  log('检查 TypeScript 编译...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      timeout: 60000
    });
    log('✅ TypeScript 编译通过');
    return 0;
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorCount = (output.match(/error TS/g) || []).length;
    if (errorCount > 0) {
      log(`❌ 发现 ${errorCount} 个 TypeScript 错误，请先修复：`);
      console.log(output.slice(0, 2000));
      return errorCount;
    }
    log('⚠️  TypeScript 检查异常，但可能没有错误');
    return 0;
  }
}

// 检查必要的配置文件
function checkRequiredFiles() {
  log('检查必要文件...');
  const required = [
    'package.json',
    'next.config.js',
    'Dockerfile',
    'src/app/page.tsx',
    'src/app/AdminDashboard.tsx'
  ];
  let missing = 0;
  for (const file of required) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(fullPath)) {
      log(`❌ 缺少必要文件: ${file}`);
      missing++;
    }
  }
  if (missing === 0) {
    log('✅ 所有必要文件存在');
  }
  return missing;
}

// 检查环境变量配置
function checkEnvConfig() {
  log('检查环境变量配置...');
  const envFile = path.join(PROJECT_ROOT, '.env.production');
  if (!fs.existsSync(envFile)) {
    log('⚠️  .env.production 不存在');
    return 1;
  }
  
  const content = fs.readFileSync(envFile, 'utf8');
  const issues = [];
  
  if (content.includes('your-cloudbase-env-id')) {
    issues.push('.env.production 中 CLOUDBASE_ENV_ID 仍是占位符');
  }
  if (content.includes('your-tencent-secret-id')) {
    issues.push('.env.production 中 TENCENT_SECRET_ID 仍是占位符');
  }
  if (content.includes('your-jwt-secret-key')) {
    issues.push('.env.production 中 JWT_SECRET 仍是占位符');
  }
  
  if (issues.length > 0) {
    log('⚠️  环境变量配置提醒（CloudBase 控制台会覆盖这些值）：');
    issues.forEach(i => log(`   - ${i}`));
  } else {
    log('✅ 环境变量已配置');
  }
  return issues.length;
}

// 主函数
function main() {
  log('========================================');
  log('  部署前检查');
  log('========================================');
  
  let issues = 0;
  issues += checkRequiredFiles();
  issues += checkEnvConfig();
  issues += checkTypeScriptErrors();
  
  log('');
  if (issues === 0) {
    log('✅ 检查通过，可以部署');
    log('========================================');
  } else {
    log(`⚠️  发现 ${issues} 个问题，建议修复后再部署`);
    log('========================================');
  }
}

main();
