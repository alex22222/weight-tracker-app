// 模拟微信小程序 API
const mockStorage = new Map();

global.wx = {
  // 网络请求 - 体重管理小程序特定
  request: jest.fn((options) => {
    console.log('Mock wx.request called:', options.url, options.method || 'GET');
    
    // 模拟体重管理 API 响应
    const mockResponses = {
      '/weight': {
        entries: [
          { id: 1, weight: 70.5, date: '2024-03-25', note: '早晨空腹' },
          { id: 2, weight: 70.2, date: '2024-03-26', note: '' }
        ]
      },
      '/settings': {
        settings: { height: 175, targetWeight: 68 },
        user: { gender: 'male', username: 'testuser' }
      },
      '/channels': {
        channels: [
          { id: 1, name: '减脂打卡群', status: 'ACTIVE' },
          { id: 2, name: '健身交流群', status: 'PENDING' }
        ]
      },
      '/weather': {
        city: '北京',
        temperature: 22,
        condition: '晴',
        aqi: 85
      }
    };

    const path = options.url;
    const method = options.method || 'GET';
    
    setTimeout(() => {
      if (options.success) {
        const response = mockResponses[path] || { data: {} };
        options.success({
          data: response,
          statusCode: 200,
          header: { 'Content-Type': 'application/json' }
        });
      }
      if (options.complete) options.complete();
    }, 10);
  }),

  // 存储
  getStorage: jest.fn(({ key, success, fail }) => {
    const data = mockStorage.get(key);
    if (data !== undefined) {
      if (success) success({ data });
    } else {
      if (fail) fail({ errMsg: 'getStorage:fail data not found' });
    }
  }),
  setStorage: jest.fn(({ key, data, success }) => {
    mockStorage.set(key, data);
    if (success) success();
  }),
  removeStorage: jest.fn(({ key, success }) => {
    mockStorage.delete(key);
    if (success) success();
  }),
  clearStorage: jest.fn(({ success }) => {
    mockStorage.clear();
    if (success) success();
  }),

  // UI 交互
  showToast: jest.fn(({ title, icon, duration, success }) => {
    console.log('Toast:', title, icon || 'none');
    if (success) success();
  }),
  showModal: jest.fn(({ title, content, success }) => {
    console.log('Modal:', title, content);
    if (success) success({ confirm: true, cancel: false });
  }),
  showLoading: jest.fn(({ title }) => {
    console.log('Loading:', title);
  }),
  hideLoading: jest.fn(() => {}),

  // 导航
  navigateTo: jest.fn(({ url, success }) => {
    console.log('Navigate to:', url);
    if (success) success();
  }),
  redirectTo: jest.fn(({ url, success }) => {
    console.log('Redirect to:', url);
    if (success) success();
  }),
  navigateBack: jest.fn(({ delta, success }) => {
    console.log('Navigate back:', delta);
    if (success) success();
  }),
  switchTab: jest.fn(({ url, success }) => {
    console.log('Switch tab:', url);
    if (success) success();
  }),
  reLaunch: jest.fn(({ url, success }) => {
    console.log('ReLaunch:', url);
    if (success) success();
  }),

  // 系统信息
  getSystemInfo: jest.fn(({ success }) => {
    if (success) {
      success({
        model: 'iPhone 14',
        system: 'iOS 16.0',
        version: '8.0.0',
        SDKVersion: '2.30.0',
        screenWidth: 390,
        screenHeight: 844,
        windowWidth: 390,
        windowHeight: 724,
        statusBarHeight: 47,
        language: 'zh_CN',
        platform: 'ios',
        pixelRatio: 3
      });
    }
  }),
  getSystemInfoSync: jest.fn(() => ({
    pixelRatio: 3,
    screenWidth: 390,
    screenHeight: 844
  })),

  // 用户信息
  getUserInfo: jest.fn(({ success }) => {
    if (success) {
      success({
        userInfo: {
          nickName: '测试用户',
          avatarUrl: 'https://example.com/avatar.png',
          gender: 1,
          country: 'China',
          province: 'Beijing',
          city: 'Beijing'
        }
      });
    }
  }),
  getUserProfile: jest.fn(({ success }) => {
    if (success) {
      success({
        userInfo: {
          nickName: '测试用户',
          avatarUrl: 'https://example.com/avatar.png',
          gender: 1
        }
      });
    }
  }),

  // 登录
  login: jest.fn(({ success }) => {
    if (success) {
      success({
        code: 'mock_wx_code_12345',
        errMsg: 'login:ok'
      });
    }
  }),
  checkSession: jest.fn(({ success, fail }) => {
    if (success) success();
  }),

  // 画布
  createSelectorQuery: jest.fn(() => ({
    select: jest.fn(() => ({
      fields: jest.fn((fields, callback) => ({
        exec: jest.fn((cb) => {
          cb([{
            node: {
              getContext: jest.fn(() => ({
                scale: jest.fn(),
                clearRect: jest.fn(),
                beginPath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                stroke: jest.fn(),
                fill: jest.fn(),
                fillText: jest.fn(),
                arc: jest.fn(),
                closePath: jest.fn(),
                createLinearGradient: jest.fn(() => ({
                  addColorStop: jest.fn()
                }))
              }))
            },
            width: 350,
            height: 250
          }]);
        })
      }))
    }))
  })),

  // 下拉刷新
  startPullDownRefresh: jest.fn(({ success }) => {
    if (success) success();
  }),
  stopPullDownRefresh: jest.fn((options) => {
    if (options && options.success) options.success();
  }),

  // 分享
  showShareMenu: jest.fn(({ withShareTicket, success }) => {
    if (success) success();
  }),
  hideShareMenu: jest.fn(() => {}),
  updateShareMenu: jest.fn(({ withShareTicket, success }) => {
    if (success) success();
  }),

  // 其他
  canIUse: jest.fn(() => true),
  scanCode: jest.fn(({ success }) => {
    if (success) {
      success({
        result: 'mock_scan_result',
        scanType: 'QR_CODE'
      });
    }
  }),
  getLocation: jest.fn(({ success }) => {
    if (success) {
      success({
        latitude: 39.9042,
        longitude: 116.4074
      });
    }
  }),
  getLaunchOptionsSync: jest.fn(() => ({
    path: 'pages/index/index',
    query: {},
    scene: 1001
  }))
};

