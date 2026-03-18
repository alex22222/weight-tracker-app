const path = require('path');
const { pathToFileURL } = require('url');

function _interop_require_default(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const _findup = _interop_require_default(require("next/dist/compiled/find-up"));
const { CONFIG_FILES } = require('next/dist/shared/lib/constants');
const { normalizeConfig } = require('next/dist/server/config-shared');

// 模拟 loadConfig 的完整流程
async function mockLoadConfig(dir) {
  console.log('=== Mock LoadConfig ===');
  
  // 步骤 1: 查找配置文件
  const configPath = await _findup.default(CONFIG_FILES, { cwd: dir });
  console.log('configPath:', configPath);
  
  if (!configPath) {
    console.log('No config file found!');
    return null;
  }
  
  // 步骤 2: 加载配置文件
  const userConfigModule = await import(pathToFileURL(configPath).href);
  console.log('userConfigModule.default:', userConfigModule.default);
  
  // 步骤 3: 归一化配置
  const userConfig = await normalizeConfig('phase-production-build', userConfigModule.default || userConfigModule);
  console.log('userConfig:', userConfig);
  console.log('userConfig.generateBuildId:', typeof userConfig.generateBuildId);
  
  return userConfig;
}

mockLoadConfig('/Users/henry/projects/weight-tracker-app/wechat-miniprogram').catch(console.error);
