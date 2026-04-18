#!/usr/bin/env node
/**
 * 自动化部署系统
 * 自动上传、监控、分析错误、修复并重试
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  envId: 'weight-tracker-1ghr085dd7d6cff2',
  serviceName: 'weight-tracker-api',
  region: 'ap-shanghai',
  maxRetries: 5,
  retryDelay: 30000, // 30秒
  healthCheckTimeout: 120000, // 2分钟
  deployPackage: 'deploy-v5.8-final.zip'
};

// 日志
function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    ERROR: '\x1b[31m',
    WARN: '\x1b[33m',
    RESET: '\x1b[0m'
  };
  console.log(`${color[level]}[${timestamp}] [${level}]${color.RESET} ${message}`);
}

// 执行命令
function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      timeout: options.timeout || 300000,
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

// 检查 CloudBase CLI
function checkCloudbaseCLI() {
  log('INFO', '检查 CloudBase CLI...');
  const result = execCommand('tcb --version', { silent: true });
  if (result.success) {
    log('SUCCESS', `CloudBase CLI 已安装: ${result.output.trim()}`);
    return true;
  }
  log('ERROR', 'CloudBase CLI 未安装，正在安装...');
  const install = execCommand('npm install -g @cloudbase/cli');
  return install.success;
}

// 登录 CloudBase
function loginCloudbase() {
  log('INFO', '检查 CloudBase 登录状态...');
  const result = execCommand('tcb login', { silent: true });
  if (result.success) {
    log('SUCCESS', 'CloudBase 登录成功');
    return true;
  }
  log('ERROR', 'CloudBase 登录失败');
  return false;
}

// 上传部署包
async function uploadPackage(packagePath) {
  log('INFO', `上传部署包: ${packagePath}`);
  
  const uploadCommand = `tcb cloudrun:deploy \
    --envId ${CONFIG.envId} \
    --serviceName ${CONFIG.serviceName} \
    --region ${CONFIG.region} \
    --containerPort 80 \
    --minNum 0 \
    --maxNum 5 \
    --cpu 0.5 \
    --mem 1 \
    --dockerfile Dockerfile \
    --codeDir . \
    --silent`;

  return new Promise((resolve) => {
    const child = spawn('bash', ['-c', uploadCommand], {
      cwd: path.dirname(packagePath),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      const result = {
        success: code === 0,
        output: output + errorOutput,
        exitCode: code
      };
      resolve(result);
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        output: output + errorOutput,
        error: err.message
      });
    });
  });
}

// 监控部署状态
async function monitorDeployment() {
  log('INFO', '监控部署状态...');
  const startTime = Date.now();
  const maxWaitTime = 300000; // 5分钟

  while (Date.now() - startTime < maxWaitTime) {
    const result = execCommand(
      `tcb cloudrun:list --envId ${CONFIG.envId} --region ${CONFIG.region} --json`,
      { silent: true }
    );

    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        const service = data.find(s => s.name === CONFIG.serviceName);
        
        if (service) {
          log('INFO', `服务状态: ${service.status}, 版本: ${service.version}`);
          
          if (service.status === 'Ready' || service.status === 'running') {
            log('SUCCESS', '部署成功！');
            return { success: true, service };
          } else if (service.status === 'Failed' || service.status === 'Error') {
            return { 
              success: false, 
              error: `部署失败: ${service.message || service.status}`,
              details: service
            };
          }
        }
      } catch (e) {
        log('WARN', '解析状态失败，继续监控...');
      }
    }

    // 等待10秒再检查
    await new Promise(r => setTimeout(r, 10000));
    process.stdout.write('.');
  }

  return { success: false, error: '监控超时' };
}

// 获取部署日志
function getDeployLogs(versionId) {
  log('INFO', `获取部署日志: ${versionId}`);
  const result = execCommand(
    `tcb cloudrun:logs --envId ${CONFIG.envId} --region ${CONFIG.region} --serviceName ${CONFIG.serviceName} --versionId ${versionId} --tail 100`,
    { silent: true }
  );
  return result.output || result.error;
}

// 错误分析器
class ErrorAnalyzer {
  analyze(errorOutput) {
    const errors = [];
    
    // 检查常见错误模式
    const patterns = [
      {
        pattern: /Module not found.*Can't resolve ['"]([^'"]+)['"]/,
        type: 'IMPORT_ERROR',
        message: '导入路径错误',
        fixable: true
      },
      {
        pattern: /the name [`'](\w+)[`'] is defined multiple times/,
        type: 'DUPLICATE_VARIABLE',
        message: '变量重复定义',
        fixable: true
      },
      {
        pattern: /Expected a semicolon/,
        type: 'SYNTAX_ERROR',
        message: '语法错误 - 缺少分号',
        fixable: true
      },
      {
        pattern: /Cannot find module ['"]([^'"]+)['"]/,
        type: 'MISSING_MODULE',
        message: '模块不存在',
        fixable: false
      },
      {
        pattern: /Type error:\s*(.+)/,
        type: 'TYPE_ERROR',
        message: 'TypeScript 类型错误',
        fixable: true
      },
      {
        pattern: /Failed to compile/,
        type: 'COMPILE_ERROR',
        message: '编译失败',
        fixable: true
      },
      {
        pattern: /npm ERR|node_modules|cannot find module/i,
        type: 'NPM_ERROR',
        message: '依赖安装错误',
        fixable: true
      },
      {
        pattern: /Dockerfile|docker build|image build failed/i,
        type: 'DOCKER_ERROR',
        message: 'Docker 构建错误',
        fixable: true
      }
    ];

    for (const { pattern, type, message, fixable } of patterns) {
      const match = errorOutput.match(pattern);
      if (match) {
        errors.push({
          type,
          message,
          detail: match[1] || match[0],
          fixable,
          fullMatch: match[0]
        });
      }
    }

    return errors;
  }
}

// 自动修复模块
class AutoFixer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.srcDir = path.join(projectRoot, 'src');
  }

  async fix(errors, errorOutput) {
    const results = [];

    for (const error of errors) {
      log('INFO', `尝试修复: ${error.type} - ${error.message}`);
      
      try {
        switch (error.type) {
          case 'IMPORT_ERROR':
            results.push(await this.fixImportPath(error, errorOutput));
            break;
          case 'DUPLICATE_VARIABLE':
            results.push(await this.fixDuplicateVariable(error, errorOutput));
            break;
          case 'SYNTAX_ERROR':
            results.push(await this.fixSyntaxError(error, errorOutput));
            break;
          case 'TYPE_ERROR':
            results.push(await this.fixTypeError(error, errorOutput));
            break;
          default:
            results.push({ fixed: false, reason: '未知错误类型，无法自动修复' });
        }
      } catch (e) {
        results.push({ fixed: false, reason: e.message });
      }
    }

    return results;
  }

  // 从错误输出中提取文件路径
  extractFilePath(errorOutput, lineHint) {
    // 匹配 /app/src/... 路径
    const match = errorOutput.match(/\/app\/src\/([^:]+):(\d+):(\d+)/);
    if (match) {
      return {
        file: path.join(this.srcDir, match[1]),
        line: parseInt(match[2]),
        column: parseInt(match[3])
      };
    }
    return null;
  }

  async fixImportPath(error, errorOutput) {
    const fileInfo = this.extractFilePath(errorOutput);
    if (!fileInfo) {
      return { fixed: false, reason: '无法定位文件' };
    }

    log('INFO', `修复导入路径: ${fileInfo.file}:${fileInfo.line}`);

    // 读取文件
    const content = fs.readFileSync(fileInfo.file, 'utf8');
    const lines = content.split('\n');

    // 尝试修复常见路径问题
    // 1. 深度问题：修正 ../../../ 层级
    const fixedLines = lines.map(line => {
      // 修复过多的 ../
      if (line.includes('from \'../../../../lib/\'') || line.includes('from "../../../../lib/"')) {
        return line.replace('../../../../lib/', '../../lib/');
      }
      if (line.includes('from \'../../../../../lib/\'') || line.includes('from "../../../../../lib/"')) {
        return line.replace('../../../../../lib/', '../../../lib/');
      }
      return line;
    });

    if (JSON.stringify(lines) !== JSON.stringify(fixedLines)) {
      fs.writeFileSync(fileInfo.file, fixedLines.join('\n'));
      return { fixed: true, action: '修正导入路径深度' };
    }

    return { fixed: false, reason: '未找到可修复的路径问题' };
  }

  async fixDuplicateVariable(error, errorOutput) {
    const varName = error.detail;
    const fileInfo = this.extractFilePath(errorOutput);
    
    if (!fileInfo) {
      return { fixed: false, reason: '无法定位文件' };
    }

    log('INFO', `修复重复变量: ${varName} in ${fileInfo.file}`);

    const content = fs.readFileSync(fileInfo.file, 'utf8');
    const lines = content.split('\n');

    // 查找并删除重复的变量定义
    let foundFirst = false;
    const fixedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(new RegExp(`\\bconst\\s+${varName}\\s*=`));
      
      if (match) {
        if (foundFirst) {
          // 这是重复的，跳过
          log('INFO', `删除第 ${i + 1} 行的重复定义`);
          continue;
        }
        foundFirst = true;
      }
      fixedLines.push(line);
    }

    if (fixedLines.length < lines.length) {
      fs.writeFileSync(fileInfo.file, fixedLines.join('\n'));
      return { fixed: true, action: `删除重复的变量定义: ${varName}` };
    }

    return { fixed: false, reason: '未找到重复定义' };
  }

  async fixSyntaxError(error, errorOutput) {
    // 语法错误通常需要手动修复
    return { fixed: false, reason: '语法错误需要手动检查修复' };
  }

  async fixTypeError(error, errorOutput) {
    // 类型错误可能需要添加类型断言或修复类型定义
    return { fixed: false, reason: '类型错误需要手动修复' };
  }

  // 重新打包
  repackage() {
    log('INFO', '重新打包部署包...');
    
    const timestamp = Date.now();
    const newPackageName = `deploy-auto-${timestamp}.zip`;
    
    const result = execCommand(
      `cd ${this.projectRoot} && zip -r ${newPackageName} Dockerfile src/ prisma/ public/ package.json next.config.js tsconfig.json postcss.config.cjs tailwind.config.ts .env.production`,
      { silent: true }
    );

    if (result.success) {
      CONFIG.deployPackage = newPackageName;
      return { success: true, package: newPackageName };
    }
    return { success: false, error: result.error };
  }
}

// 健康检查
async function healthCheck() {
  log('INFO', '执行健康检查...');
  
  const healthUrl = `https://${CONFIG.serviceName}-${CONFIG.envId}.sh.run.tcloudbase.com/api/health`;
  
  for (let i = 0; i < 10; i++) {
    try {
      const result = execCommand(`curl -s ${healthUrl} -m 5`, { silent: true });
      if (result.success && result.output.includes('"status":"ok"')) {
        log('SUCCESS', '健康检查通过！');
        return true;
      }
    } catch (e) {
      // 继续重试
    }
    
    log('INFO', `健康检查重试 ${i + 1}/10...`);
    await new Promise(r => setTimeout(r, 5000));
  }
  
  return false;
}

// 主部署流程
async function main() {
  log('INFO', '========================================');
  log('INFO', '  自动化部署系统启动');
  log('INFO', '========================================');

  const projectRoot = path.resolve(__dirname, '../..');
  const analyzer = new ErrorAnalyzer();
  const fixer = new AutoFixer(projectRoot);

  // 检查 CLI
  if (!checkCloudbaseCLI()) {
    log('ERROR', 'CloudBase CLI 安装失败');
    process.exit(1);
  }

  // 登录
  if (!loginCloudbase()) {
    log('ERROR', 'CloudBase 登录失败');
    process.exit(1);
  }

  let attempt = 0;
  let success = false;

  while (attempt < CONFIG.maxRetries && !success) {
    attempt++;
    log('INFO', `\n========================================`);
    log('INFO', `  第 ${attempt}/${CONFIG.maxRetries} 次部署尝试`);
    log('INFO', `========================================`);

    // 上传
    const packagePath = path.join(projectRoot, CONFIG.deployPackage);
    const uploadResult = await uploadPackage(packagePath);

    if (!uploadResult.success) {
      log('ERROR', `上传失败: ${uploadResult.error}`);
      
      // 分析错误
      const errors = analyzer.analyze(uploadResult.output);
      
      if (errors.length === 0) {
        log('ERROR', '无法识别错误类型，停止重试');
        break;
      }

      log('WARN', `发现 ${errors.length} 个错误:`);
      errors.forEach((e, i) => {
        log('WARN', `  ${i + 1}. [${e.type}] ${e.message}: ${e.detail}`);
      });

      // 检查是否都可修复
      const fixableErrors = errors.filter(e => e.fixable);
      if (fixableErrors.length === 0) {
        log('ERROR', '没有可自动修复的错误，停止重试');
        break;
      }

      // 尝试修复
      log('INFO', '尝试自动修复...');
      const fixResults = await fixer.fix(fixableErrors, uploadResult.output);
      
      const fixedCount = fixResults.filter(r => r.fixed).length;
      log('INFO', `修复完成: ${fixedCount}/${fixResults.length} 个问题已修复`);

      if (fixedCount === 0) {
        log('ERROR', '自动修复失败，停止重试');
        break;
      }

      // 重新打包
      const repackageResult = fixer.repackage();
      if (!repackageResult.success) {
        log('ERROR', '重新打包失败');
        break;
      }

      log('INFO', `新包已创建: ${repackageResult.package}`);
      
      // 等待后重试
      log('INFO', `等待 ${CONFIG.retryDelay/1000} 秒后重试...`);
      await new Promise(r => setTimeout(r, CONFIG.retryDelay));
      continue;
    }

    // 监控部署状态
    const monitorResult = await monitorDeployment();
    
    if (!monitorResult.success) {
      log('ERROR', `部署失败: ${monitorResult.error}`);
      
      if (monitorResult.details) {
        // 获取日志
        const logs = getDeployLogs(monitorResult.details.versionId);
        log('INFO', '部署日志:');
        console.log(logs);
        
        // 分析日志中的错误
        const errors = analyzer.analyze(logs);
        if (errors.length > 0) {
          log('WARN', '从日志中发现错误:');
          errors.forEach((e, i) => {
            log('WARN', `  ${i + 1}. [${e.type}] ${e.message}`);
          });

          // 尝试修复
          const fixResults = await fixer.fix(errors, logs);
          const fixedCount = fixResults.filter(r => r.fixed).length;
          
          if (fixedCount > 0) {
            log('INFO', `已修复 ${fixedCount} 个问题，准备重试...`);
            fixer.repackage();
            await new Promise(r => setTimeout(r, CONFIG.retryDelay));
            continue;
          }
        }
      }
      
      break;
    }

    // 健康检查
    const healthy = await healthCheck();
    if (healthy) {
      log('SUCCESS', '========================================');
      log('SUCCESS', '  部署成功完成！');
      log('SUCCESS', '========================================');
      success = true;
    } else {
      log('ERROR', '健康检查失败');
      break;
    }
  }

  if (!success) {
    log('ERROR', '========================================');
    log('ERROR', '  部署失败，已达最大重试次数');
    log('ERROR', '========================================');
    process.exit(1);
  }
}

// 运行
main().catch(err => {
  log('ERROR', `未捕获的异常: ${err.message}`);
  console.error(err);
  process.exit(1);
});
