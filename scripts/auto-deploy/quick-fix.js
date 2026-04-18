#!/usr/bin/env node
/**
 * 快速修复脚本 - 修复常见部署错误
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 修复导入路径
function fixImportPaths() {
  log('检查并修复导入路径...');
  
  const apiDir = path.join(SRC_DIR, 'app', 'api');
  const files = findTsFiles(apiDir);
  
  let fixedCount = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(apiDir, file);
    const depth = relativePath.split(path.sep).length - 1;
    
    let newContent = content;
    
    // 根据深度修复路径
    if (depth === 1) {
      // 例如: app/api/weight/route.ts -> 应该使用 ../lib/
      newContent = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/lib\//g, 'from "../lib/');
      newContent = newContent.replace(/from ['"]\.\.\/\.\.\/lib\//g, 'from "../lib/');
    } else if (depth === 2) {
      // 例如: app/api/auth/login/route.ts -> 应该使用 ../../lib/
      newContent = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/lib\//g, 'from "../../lib/');
      newContent = newContent.replace(/from ['"]\.\.\/\.\.\/\.\.\/lib\//g, 'from "../../lib/');
      newContent = newContent.replace(/from ['"]\.\.\/\.\.\/lib\//g, 'from "../../lib/');
    } else if (depth === 3) {
      // 例如: app/api/channels/[id]/checkin/route.ts -> 应该使用 ../../../lib/
      newContent = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\//g, 'from "../../../lib/');
      newContent = newContent.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/lib\//g, 'from "../../../lib/');
      newContent = newContent.replace(/from ['"]\.\.\/\.\.\/lib\//g, 'from "../../../lib/');
    }
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      log(`✅ 修复: ${relativePath}`);
      fixedCount++;
    }
  }
  
  log(`共修复 ${fixedCount} 个文件的导入路径`);
  return fixedCount > 0;
}

// 查找所有 TS 文件
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.includes('node_modules')) {
      findTsFiles(fullPath, files);
    } else if (stat.isFile() && item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

// 修复重复变量定义
function fixDuplicateVariables() {
  log('检查并修复重复变量定义...');
  
  const files = findTsFiles(path.join(SRC_DIR, 'app', 'api'));
  let fixedCount = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // 查找重复的 const 定义
    const constVars = new Map();
    const duplicates = [];
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/const\s+(\w+)\s*=/);
      if (match) {
        const varName = match[1];
        if (constVars.has(varName)) {
          duplicates.push({ line: i, name: varName, firstLine: constVars.get(varName) });
        } else {
          constVars.set(varName, i);
        }
      }
    }
    
    if (duplicates.length > 0) {
      // 删除重复行
      const linesToRemove = new Set(duplicates.map(d => d.line));
      const newLines = lines.filter((_, i) => !linesToRemove.has(i));
      
      fs.writeFileSync(file, newLines.join('\n'));
      log(`✅ 修复重复变量 in ${path.relative(PROJECT_ROOT, file)}: ${duplicates.map(d => d.name).join(', ')}`);
      fixedCount++;
    }
  }
  
  log(`共修复 ${fixedCount} 个文件的重复变量`);
  return fixedCount > 0;
}

// 检查缺少的 API 路由
function checkMissingApis() {
  log('检查 API 完整性...');
  
  const requiredApis = [
    'user/route.ts',
    'settings/route.ts',
    'weight/route.ts',
    'auth/login/route.ts',
    'auth/register/route.ts',
    'auth/wechat-login/route.ts',
    'auth/guest/route.ts',
    'friends/route.ts',
    'channels/route.ts',
    'tasks/route.ts',
    'goals/route.ts',
    'messages/route.ts',
    'reading/route.ts',
    'upload/route.ts',
    'weather/route.ts'
  ];
  
  const apiDir = path.join(SRC_DIR, 'app', 'api');
  const missing = [];
  
  for (const api of requiredApis) {
    const fullPath = path.join(apiDir, api);
    if (!fs.existsSync(fullPath)) {
      missing.push(api);
      log(`❌ 缺少 API: ${api}`);
    }
  }
  
  if (missing.length === 0) {
    log('✅ 所有必需的 API 都已存在');
  }
  
  return missing;
}

// 重新打包
function repackage() {
  log('重新打包...');
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const packageName = `deploy-fixed-${timestamp}.zip`;
    
    execSync(
      `zip -r ${packageName} Dockerfile src/ prisma/ public/ package.json next.config.js tsconfig.json postcss.config.cjs tailwind.config.ts .env.production`,
      { cwd: PROJECT_ROOT, stdio: 'inherit' }
    );
    
    log(`✅ 新包已创建: ${packageName}`);
    return packageName;
  } catch (e) {
    log(`❌ 打包失败: ${e.message}`);
    return null;
  }
}

// 主函数
function main() {
  log('========================================');
  log('  快速修复工具启动');
  log('========================================');
  
  let hasChanges = false;
  
  // 修复导入路径
  if (fixImportPaths()) {
    hasChanges = true;
  }
  
  // 修复重复变量
  if (fixDuplicateVariables()) {
    hasChanges = true;
  }
  
  // 检查缺少的 API
  const missing = checkMissingApis();
  if (missing.length > 0) {
    log(`⚠️  发现 ${missing.length} 个缺少的 API，需要手动创建`);
  }
  
  // 如果有修改，重新打包
  if (hasChanges) {
    const packageName = repackage();
    if (packageName) {
      log('========================================');
      log('  修复完成！');
      log(`  新包: ${packageName}`);
      log('========================================');
    }
  } else {
    log('========================================');
    log('  没有需要修复的问题');
    log('========================================');
  }
}

main();
