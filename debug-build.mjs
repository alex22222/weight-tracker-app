import loadConfig from 'next/dist/server/config.js';
import { PHASE_PRODUCTION_BUILD } from 'next/dist/shared/lib/constants.js';

const config = await loadConfig(PHASE_PRODUCTION_BUILD, '/Users/henry/projects/weight-tracker-app/wechat-miniprogram', { silent: false });
console.log('config type:', typeof config);
console.log('config keys:', Object.keys(config));
console.log('generateBuildId:', typeof config.generateBuildId, config.generateBuildId);
console.log('defaultConfig generateBuildId:', typeof config.defaultConfig?.generateBuildId);
