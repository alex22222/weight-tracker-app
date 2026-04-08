// 配置文件
// 本地开发时使用: http://localhost:3000/api
// 生产环境使用: https://api.yourdomain.com/api（自定义域名）

const isDevelopment = false  // 生产环境

const config = {
  // API 基础地址
  // 域名备案通过后，替换为: https://spaceflag.site/api
  apiBaseUrl: isDevelopment 
    ? 'http://localhost:3000/api'  // 本地开发
    : 'https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com/api',  // 测试域名，备案通过后替换
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 版本号
  version: '1.0.0'
}

module.exports = config
