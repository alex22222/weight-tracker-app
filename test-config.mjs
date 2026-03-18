import { pathToFileURL } from 'url';
const path = '/Users/henry/projects/weight-tracker-app/wechat-miniprogram/next.config.mjs';
const userConfigModule = await import(pathToFileURL(path).href);
console.log('userConfigModule:', userConfigModule);
console.log('default:', userConfigModule.default);
console.log('default.generateBuildId:', userConfigModule.default?.generateBuildId);
