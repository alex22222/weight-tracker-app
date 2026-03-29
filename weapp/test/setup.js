// 测试环境初始化 - 体重管理小程序
require('./mocks/wx');

// 让 Page 构造函数使用 miniprogram-simulate 的 Component 注册机制
// 这样 simulate.load() 可以正确加载使用 Page() 的页面文件
const simulate = require('miniprogram-simulate');
global.Page = global.Component;

// 设置测试超时
jest.setTimeout(10000);

// 全局测试工具
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
global.mockFlushPromises = () => new Promise(resolve => setImmediate(resolve));

// 重置所有 mocks
beforeEach(() => {
  jest.clearAllMocks();
  // 重置 mockStorage
  if (global.mockStorage) {
    global.mockStorage.clear();
  }
});

// 测试完成后清理
afterAll(() => {
  jest.restoreAllMocks();
});

console.log('✅ 体重管理小程序测试环境已初始化');
