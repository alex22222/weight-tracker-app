// 直接使用 Next.js 内部函数测试
const path = require('path');
const { pathToFileURL } = require('url');

function _interop_require_default(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const _findup = _interop_require_default(require("next/dist/compiled/find-up"));
const { CONFIG_FILES } = require('next/dist/shared/lib/constants');
const { normalizeConfig, defaultConfig } = require('next/dist/server/config-shared');

async function test() {
  const dir = '/Users/henry/projects/weight-tracker-app/wechat-miniprogram';
  
  // 完全模拟 Next.js 的 loadConfig 流程
  const configPath = await _findup.default(CONFIG_FILES, { cwd: dir });
  console.log('configPath:', configPath);
  
  if (configPath) {
    const configFileName = path.basename(configPath);
    console.log('configFileName:', configFileName);
    
    let userConfigModule;
    if (process.env.__NEXT_TEST_MODE === "jest") {
      userConfigModule = require(configPath);
    } else {
      userConfigModule = await import(pathToFileURL(configPath).href);
    }
    
    console.log('userConfigModule:', userConfigModule);
    console.log('userConfigModule.default:', userConfigModule.default);
    
    const userConfig = await normalizeConfig('phase-production-build', userConfigModule.default || userConfigModule);
    console.log('userConfig:', userConfig);
    
    // 模拟 assignDefaults
    const config = Object.keys(userConfig).reduce((currentConfig, key) => {
      const value = userConfig[key];
      if (value === undefined || value === null) {
        return currentConfig;
      }
      if (!!value && value.constructor === Object) {
        currentConfig[key] = {
          ...defaultConfig[key],
          ...Object.keys(value).reduce((c, k) => {
            const v = value[k];
            if (v !== undefined && v !== null) {
              c[k] = v;
            }
            return c;
          }, {})
        };
      } else {
        currentConfig[key] = value;
      }
      return currentConfig;
    }, {});
    
    console.log('config:', config);
    
    const result = {
      ...defaultConfig,
      ...config
    };
    
    console.log('result.generateBuildId:', typeof result.generateBuildId, result.generateBuildId);
    console.log('result.configFileName:', result.configFileName);
  }
}

test().catch(console.error);