// 全局 App 构造函数模拟
global.App = jest.fn((options) => options);
global.Page = jest.fn((options) => options);
global.Component = jest.fn((options) => options);
global.Behavior = jest.fn((options) => options);

// 模拟 getApp - 使用单例对象，确保页面和测试访问同一个 app 实例
const mockApp = {
  globalData: {
    userInfo: {
      id: 1,
      username: 'testuser',
      avatar: 'https://example.com/avatar.png'
    },
    token: 'mock_token_123',
    isLoggedIn: false
  },
  request: jest.fn(async (options) => {
    return new Promise((resolve) => {
      wx.request({
        ...options,
        success: (res) => resolve(res.data),
        fail: (err) => { throw err; }
      });
    });
  }),
  login: jest.fn((token, user) => {
    mockApp.globalData.token = token;
    mockApp.globalData.userInfo = user;
    mockApp.globalData.isLoggedIn = true;
  }),
  logout: jest.fn(() => {
    mockApp.globalData.token = null;
    mockApp.globalData.userInfo = null;
    mockApp.globalData.isLoggedIn = false;
    console.log('App logout called');
  }),
  updateUserInfo: jest.fn((userInfo) => {
    mockApp.globalData.userInfo = { ...mockApp.globalData.userInfo, ...userInfo };
  })
};
global.getApp = jest.fn(() => mockApp);

global.getCurrentPages = jest.fn(() => []);
