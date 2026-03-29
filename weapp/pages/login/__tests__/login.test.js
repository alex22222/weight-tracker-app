// pages/login/login.test.js - 登录页测试
const path = require('path');

// 加载页面：直接 require 页面 JS 并捕获 Page() 传入的配置对象
const getPage = () => {
  const pagePath = path.resolve(__dirname, '../../login/login.js');

  let capturedOptions;
  const originalPage = global.Page;
  global.Page = (options) => {
    capturedOptions = options;
    return options;
  };

  jest.isolateModules(() => {
    require(pagePath);
  });

  global.Page = originalPage;
  return capturedOptions;
};

describe('登录页 (pages/login)', () => {
  let page;
  let pageInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    pageInstance = getPage();
    page = {
      data: {},
      setData: jest.fn(function(data, callback) {
        Object.assign(this.data, data);
        if (callback) callback();
      }),
      instance: pageInstance
    };
    Object.assign(page, pageInstance);
  });

  afterEach(() => {
    page = null;
  });

  // ==================== 初始化和数据测试 ====================
  describe('初始化', () => {
    test('应该定义正确的初始数据', () => {
      expect(pageInstance.data).toEqual({
        isRegister: false,
        username: '',
        password: '',
        confirmPassword: '',
        isLoading: false,
        error: '',
        canIUseGetUserProfile: false,
        loginType: 'wechat'
      });
    });

    test('应该包含必要的页面方法', () => {
      expect(pageInstance.onLoad).toBeDefined();
      expect(pageInstance.handleWechatLogin).toBeDefined();
      expect(pageInstance.handleWechatLoginSilent).toBeDefined();
      expect(pageInstance.handleSubmit).toBeDefined();
      expect(pageInstance.guestLogin).toBeDefined();
      expect(pageInstance.toggleMode).toBeDefined();
    });
  });

  // ==================== 生命周期测试 ====================
  describe('生命周期', () => {
    test('onLoad 应该检查 getUserProfile 支持', () => {
      page.onLoad();
      expect(page.data.canIUseGetUserProfile).toBe(true);
    });

    test('已登录用户应该自动跳转到首页', () => {
      const app = getApp();
      app.globalData.isLoggedIn = true;

      page.onLoad();

      expect(wx.switchTab).toHaveBeenCalledWith({
        url: '/pages/index/index'
      });

      // 重置状态
      app.globalData.isLoggedIn = false;
    });
  });

  // ==================== 登录方式切换 ====================
  describe('登录方式切换', () => {
    test('switchLoginType 应该切换登录方式', () => {
      page.switchLoginType({
        currentTarget: { dataset: { type: 'account' } }
      });
      
      expect(page.data.loginType).toBe('account');
      expect(page.data.error).toBe('');
    });

    test('切换登录方式应该清除错误信息', () => {
      page.data.error = '之前的错误';
      
      page.switchLoginType({
        currentTarget: { dataset: { type: 'wechat' } }
      });
      
      expect(page.data.error).toBe('');
    });
  });

  // ==================== 微信登录测试 ====================
  describe('微信登录 (handleWechatLogin)', () => {
    beforeEach(() => {
      wx.login.mockImplementation(({ success }) => {
        success({ code: 'mock_wx_code_123' });
      });
    });

    test('成功登录流程', async () => {
      const app = getApp();
      app.request.mockResolvedValue({
        token: 'mock_token_123',
        user: { id: 1, username: '微信用户', isNewUser: false }
      });

      await page.handleWechatLogin();

      expect(wx.login).toHaveBeenCalled();
      expect(wx.getUserProfile).toHaveBeenCalled();
      expect(app.request).toHaveBeenCalledWith({
        url: '/auth/wechat-login',
        method: 'POST',
        data: expect.objectContaining({
          code: 'mock_wx_code_123',
          userInfo: expect.any(Object)
        }),
        needAuth: false
      });
      expect(app.login).toHaveBeenCalled();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '登录成功',
        icon: 'success'
      });
    });

    test('新用户注册成功', async () => {
      const app = getApp();
      app.request.mockResolvedValue({
        token: 'mock_token_123',
        user: { id: 1, username: '新用户', isNewUser: true }
      });

      await page.handleWechatLogin();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '注册成功',
        icon: 'success'
      });
    });

    test('用户拒绝授权也应该继续登录', async () => {
      wx.getUserProfile.mockImplementation(({ fail }) => {
        fail({ errMsg: 'getUserProfile:fail auth deny' });
      });

      const app = getApp();
      app.request.mockResolvedValue({
        token: 'mock_token',
        user: { id: 1, username: '用户' }
      });

      await page.handleWechatLogin();

      expect(app.request).toHaveBeenCalled();
    });

    test('获取 code 失败应该显示错误', async () => {
      wx.login.mockImplementationOnce(({ fail }) => {
        fail({ errMsg: 'login:fail' });
      });

      await page.handleWechatLogin();

      expect(page.data.error).toBe('微信登录失败，请重试');
      expect(page.data.isLoading).toBe(false);
    });

    test('后端返回错误应该显示错误信息', async () => {
      const app = getApp();
      app.request.mockRejectedValue({ message: '服务器错误' });

      await page.handleWechatLogin();

      expect(page.data.error).toBe('服务器错误');
      expect(page.data.isLoading).toBe(false);
    });

    test('无返回 code 应该报错', async () => {
      wx.login.mockImplementationOnce(({ success }) => {
        success({ code: '' });
      });

      await page.handleWechatLogin();

      expect(page.data.error).toContain('登录凭证');
    });
  });

  // ==================== 静默微信登录测试 ====================
  describe('静默微信登录 (handleWechatLoginSilent)', () => {
    test('应该使用 code 直接登录', async () => {
      const app = getApp();
      app.request.mockResolvedValue({
        token: 'mock_token',
        user: { id: 1, username: '用户' }
      });

      await page.handleWechatLoginSilent();

      expect(app.request).toHaveBeenCalledWith({
        url: '/auth/wechat-login',
        method: 'POST',
        data: { code: 'mock_wx_code_123' },
        needAuth: false
      });
    });
  });

  // ==================== 输入处理测试 ====================
  describe('输入处理', () => {
    test('onUsernameInput 应该更新用户名并清除错误', () => {
      page.data.error = '错误信息';
      
      page.onUsernameInput({ detail: { value: 'testuser' } });
      
      expect(page.data.username).toBe('testuser');
      expect(page.data.error).toBe('');
    });

    test('onPasswordInput 应该更新密码并清除错误', () => {
      page.onPasswordInput({ detail: { value: 'password123' } });
      
      expect(page.data.password).toBe('password123');
      expect(page.data.error).toBe('');
    });

    test('onConfirmPasswordInput 应该更新确认密码', () => {
      page.onConfirmPasswordInput({ detail: { value: 'password123' } });
      
      expect(page.data.confirmPassword).toBe('password123');
    });
  });

  // ==================== 登录/注册模式切换 ====================
  describe('登录/注册模式切换', () => {
    test('toggleMode 应该切换注册模式', () => {
      expect(page.data.isRegister).toBe(false);
      
      page.toggleMode();
      
      expect(page.data.isRegister).toBe(true);
      expect(page.data.error).toBe('');
      expect(page.data.password).toBe('');
      expect(page.data.confirmPassword).toBe('');
    });

    test('再次切换应该回到登录模式', () => {
      page.toggleMode();
      page.toggleMode();
      
      expect(page.data.isRegister).toBe(false);
    });
  });

  // ==================== 账号密码登录/注册测试 ====================
  describe('账号密码登录/注册 (handleSubmit)', () => {
    beforeEach(() => {
      page.data.username = 'testuser';
      page.data.password = 'password123';
    });

    test('空用户名应该显示错误', async () => {
      page.data.username = '';
      
      await page.handleSubmit();
      
      expect(page.data.error).toBe('请填写用户名和密码');
    });

    test('空密码应该显示错误', async () => {
      page.data.password = '';
      
      await page.handleSubmit();
      
      expect(page.data.error).toBe('请填写用户名和密码');
    });

    test('用户名过短应该显示错误', async () => {
      page.data.username = 'ab';
      
      await page.handleSubmit();
      
      expect(page.data.error).toBe('用户名长度应为3-20个字符');
    });

    test('用户名过长应该显示错误', async () => {
      page.data.username = 'a'.repeat(21);
      
      await page.handleSubmit();
      
      expect(page.data.error).toBe('用户名长度应为3-20个字符');
    });

    test('密码过短应该显示错误', async () => {
      page.data.password = '12345';
      
      await page.handleSubmit();
      
      expect(page.data.error).toBe('密码长度至少6个字符');
    });

    describe('注册流程', () => {
      beforeEach(() => {
        page.data.isRegister = true;
        page.data.confirmPassword = 'password123';
      });

      test('密码不匹配应该显示错误', async () => {
        page.data.confirmPassword = 'different';
        
        await page.handleSubmit();
        
        expect(page.data.error).toBe('两次输入的密码不一致');
      });

      test('成功注册', async () => {
        const app = getApp();
        app.request.mockResolvedValue({
          token: 'mock_token',
          user: { id: 1, username: 'testuser' }
        });

        await page.handleSubmit();

        expect(app.request).toHaveBeenCalledWith({
          url: '/auth/register',
          method: 'POST',
          data: { username: 'testuser', password: 'password123' },
          needAuth: false
        });
        expect(app.login).toHaveBeenCalled();
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '注册成功',
          icon: 'success'
        });
      });

      test('注册失败应该显示错误', async () => {
        const app = getApp();
        app.request.mockRejectedValue({ message: '用户名已存在' });

        await page.handleSubmit();

        expect(page.data.error).toBe('用户名已存在');
        expect(page.data.isLoading).toBe(false);
      });
    });

    describe('登录流程', () => {
      test('成功登录', async () => {
        const app = getApp();
        app.request.mockResolvedValue({
          token: 'mock_token',
          user: { id: 1, username: 'testuser' }
        });

        await page.handleSubmit();

        expect(app.request).toHaveBeenCalledWith({
          url: '/auth/login',
          method: 'POST',
          data: { username: 'testuser', password: 'password123' },
          needAuth: false
        });
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '登录成功',
          icon: 'success'
        });
      });

      test('登录失败应该显示错误', async () => {
        const app = getApp();
        app.request.mockRejectedValue({ message: '密码错误' });

        await page.handleSubmit();

        expect(page.data.error).toBe('密码错误');
        expect(page.data.isLoading).toBe(false);
      });
    });
  });

  // ==================== 游客登录测试 ====================
  describe('游客登录 (guestLogin)', () => {
    test('成功游客登录', async () => {
      const app = getApp();
      app.request.mockResolvedValue({
        token: 'guest_token',
        user: { id: 999, username: '游客', isGuest: true }
      });

      await page.guestLogin();

      expect(app.request).toHaveBeenCalledWith({
        url: '/auth/guest',
        method: 'POST',
        needAuth: false
      });
      expect(app.login).toHaveBeenCalled();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '游客登录成功',
        icon: 'success'
      });
    });

    test('游客登录失败应该显示错误', async () => {
      const app = getApp();
      app.request.mockRejectedValue({ message: '服务不可用' });

      await page.guestLogin();

      expect(page.data.error).toBe('服务不可用');
      expect(page.data.isLoading).toBe(false);
    });
  });

  // ==================== 集成测试 ====================
  describe('登录流程集成', () => {
    test('完整的账号注册到登录流程', async () => {
      const app = getApp();
      
      // 1. 切换到注册模式
      page.toggleMode();
      expect(page.data.isRegister).toBe(true);

      // 2. 填写注册信息
      page.onUsernameInput({ detail: { value: 'newuser' } });
      page.onPasswordInput({ detail: { value: 'password123' } });
      page.onConfirmPasswordInput({ detail: { value: 'password123' } });

      // 3. 模拟注册成功
      app.request.mockResolvedValue({
        token: 'new_token',
        user: { id: 1, username: 'newuser' }
      });

      await page.handleSubmit();

      expect(app.login).toHaveBeenCalledWith('new_token', expect.any(Object));
    });

    test('微信登录完整流程', async () => {
      const app = getApp();
      
      // 模拟微信登录
      wx.login.mockImplementation(({ success }) => {
        success({ code: 'wx_code_abc123' });
      });
      
      wx.getUserProfile.mockImplementation(({ success }) => {
        success({
          userInfo: {
            nickName: '微信用户',
            avatarUrl: 'https://example.com/avatar.png'
          }
        });
      });

      app.request.mockResolvedValue({
        token: 'wx_token',
        user: { id: 1, username: '微信用户', isNewUser: false }
      });

      await page.handleWechatLogin();

      // 验证登录流程
      expect(wx.login).toHaveBeenCalled();
      expect(wx.getUserProfile).toHaveBeenCalled();
      expect(app.request).toHaveBeenCalledWith(expect.objectContaining({
        url: '/auth/wechat-login'
      }));
      expect(app.login).toHaveBeenCalled();
    });
  });
});
