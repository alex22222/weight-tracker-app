const fs = require('fs');

// 读取文件
const content = fs.readFileSync('database_export-weight-tracker-1ghr085dd7d6cff2-users.json', 'utf8');

// 按行分割并解析每一行
const lines = content.trim().split('\n');
const data = lines.map(line => {
  try {
    return JSON.parse(line);
  } catch (e) {
    console.log('解析失败的行:', line);
    return null;
  }
}).filter(item => item !== null);

// 保存为标准 JSON 数组
fs.writeFileSync('users_fixed.json', JSON.stringify(data, null, 2));
console.log(`转换完成，共 ${data.length} 条记录`);
