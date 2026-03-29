# 体重管理小程序测试文档

## 📋 测试概览

本项目使用 **Jest** + **miniprogram-simulate** 进行微信小程序测试。

### 测试覆盖范围

- ✅ **工具函数测试** (`utils/__tests__/util.test.js`)
  - BMI 计算
  - BMI 分类
  - 日期格式化
  - ID 生成

- ✅ **首页测试** (`pages/index/__tests__/index.test.js`)
  - 体重记录
  - 设置管理
  - 数据加载
  - 图表渲染

- ✅ **登录页测试** (`pages/login/__tests__/login.test.js`)
  - 微信登录
  - 账号密码登录
  - 游客登录
  - 表单验证

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
# 或使用 yarn
yarn install
```

### 2. 运行测试

```bash
# 运行所有测试
npm test

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 详细输出
npm run test:verbose
```

## 📁 测试目录结构

```
weapp/
├── test/
│   ├── setup.js              # 测试环境初始化
│   └── mocks/
│       └── wx.js             # 微信小程序 API Mock
├── utils/
│   ├── util.js
│   └── __tests__/
│       └── util.test.js      # 工具函数测试
├── pages/
│   ├── index/
│   │   ├── index.js
│   │   └── __tests__/
│   │       └── index.test.js # 首页测试
│   └── login/
│       ├── login.js
│       └── __tests__/
│           └── login.test.js # 登录页测试
├── jest.config.js            # Jest 配置
└── package.json
```

## 🧪 测试类型说明

### 1. 单元测试 - 工具函数

```javascript
// utils/__tests__/util.test.js
describe('calculateBMI', () => {
  test('应该正确计算标准BMI', () => {
    const bmi = util.calculateBMI(70, 175);
    expect(bmi).toBeCloseTo(22.86, 1);
  });
});
```

### 2. 页面逻辑测试

```javascript
// 测试页面数据和方法
const page = getPage();
page.onLoad();
expect(page.data.date).toBe(util.getTodayString());
```

### 3. 异步 API 测试

```javascript
test('应该加载体重数据', async () => {
  await page.loadData();
  expect(wx.request).toHaveBeenCalledWith({ url: '/weight' });
});
```

### 4. 用户交互测试

```javascript
test('应该验证有效的体重值', async () => {
  page.data.weight = '70.5';
  await page.addEntry();
  expect(wx.showToast).toHaveBeenCalledWith({
    title: '记录成功',
    icon: 'success'
  });
});
```

## 📊 覆盖率报告

运行 `npm run test:coverage` 后会生成覆盖率报告：

```
coverage/
├── lcov-report/
│   └── index.html    # 可视化报告
└── lcov.info         # CI/CD 使用
```

### 当前覆盖率目标

| 指标 | 目标 | 状态 |
|------|------|------|
| 语句覆盖率 | 80% | 🟡 |
| 分支覆盖率 | 80% | 🟡 |
| 函数覆盖率 | 80% | 🟡 |
| 行覆盖率 | 80% | 🟡 |

## 🔧 添加新测试

### 1. 为现有页面添加测试

```bash
# 创建测试目录
mkdir -p pages/channel/__tests__

# 创建测试文件
touch pages/channel/__tests__/channel.test.js
```

### 2. 测试文件模板

```javascript
// pages/channel/__tests__/channel.test.js
describe('打卡频道页', () => {
  let page;
  
  beforeEach(() => {
    // 初始化页面
  });
  
  test('测试描述', () => {
    // 测试代码
  });
});
```

### 3. 模拟 API 响应

```javascript
const app = getApp();
app.request.mockResolvedValue({
  channels: [{ id: 1, name: '减脂群' }]
});
```

## 🐛 常见问题

### 1. 测试超时

```javascript
// 增加超时时间
jest.setTimeout(10000);
```

### 2. Mock 未生效

确保在 `beforeEach` 中调用 `jest.clearAllMocks()`

### 3. 异步测试

```javascript
test('异步测试', async () => {
  await page.loadData();
  await flushPromises(); // 等待所有 Promise 完成
});
```

## 📝 Mock 说明

### 微信 API Mock (`test/mocks/wx.js`)

已预配置以下 Mock：

- `wx.request` - 网络请求
- `wx.login` - 微信登录
- `wx.getUserProfile` - 获取用户信息
- `wx.showToast` / `wx.showModal` - UI 提示
- `wx.navigateTo` / `wx.switchTab` - 页面导航
- `wx.getStorage` / `wx.setStorage` - 本地存储
- `wx.createSelectorQuery` - Canvas 查询

### App Mock

```javascript
const app = getApp();
app.request.mockResolvedValue({ data: {} });
app.login.mockImplementation(() => {});
app.logout.mockImplementation(() => {});
```

## 🎯 测试最佳实践

1. **每个测试只验证一个概念**
2. **使用描述性的测试名称**
3. **遵循 Arrange-Act-Assert 模式**
4. **清理测试后的副作用**
5. **避免测试之间的依赖**

## 🔗 相关链接

- [Jest 官方文档](https://jestjs.io/)
- [miniprogram-simulate](https://github.com/wechat-miniprogram/miniprogram-simulate)
- [微信小程序测试指南](https://developers.weixin.qq.com/miniprogram/dev/framework/)
