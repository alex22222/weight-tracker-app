const fs = require('fs');

// 读取文件（自动处理 BOM）
let content = fs.readFileSync('database_export-weight-tracker-1ghr085dd7d6cff2-users.json', 'utf8');

// 移除 BOM
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// 检查是否是 JSON Lines 格式（每行一个对象）
const lines = content.trim().split('\n').filter(line => line.trim());

// 尝试解析第一行
let isJsonLines = false;
try {
  JSON.parse(lines[0]);
  isJsonLines = true;
} catch (e) {
  isJsonLines = false;
}

if (isJsonLines && lines.length > 1) {
  // 转换为标准 JSON 数组
  const data = lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (e) {
      console.error(`第 ${index + 1} 行解析失败:`, line.substring(0, 100));
      return null;
    }
  }).filter(item => item !== null);
  
  fs.writeFileSync('users_fixed.json', JSON.stringify(data, null, 2));
  console.log(`✅ JSON Lines 格式转换完成，共 ${data.length} 条记录`);
} else {
  // 尝试直接格式化
  try {
    const data = JSON.parse(content);
    fs.writeFileSync('users_fixed.json', JSON.stringify(data, null, 2));
    console.log('✅ JSON 格式化完成');
  } catch (e) {
    console.error('❌ 无法解析 JSON:', e.message);
  }
}
