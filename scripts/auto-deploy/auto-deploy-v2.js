#!/usr/bin/env node
/**
 * 智能自动化部署系统 v2.0
 * 功能：自动部署 → 监控状态 → 分析日志 → 自动修复 → 重试直到成功
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const CONFIG = {
  envId: 'weight-tracker-1ghr085dd7d6cff2',
  serviceName: 'weight-tracker-api',
  region: 'ap-shanghai',
  maxRetries: 10,
  pollInterval: 15000,      // 15秒检查一次状态
  maxPollTime: 600000,      // 最多等待10分钟
  healthCheckTimeout: 120000,
  projectRoot: path.resolve(__dirname, '../..'),
  deployPackage: 'deploy-auto.zip'
};

// ==================== 日志工具 ====================
const Colors = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
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
    DEBUG: Colors.GRAY,
    FIX: Colors.BLUE
  };
  console.log(`${Colors.GRAY}[${timestamp}]${Colors.RESET} ${colors[level] || ''}[${level}]${Colors.RESET} ${message}`);
}

// ==================== 命令执行 ====================
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

// ==================== CloudBase API ====================
const CloudBaseAPI = {
  // 获取服务列表和状态
  async getServiceStatus() {
    const result = await execAsync(
      `tcb cloudrun:list -e ${CONFIG.envId} --json`,
      { silent: true }
    );
    
    if (!result.success) {
      return { success: false, error: result.stderr || result.error };
    }

    try {
      const services = JSON.parse(result.output);
      const service = services.find(s => s.name === CONFIG.serviceName);
      
      if (!service) {
        return { success: false, error: '服务不存在' };
      }

      return { 
        success: true, 
        status: service.status,           // Ready, Failed, Deploying, etc.
        versionId: service.versionId,
        service: service
      };
    } catch (e) {
      return { success: false, error: '解析服务状态失败: ' + e.message };
    }
  },

  // 获取部署日志
  async getDeployLogs(versionId, lines = 200) {
    if (!versionId) return { success: false, error: '缺少版本ID' };
    
    const result = await execAsync(
      `tcb cloudrun:logs -e ${CONFIG.envId} -s ${CONFIG.serviceName} --versionId ${versionId} --tail ${lines}`,
      { silent: true }
    );
    
    return result;
  },

  // 执行部署
  async deploy() {
    log('INFO', '开始提交部署...');
    
    const result = await execAsync(
      `echo "n" | tcb cloudrun deploy -e ${CONFIG.envId} -s ${CONFIG.serviceName} --port 80 --source . --force`,
      { silent: false, timeout: 300000 }
    );

    return result;
  }
};

// ==================== 错误分析器 ====================
class ErrorAnalyzer {
  constructor() {
    this.errorPatterns = [
      {
        name: 'DUPLICATE_VARIABLE',
        patterns: [
          /the name [`'](\w+)[`'] is defined multiple times/,
          /Variable ['"](\w+)['"] is already declared/,
          /Duplicate identifier ['"](\w+)['"]/
        ],
        message: '变量重复定义',
        fixable: true,
        autoFix: this.fixDuplicateVariable.bind(this)
      },
      {
        name: 'IMPORT_PATH_ERROR',
        patterns: [
          /Module not found.*Can't resolve ['"]([^'"]+)['"]/,
          /Cannot find module ['"]([^'"]+)['"]/,
          /Error:.*Cannot resolve.*from/
        ],
        message: '导入路径错误',
        fixable: true,
        autoFix: this.fixImportPath.bind(this)
      },
      {
        name: 'SYNTAX_ERROR',
        patterns: [
          /Expected a semicolon/,
          /Unexpected token/,
          /SyntaxError:/,
          /ParseError:/,
          /Unexpected identifier/
        ],
        message: '语法错误',
        fixable: false
      },
      {
        name: 'TYPE_ERROR',
        patterns: [
          /Type error:/,
          /TypeError:/,
          /Type ['"](\w+)['"] is not assignable to type ['"](\w+)['"]/,
          /Property ['"](\w+)['"] does not exist on type/
        ],
        message: 'TypeScript 类型错误',
        fixable: false
      },
      {
        name: 'MISSING_MODULE',
        patterns: [
          /Cannot find module ['"]([^'"]+)['"].*in node_modules/,
          /Module ['"]([^'"]+)['"] not found/
        ],
        message: '缺少依赖模块',
        fixable: false
      },
      {
        name: 'BUILD_ERROR',
        patterns: [
          /Failed to compile/,
          /Build failed/,
          /Compilation error/,
          /webpack.*Error/
        ],
        message: '构建失败',
        fixable: true
      },
      {
        name: 'DOCKER_ERROR',
        patterns: [
          /docker build failed/,
          /image build failed/,
          /Dockerfile.*error/,
          /failed to solve/,
          /executor failed/
        ],
        message: 'Docker 构建错误',
        fixable: false
      },
      {
        name: 'MEMORY_ERROR',
        patterns: [
          /JavaScript heap out of memory/,
          /ENOMEM/,
          /allocation failed/
        ],
        message: '内存不足',
        fixable: false
      }
    ];
  }

  analyze(logContent) {
    const errors = [];
    
    for (const errorType of this.errorPatterns) {
      for (const pattern of errorType.patterns) {
        const matches = logContent.matchAll(new RegExp(pattern, 'g'));
        for (const match of matches) {
          errors.push({
            type: errorType.name,
            message: errorType.message,
            detail: match[1] || match[0],
            fullMatch: match[0],
            fixable: errorType.fixable,
            autoFix: errorType.autoFix,
            line: this.extractLineNumber(logContent, match.index)
          });
        }
      }
    }

    // 去重
    const unique = [];
    const seen = new Set();
    for (const err of errors) {
      const key = `${err.type}:${err.detail}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(err);
      }
    }

    return unique;
  }

  extractLineNumber(content, index) {
    const before = content.substring(0, index);
    const lines = before.split('\n');
    return lines.length;
  }

  extractFilePath(logContent) {
    // 匹配 /app/src/... 或 ./src/... 路径
    const patterns = [
      /\/app\/src\/([^:]+):(\d+):(\d+)/,
      /\.\/src\/([^:]+):(\d+):(\d+)/,
      /src\/app\/api\/([^:]+):(\d+):(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = logContent.match(pattern);
      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3])
        };
      }
    }
    return null;
  }

  // 自动修复：重复变量
  async fixDuplicateVariable(error, logContent) {
    const varName = error.detail;
    const fileInfo = this.extractFilePath(logContent);
    
    if (!fileInfo) {
      return { fixed: false, reason: '无法定位文件路径' };
    }

    const fullPath = path.join(CONFIG.projectRoot, 'src', fileInfo.file);
    if (!fs.existsSync(fullPath)) {
      return { fixed: false, reason: `文件不存在: ${fullPath}` };
    }

    log('FIX', `修复重复变量 "${varName}" in ${fileInfo.file}:${fileInfo.line}`);

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    // 查找该变量的所有定义
    const varRegex = new RegExp(`\\bconst\\s+${varName}\\s*=`);
    const definitions = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (varRegex.test(lines[i])) {
        definitions.push(i);
      }
    }

    if (definitions.length < 2) {
      return { fixed: false, reason: '未找到重复定义' };
    }

    // 删除除第一个外的所有定义
    const toRemove = definitions.slice(1).reverse(); // 从后往前删
    for (const lineIndex of toRemove) {
      lines.splice(lineIndex, 1);
      log('FIX', `  删除第 ${lineIndex + 1} 行的重复定义`);
    }

    fs.writeFileSync(fullPath, lines.join('\n'));
    return { fixed: true, action: `删除 ${toRemove.length} 处重复定义`, file: fileInfo.file };
  }

  // 自动修复：导入路径
  async fixImportPath(error, logContent) {
    const fileInfo = this.extractFilePath(logContent);
    if (!fileInfo) {
      return { fixed: false, reason: '无法定位文件' };
    }

    const fullPath = path.join(CONFIG.projectRoot, 'src', fileInfo.file);
    if (!fs.existsSync(fullPath)) {
      return { fixed: false, reason: '文件不存在' };
    }

    log('FIX', `修复导入路径 in ${fileInfo.file}`);

    let content = fs.readFileSync(fullPath, 'utf8');
    let fixed = false;

    // 修复过度的 ../
    const fixes = [
      { from: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/lib\//g, to: 'from "../../../lib/' },
      { from: /from ['"]\.\.\/\.\.\/\.\.\/lib\//g, to: 'from "../../lib/' },
      { from: /from ['"]\.\.\/\.\.\/lib\//g, to: 'from "../lib/' }
    ];

    for (const fix of fixes) {
      if (fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        fixed = true;
        log('FIX', `  修复: ${fix.to}`);
      }
    }

    if (fixed) {
      fs.writeFileSync(fullPath, content);
      return { fixed: true, action: '修正导入路径层级', file: fileInfo.file };
    }

    return { fixed: false, reason: '未找到可修复的路径问题' };
  }
}

// ==================== 自动修复引擎 ====================
class AutoFixEngine {
  constructor() {
    this.analyzer = new ErrorAnalyzer();
    this.fixHistory = [];
  }

  async analyzeAndFix(logContent) {
    log('INFO', '分析部署日志...');
    
    const errors = this.analyzer.analyze(logContent);
    
    if (errors.length === 0) {
      log('WARN', '未识别到可修复的错误类型');
      return { hasFixableErrors: false, fixes: [] };
    }

    log('INFO', `发现 ${errors.length} 个错误:`);
    errors.forEach((err, i) => {
      const status = err.fixable ? Colors.GREEN + '[可修复]' : Colors.RED + '[需手动]';
      log('INFO', `  ${i + 1}. [${err.type}] ${err.message} ${status}${Colors.RESET}`);
    });

    const fixableErrors = errors.filter(e => e.fixable && e.autoFix);
    
    if (fixableErrors.length === 0) {
      log('ERROR', '没有可自动修复的错误');
      return { hasFixableErrors: false, fixes: [], allErrors: errors };
    }

    const fixes = [];
    for (const error of fixableErrors) {
      try {
        const result = await error.autoFix(error, logContent);
        fixes.push(result);
        
        if (result.fixed) {
          this.fixHistory.push({
            type: error.type,
            file: result.file,
            action: result.action,
            time: new Date().toISOString()
          });
        }
      } catch (e) {
        fixes.push({ fixed: false, error: e.message, type: error.type });
      }
    }

    const successCount = fixes.filter(f => f.fixed).length;
    log('INFO', `修复完成: ${successCount}/${fixes.length} 个成功`);

    return {
      hasFixableErrors: successCount > 0,
      fixes,
      allErrors: errors
    };
  }

  repackage() {
    log('INFO', '重新打包部署包...');
    
    const timestamp = Date.now();
    const packageName = `deploy-auto-${timestamp}.zip`;
    
    const result = exec(
      `zip -r ${packageName} Dockerfile src/ prisma/ public/ package.json next.config.js tsconfig.json postcss.config.cjs tailwind.config.ts .env.production`,
      { silent: true }
    );

    if (result.success) {
      CONFIG.deployPackage = packageName;
      log('SUCCESS', `新包已创建: ${packageName}`);
      return { success: true, package: packageName };
    }
    
    return { success: false, error: result.error };
  }
}

// ==================== 部署流程 ====================
class DeploymentManager {
  constructor() {
    this.fixEngine = new AutoFixEngine();
    this.attempt = 0;
  }

  async run() {
    log('INFO', '========================================');
    log('INFO', '  智能自动化部署系统 v2.0');
    log('INFO', '========================================');

    // 前置检查
    if (!this.preCheck()) {
      return false;
    }

    // 部署循环
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

      log('WARN', `等待 10 秒后进行第 ${this.attempt + 1} 次尝试...`);
      await this.sleep(10000);
    }

    return false;
  }

  preCheck() {
    log('INFO', '执行前置检查...');
    
    // 检查 CLI
    const cliCheck = exec('tcb --version', { silent: true });
    if (!cliCheck.success) {
      log('ERROR', 'CloudBase CLI 未安装');
      return false;
    }
    log('SUCCESS', `CloudBase CLI: ${cliCheck.output.trim()}`);

    // 检查登录
    const loginCheck = exec('tcb login', { silent: true });
    if (!loginCheck.success) {
      log('ERROR', 'CloudBase 登录失败');
      return false;
    }
    log('SUCCESS', 'CloudBase 登录正常');

    return true;
  }

  async deployCycle() {
    // 步骤1: 提交部署
    const deployResult = await CloudBaseAPI.deploy();
    
    if (!deployResult.success && !deployResult.output.includes('submission completed')) {
      log('ERROR', `部署提交失败: ${deployResult.stderr || deployResult.error}`);
      return false;
    }

    log('SUCCESS', '部署已提交，开始监控状态...');

    // 步骤2: 轮询状态
    const statusResult = await this.pollStatus();
    
    if (statusResult.success) {
      // 步骤3: 健康检查
      return await this.healthCheck();
    }

    // 部署失败，获取日志并分析
    if (statusResult.failed) {
      return await this.handleFailure(statusResult);
    }

    return false;
  }

  async pollStatus() {
    const startTime = Date.now();
    let lastStatus = '';
    
    while (Date.now() - startTime < CONFIG.maxPollTime) {
      const result = await CloudBaseAPI.getServiceStatus();
      
      if (!result.success) {
        log('WARN', `获取状态失败: ${result.error}`);
        await this.sleep(CONFIG.pollInterval);
        continue;
      }

      const { status, versionId, service } = result;
      
      // 状态变化时输出
      if (status !== lastStatus) {
        log('INFO', `部署状态: ${status}${versionId ? ` (版本: ${versionId})` : ''}`);
        lastStatus = status;
      }

      // 成功
      if (status === 'Ready' || status === 'running') {
        return { success: true, versionId, service };
      }

      // 失败
      if (status === 'Failed' || status === 'Error') {
        return { 
          success: false, 
          failed: true, 
          status, 
          versionId,
          service,
          message: service.message || service.statusMessage || '部署失败'
        };
      }

      // 仍在部署中
      process.stdout.write('.');
      await this.sleep(CONFIG.pollInterval);
    }

    return { success: false, failed: false, error: '轮询超时' };
  }

  async handleFailure(failureInfo) {
    log('ERROR', `部署失败: ${failureInfo.message}`);
    
    if (!failureInfo.versionId) {
      log('ERROR', '无法获取版本ID，无法读取日志');
      return false;
    }

    // 获取部署日志
    log('INFO', `获取部署日志 (版本: ${failureInfo.versionId})...`);
    const logsResult = await CloudBaseAPI.getDeployLogs(failureInfo.versionId, 500);
    
    if (!logsResult.success) {
      log('ERROR', `获取日志失败: ${logsResult.error}`);
      return false;
    }

    // 保存日志供分析
    const logFile = path.join(CONFIG.projectRoot, 'deploy-error.log');
    fs.writeFileSync(logFile, logsResult.output);
    log('INFO', `日志已保存: ${logFile}`);

    // 分析并修复
    const fixResult = await this.fixEngine.analyzeAndFix(logsResult.output);
    
    if (!fixResult.hasFixableErrors) {
      log('ERROR', '没有可自动修复的错误，需要手动处理');
      
      // 输出关键错误信息
      if (fixResult.allErrors) {
        log('INFO', '\n错误摘要:');
        fixResult.allErrors.slice(0, 5).forEach((err, i) => {
          log('INFO', `  ${i + 1}. ${err.message}: ${err.detail}`);
        });
      }
      
      return false;
    }

    // 重新打包
    const repackageResult = this.fixEngine.repackage();
    if (!repackageResult.success) {
      log('ERROR', '重新打包失败');
      return false;
    }

    return false; // 返回false以触发重试
  }

  async healthCheck() {
    log('INFO', '执行健康检查...');
    
    const healthUrl = `https://${CONFIG.serviceName}-${CONFIG.envId}.sh.run.tcloudbase.com/api/health`;
    
    for (let i = 0; i < 10; i++) {
      try {
        const result = await execAsync(`curl -s ${healthUrl} -m 5`, { silent: true });
        
        if (result.success && result.output.includes('"status":"ok"')) {
          log('SUCCESS', '健康检查通过！');
          return true;
        }
      } catch (e) {
        // 继续重试
      }
      
      process.stdout.write('.');
      await this.sleep(5000);
    }
    
    log('ERROR', '健康检查失败');
    return false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
