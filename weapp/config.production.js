// 生产环境配置文件
// 域名备案并配置完成后，将此文件内容复制到 config.js

const config = {
  // API 基础地址 - 正式环境（备案通过后启用）
  apiBaseUrl: 'https://api.YOUR_DOMAIN.com/api',
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 版本号
  version: '1.0.0'
}

module.exports = config
