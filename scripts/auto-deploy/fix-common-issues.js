#!/usr/bin/env node
/**
 * 常见问题预修复脚本
 * 在部署前运行，修复已知的常见问题
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString('zh-CN')}] ${msg}`);
}

// 查找所有 TS 文件
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.includes('node_modules')) {
      findTsFiles(fullPath, files);
    } else if (stat.isFile() && item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

// 计算相对路径深度
function getRelativeDepth(filePath, baseDir) {
  const relative = path.relative(baseDir, filePath);
  return relative.split(path.sep).length - 1;
}

// 修复1: 重复变量定义
function fixDuplicateVariables() {
  log('检查重复变量定义...');
  
  const files = findTsFiles(path.join(SRC_DIR, 'app', 'api'));
  let totalFixed = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // 查找重复的 const 定义
    const varCounts = new Map();
    const duplicates = [];
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/const\s+(\w+)\s*=/);
      if (match) {
        const varName = match[1];
        if (varCounts.has(varName)) {
          duplicates.push({ line: i, name: varName });
        } else {
          varCounts.set(varName, i);
        }
      }
    }
    
    if (duplicates.length > 0) {
      // 从后往前删除重复行
      const toRemove = [...new Set(duplicates.map(d => d.line))].sort((a, b) => b - a);
      
      for (const lineIdx of toRemove) {
        lines.splice(lineIdx, 1);
      }
      
      fs.writeFileSync(file, lines.join('\n'));
      log(`✅ 修复 ${path.basename(path.dirname(file))}/${path.basename(file)}: 删除 ${toRemove.length} 处重复定义`);
      totalFixed++;
    }
  }
  
  return totalFixed;
}

// 修复2: 导入路径
function fixImportPaths() {
  log('检查导入路径...');
  
  const apiDir = path.join(SRC_DIR, 'app', 'api');
  const files = findTsFiles(apiDir);
  let totalFixed = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const depth = getRelativeDepth(file, apiDir);
    
    let newContent = content;
    let fixed = false;
    
    // 根据深度确定正确的路径
    const correctPrefix = '../'.repeat(depth) + 'lib/';
    
    // 修复过度的 ../ (例如 depth=1 时应该是 ../lib/ 而不是 ../../lib/)
    const wrongPatterns = [
      { regex: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/lib\//g, correct: '../../../../lib/' },
      { regex: /from ['"]\.\.\/\.\.\/\.\.\/lib\//g, correct: '../../../lib/' },
      { regex: /from ['"]\.\.\/\.\.\/lib\//g, correct: '../../lib/' }
    ];
    
    for (const { regex, correct } of wrongPatterns) {
      if (regex.test(newContent)) {
        // 计算这个文件需要的正确路径
        const neededLevels = depth;
        const actualLevels = (correct.match(/\.\.\//g) || []).length;
        
        if (actualLevels !== neededLevels) {
          const newPrefix = '../'.repeat(neededLevels) + 'lib/';
          newContent = newContent.replace(regex, `from "${newPrefix}`);
          fixed = true;
        }
      }
    }
    
    if (fixed) {
      fs.writeFileSync(file, newContent);
      log(`✅ 修复 ${path.relative(apiDir, file)}: 导入路径`);
      totalFixed++;
    }
  }
  
  return totalFixed;
}

// 修复3: 检查缺少的导入
function fixMissingImports() {
  log('检查缺少的导入...');
  
  const files = findTsFiles(path.join(SRC_DIR, 'app', 'api'));
  let totalFixed = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // 检查是否使用了 getUserFromRequest 但没有导入
    if (content.includes('getUserFromRequest(') && !content.includes('getUserFromRequest')) {
      // 需要添加导入
      const depth = getRelativeDepth(file, path.join(SRC_DIR, 'app', 'api'));
      const prefix = '../'.repeat(depth);
      
      const importLine = `import { getUserFromRequest } from '${prefix}lib/auth'\n`;
      const newContent = importLine + content;
      
      fs.writeFileSync(file, newContent);
      log(`✅ 修复 ${path.basename(file)}: 添加缺少的导入`);
      totalFixed++;
    }
  }
  
  return totalFixed;
}

// 重新打包
function repackage() {
  log('重新打包...');
  
  const timestamp = Date.now();
  const packageName = `deploy-auto-${timestamp}.zip`;
  
  try {
    execSync(
      `zip -r ${packageName} Dockerfile src/ prisma/ public/ package.json next.config.js tsconfig.json postcss.config.cjs tailwind.config.ts .env.production`,
      { cwd: PROJECT_ROOT, stdio: 'inherit' }
    );
    
    log(`✅ 新包已创建: ${packageName}`);
    return { success: true, package: packageName };
  } catch (e) {
    log(`❌ 打包失败: ${e.message}`);
    return { success: false };
  }
}

// 主函数
function main() {
  log('========================================');
  log('  部署前预修复工具');
  log('========================================');
  
  let totalFixes = 0;
  
  totalFixes += fixDuplicateVariables();
  totalFixes += fixImportPaths();
  totalFixes += fixMissingImports();
  
  log('');
  
  if (totalFixes > 0) {
    log(`共修复 ${totalFixes} 个文件`);
    const result = repackage();
    
    if (result.success) {
      log('');
      log('========================================');
      log('  ✅ 预修复完成，可以部署了！');
      log(`  📦 部署包: ${result.package}`);
      log('========================================');
    }
  } else {
    log('✅ 没有发现需要修复的问题');
    log('   可以直接部署');
  }
}

main();
