#!/usr/bin/env node
/**
 * CloudBase 自动化部署系统 v3.0
 * 改进：本地构建 standalone → 上传部署 → 健康检查
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  envId: 'weight-tracker-1ghr085dd7d6cff2',
  serviceName: 'weight-tracker-api',
  projectRoot: path.resolve(__dirname, '../..'),
  maxRetries: 3,
  healthCheckTimeout: 300000, // 5分钟
  pollInterval: 30000, // 30秒
};

const Colors = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m'
};

function log(level, message) {
  const timestamp = new Date().toLocaleTimeString('zh-CN');
  const colors = {
    INFO: Colors.CYAN,
    SUCCESS: Colors.GREEN,
    ERROR: Colors.RED,
    WARN: Colors.YELLOW,
  };
  console.log(`${Colors.GRAY}[${timestamp}]${Colors.RESET} ${colors[level] || ''}[${level}]${Colors.RESET} ${message}`);
}

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      timeout: options.timeout || 300000,
      cwd: options.cwd || CONFIG.projectRoot,
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

function execAsync(command, options = {}) {
  return new Promise((resolve) => {
    const child = spawn('bash', ['-c', command], {
      cwd: options.cwd || CONFIG.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (!options.silent) process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (!options.silent) process.stderr.write(data);
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        stderr: stderr,
        exitCode: code
      });
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message, output: stdout, stderr });
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 部署流程 ====================
class DeploymentManager {
  constructor() {
    this.attempt = 0;
  }

  async run() {
    log('INFO', '========================================');
    log('INFO', '  CloudBase 自动化部署系统 v3.0');
    log('INFO', '========================================');

    if (!this.preCheck()) {
      return false;
    }

    while (this.attempt < CONFIG.maxRetries) {
      this.attempt++;
      
      log('INFO', `\n========================================`);
      log('INFO', `  第 ${this.attempt}/${CONFIG.maxRetries} 次部署尝试`);
      log('INFO', `========================================`);

      const success = await this.deployCycle();
      
      if (success) {
        log('SUCCESS', '\n========================================');
        log('SUCCESS', '  🎉 部署成功完成！');
        log('SUCCESS', '========================================');
        return true;
      }

      if (this.attempt >= CONFIG.maxRetries) {
        log('ERROR', '\n========================================');
        log('ERROR', '  ❌ 部署失败，已达最大重试次数');
        log('ERROR', '========================================');
        return false;
      }

      log('WARN', `等待 30 秒后进行第 ${this.attempt + 1} 次尝试...`);
      await sleep(30000);
    }

    return false;
  }

  preCheck() {
    log('INFO', '执行前置检查...');
    
    const cliCheck = exec('tcb --version', { silent: true });
    if (!cliCheck.success) {
      log('ERROR', 'CloudBase CLI 未安装，请先运行: npm install -g @cloudbase/cli');
      return false;
    }
    log('SUCCESS', `CloudBase CLI: ${cliCheck.output.trim()}`);

    const loginCheck = exec('tcb env list', { silent: true });
    if (!loginCheck.success) {
      log('ERROR', 'CloudBase 登录失败，请先运行: tcb login');
      return false;
    }
    log('SUCCESS', 'CloudBase 登录正常');

    // 检查 node_modules
    if (!fs.existsSync(path.join(CONFIG.projectRoot, 'node_modules'))) {
      log('WARN', 'node_modules 不存在，正在安装依赖...');
      const install = exec('npm install --legacy-peer-deps', { timeout: 300000 });
      if (!install.success) {
        log('ERROR', '依赖安装失败');
        return false;
      }
    }

    return true;
  }

  async deployCycle() {
    // 步骤1: 构建
    log('INFO', '步骤 1/4: 本地构建项目...');
    
    const buildResult = exec('npm run build', { timeout: 300000 });
    if (!buildResult.success) {
      log('ERROR', `构建失败: ${buildResult.stderr || buildResult.error}`);
      return false;
    }
    
    if (!fs.existsSync(path.join(CONFIG.projectRoot, '.next/standalone'))) {
      log('ERROR', '构建失败: .next/standalone 目录不存在');
      return false;
    }
    log('SUCCESS', '本地构建成功');

    // 步骤2: 准备 standalone
    log('INFO', '步骤 2/4: 准备 standalone 目录...');
    
    const standaloneDir = path.join(CONFIG.projectRoot, '.next/standalone');
    
    // 复制静态资源
    const staticSrc = path.join(CONFIG.projectRoot, '.next/static');
    const staticDst = path.join(standaloneDir, '.next/static');
    if (fs.existsSync(staticSrc)) {
      execSync(`cp -r "${staticSrc}" "${path.join(standaloneDir, '.next/')}"`, { stdio: 'ignore' });
    }
    
    // 复制 public
    const publicSrc = path.join(CONFIG.projectRoot, 'public');
    const publicDst = path.join(standaloneDir, 'public');
    if (fs.existsSync(publicSrc)) {
      execSync(`cp -r "${publicSrc}" "${standaloneDir}/"`, { stdio: 'ignore' });
    }

    // 写入 Dockerfile（强制 PORT=80）
    const dockerfile = path.join(standaloneDir, 'Dockerfile');
    fs.writeFileSync(dockerfile, `FROM node:18-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production HOSTNAME=0.0.0.0
EXPOSE 80
CMD ["sh", "-c", "PORT=80 node server.js"]
`);

    log('SUCCESS', 'standalone 目录准备完成');

    // 步骤3: 本地验证
    log('INFO', '步骤 3/4: 本地验证启动...');
    
    const localOk = await this.localVerify(standaloneDir);
    if (!localOk) {
      log('ERROR', '本地验证失败，standalone 服务无法启动');
      return false;
    }
    log('SUCCESS', '本地验证通过');

    // 步骤4: 部署
    log('INFO', '步骤 4/4: 提交部署到 CloudBase...');
    
    const deployResult = await execAsync(
      `echo "n" | tcb cloudrun deploy -e ${CONFIG.envId} -s ${CONFIG.serviceName} --port 80 --source "${standaloneDir}" --force`,
      { silent: false, timeout: 300000 }
    );

    if (!deployResult.success) {
      log('ERROR', `部署提交失败: ${deployResult.stderr || deployResult.error}`);
      return false;
    }

    if (!deployResult.output.includes('提交容器型云托管') && !deployResult.output.includes('已完成')) {
      log('ERROR', '部署提交异常，请检查输出');
      return false;
    }

    log('SUCCESS', '部署已提交');

    // 步骤5: 远程健康检查
    return await this.healthCheck();
  }

  async localVerify(standaloneDir) {
    const testPort = 3456;
    
    return new Promise((resolve) => {
      const child = spawn('node', ['server.js'], {
        cwd: standaloneDir,
        env: { ...process.env, PORT: String(testPort), HOSTNAME: '0.0.0.0' },
        stdio: 'ignore'
      });

      const timeout = setTimeout(() => {
        child.kill();
        resolve(false);
      }, 15000);

      const checkHealth = async () => {
        await sleep(3000);
        try {
          const result = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${testPort}/api/health`, { silent: true });
          if (result.success && result.output.trim() === '200') {
            clearTimeout(timeout);
            child.kill();
            resolve(true);
            return;
          }
        } catch (e) {}
        
        // 再试一次
        await sleep(3000);
        try {
          const result = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${testPort}/api/health`, { silent: true });
          if (result.success && result.output.trim() === '200') {
            clearTimeout(timeout);
            child.kill();
            resolve(true);
            return;
          }
        } catch (e) {}
        
        clearTimeout(timeout);
        child.kill();
        resolve(false);
      };

      checkHealth();
    });
  }

  async healthCheck() {
    log('INFO', '等待 CloudBase 容器启动 (最多 5 分钟)...');
    
    const healthUrl = `https://${CONFIG.serviceName}-${CONFIG.envId}.sh.run.tcloudbase.com/api/health`;
    const startTime = Date.now();
    
    let lastChunk = '';
    
    while (Date.now() - startTime < CONFIG.healthCheckTimeout) {
      await sleep(CONFIG.pollInterval);
      
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = Math.round((CONFIG.healthCheckTimeout - (Date.now() - startTime)) / 1000);
      
      try {
        // 检查健康
        const healthResult = await execAsync(`curl -s -m 10 "${healthUrl}"`, { silent: true });
        if (healthResult.success && healthResult.output.includes('"status":"ok"')) {
          log('SUCCESS', `健康检查通过！(${elapsed}秒)`);
          
          // 额外检查：确认 JS chunk 已更新
          const pageResult = await execAsync(`curl -s -m 10 "https://${CONFIG.serviceName}-${CONFIG.envId}.sh.run.tcloudbase.com/" | grep -o 'page-[a-z0-9]*\.js' | head -1`, { silent: true });
          if (pageResult.success && pageResult.output.trim()) {
            log('INFO', `当前页面 chunk: ${pageResult.output.trim()}`);
          }
          
          return true;
        }
        
        // 检查页面是否返回 200
        const pageCheck = await execAsync(`curl -s -o /dev/null -w "%{http_code}" -m 10 "https://${CONFIG.serviceName}-${CONFIG.envId}.sh.run.tcloudbase.com/"`, { silent: true });
        const pageCode = pageCheck.output?.trim();
        
        if (pageCode === '503' || pageCode === '502') {
          log('WARN', `[${elapsed}s] 服务返回 ${pageCode}，可能仍在启动中... (剩余 ${remaining}s)`);
        } else if (pageCode === '200') {
          log('INFO', `[${elapsed}s] 页面返回 200，等待健康检查通过... (剩余 ${remaining}s)`);
        } else {
          log('WARN', `[${elapsed}s] 状态: HTTP ${pageCode}，继续等待... (剩余 ${remaining}s)`);
        }
        
      } catch (e) {
        log('WARN', `[${elapsed}s] 连接失败，继续等待... (剩余 ${remaining}s)`);
      }
    }
    
    log('ERROR', '健康检查超时（5分钟）');
    log('INFO', '请通过 CloudBase 控制台查看构建日志：');
    log('INFO', `https://tcb.cloud.tencent.com/dev?envId=${CONFIG.envId}#/platform-run/service/detail?serverName=${CONFIG.serviceName}&tabId=deploy`);
    return false;
  }
}

// ==================== 主入口 ====================
async function main() {
  const manager = new DeploymentManager();
  const success = await manager.run();
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  log('ERROR', `未捕获的异常: ${err.message}`);
  console.error(err);
  process.exit(1);
});
