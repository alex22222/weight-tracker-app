#!/usr/bin/env node
/**
 * CloudBase 部署脚本
 * 用于直接部署到腾讯云 CloudBase 云托管
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  envId: 'weight-tracker-1ghr085dd7d6cff2',
  serviceName: 'weight-tracker-api',
  port: 3000,
  minNum: 0,
  maxNum: 10,
  cpu: 0.25,
  mem: 0.5,
  // 环境变量
  envVars: {
    DB_TYPE: 'cloudbase',
    CLOUDBASE_ENV_ID: 'weight-tracker-1ghr085dd7d6cff2',
    NODE_ENV: 'production',
    PORT: '3000'
  }
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  log(`执行: ${command}`, 'blue');
  try {
    return execSync(command, { 
      stdio: 'inherit',
      ...options 
    });
  } catch (error) {
    throw error;
  }
}

// 主函数
async function main() {
  log('========================================', 'blue');
  log('  CloudBase 部署脚本', 'blue');
  log('========================================', 'blue');
  log('');

  // 检查 cloudbase CLI
  try {
    execSync('npx @cloudbase/cli --version', { stdio: 'pipe' });
  } catch (error) {
    log('✗ CloudBase CLI 未安装', 'red');
    log('正在安装...', 'yellow');
    exec('npm install -g @cloudbase/cli');
  }

  log('✓ CloudBase CLI 已就绪', 'green');
  log('');

  // 检查登录状态
  log('检查登录状态...', 'blue');
  try {
    execSync('npx @cloudbase/cli env:list', { stdio: 'pipe' });
    log('✓ 已登录', 'green');
  } catch (error) {
    log('✗ 未登录，请先运行: npx @cloudbase/cli login', 'red');
    process.exit(1);
  }
  log('');

  // 准备部署
  log('准备部署配置...', 'blue');
  log(`环境ID: ${CONFIG.envId}`, 'yellow');
  log(`服务名: ${CONFIG.serviceName}`, 'yellow');
  log(`端口: ${CONFIG.port}`, 'yellow');
  log('');

  // 生成部署命令
  const envVarsStr = Object.entries(CONFIG.envVars)
    .map(([k, v]) => `${k}=${v}`)
    .join(',');

  const deployCmd = `npx @cloudbase/cli cloudrun:deploy \\
    --service ${CONFIG.serviceName} \\
    --env-id ${CONFIG.envId} \\
    --port ${CONFIG.port} \\
    --min-num ${CONFIG.minNum} \\
    --max-num ${CONFIG.maxNum} \\
    --cpu ${CONFIG.cpu} \\
    --mem ${CONFIG.mem} \\
    --env-vars "${envVarsStr}" \\
    --no-confirm`;

  log('开始部署...', 'blue');
  log('');

  try {
    exec(deployCmd);
    log('');
    log('========================================', 'green');
    log('✓ 部署成功！', 'green');
    log('========================================', 'green');
    log('');
    log('服务地址:');
    log(`https://${CONFIG.serviceName}-${CONFIG.envId}.gz.apigw.tencentcs.com`, 'yellow');
    log('');
    log('验证命令:');
    log(`curl https://${CONFIG.serviceName}-${CONFIG.envId}.gz.apigw.tencentcs.com/api/health`, 'blue');
  } catch (error) {
    log('');
    log('========================================', 'red');
    log('✗ 部署失败', 'red');
    log('========================================', 'red');
    log('');
    log('常见解决方案:');
    log('1. 检查网络连接', 'yellow');
    log('2. 确认环境ID正确', 'yellow');
    log('3. 检查服务名是否已存在', 'yellow');
    log('4. 查看 CloudBase 控制台了解详情', 'yellow');
    process.exit(1);
  }
}

main().catch(error => {
  log(`错误: ${error.message}`, 'red');
  process.exit(1);
});
