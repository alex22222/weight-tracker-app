// 配置文件
// 本地开发时使用: http://localhost:3000/api
// 生产环境使用: https://your-service.sh.run.tcloudbase.com/api

const isDevelopment = true  // 设为 true 切换到本地开发环境

const config = {
  // API 基础地址
  apiBaseUrl: isDevelopment 
    ? 'http://localhost:3000/api'  // 本地开发
    : 'https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com/api',  // 生产环境
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 版本号
  version: '1.0.0'
}

module.exports = config
