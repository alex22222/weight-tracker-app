const loadConfig = require('next/dist/server/config').default;
const { PHASE_PRODUCTION_BUILD } = require('next/dist/shared/lib/constants');

async function main() {
  const config = await loadConfig(PHASE_PRODUCTION_BUILD, '/Users/henry/projects/weight-tracker-app/wechat-miniprogram', { silent: false });
  console.log('configFileName:', config.configFileName);
  console.log('configOrigin:', config.configOrigin);
  console.log('generateBuildId:', typeof config.generateBuildId, config.generateBuildId);
}

main().catch(console.error);
