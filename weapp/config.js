// 配置文件
// 本地开发时使用: http://localhost:3000/api
// 生产环境使用: https://api.yourdomain.com/api（自定义域名）

const isDevelopment = false  // 生产环境

// 域名配置（备案通过后切换）
const useCustomDomain = false  // ← 改为 true 启用自定义域名

const config = {
  // API 基础地址
  apiBaseUrl: isDevelopment 
    ? 'http://localhost:3000/api'  // 本地开发
    : useCustomDomain 
      ? 'https://spaceflag.site/api'      // 自定义域名（备案通过后启用）
      : 'https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com/api',  // 测试域名
  
  // 请求超时时间（毫秒）- 增加到30秒避免网络慢导致超时
  timeout: 30000,
  
  // 版本号
  version: '1.0.0'
}

module.exports = config
