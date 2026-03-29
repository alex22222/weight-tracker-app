// pages/index/index.test.js - 首页/记录页测试
const path = require('path');
const util = require('../../../utils/util.js');

// 加载页面：直接 require 页面 JS 并捕获 Page() 传入的配置对象
const getPage = () => {
  const pagePath = path.resolve(__dirname, '../../index/index.js');

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

describe('首页/记录页 (pages/index)', () => {
  let page;
  let pageInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    const pageConstructor = getPage();
    pageInstance = pageConstructor;
    page = {
      data: {},
      setData: jest.fn(function(data, callback) {
        Object.assign(this.data, data);
        if (callback) callback();
      }),
      instance: pageInstance
    };
    // 继承页面方法
    Object.assign(page, pageInstance);
  });

  afterEach(() => {
    page = null;
    pageInstance = null;
  });

  // ==================== 初始化和数据测试 ====================
  describe('初始化', () => {
    test('应该定义页面数据结构', () => {
      expect(pageInstance.data).toBeDefined();
      expect(pageInstance.data.isLoading).toBe(false);
      expect(pageInstance.data.weight).toBe('');
      expect(pageInstance.data.note).toBe('');
      expect(pageInstance.data.entries).toEqual([]);
    });

    test('应该包含必要的页面方法', () => {
      expect(pageInstance.onLoad).toBeDefined();
      expect(pageInstance.onShow).toBeDefined();
      expect(pageInstance.loadData).toBeDefined();
      expect(pageInstance.addEntry).toBeDefined();
      expect(pageInstance.saveSettings).toBeDefined();
    });

    test('应该有正确的默认设置', () => {
      expect(pageInstance.data.settings).toEqual({
        height: 170,
        targetWeight: 65
      });
      expect(pageInstance.data.gender).toBe('other');
    });

    test('应该有 BMI 相关的初始数据', () => {
      expect(pageInstance.data.bmi).toBe(0);
      expect(pageInstance.data.currentWeight).toBe(0);
      expect(pageInstance.data.bmiCategory).toEqual({
        label: '暂无数据',
        color: '#94a3b8'
      });
    });
  });

  // ==================== 生命周期测试 ====================
  describe('生命周期', () => {
    test('onLoad 应该初始化日期和用户信息', () => {
      const app = getApp();
      page.onLoad();

      expect(page.data.date).toBe(util.getTodayString());
      expect(page.data.userInfo).toEqual(app.globalData.userInfo);
    });

    test('onShow 应该加载数据', async () => {
      const loadDataSpy = jest.spyOn(page, 'loadData');
      const loadActiveChannelSpy = jest.spyOn(page, 'loadActiveChannel');
      const loadWeatherSpy = jest.spyOn(page, 'loadWeather');

      await page.onShow();

      expect(loadDataSpy).toHaveBeenCalled();
      expect(loadActiveChannelSpy).toHaveBeenCalled();
      expect(loadWeatherSpy).toHaveBeenCalled();
    });
  });

  // ==================== 输入处理测试 ====================
  describe('输入处理', () => {
    test('onWeightInput 应该更新体重值', () => {
      page.onWeightInput({ detail: { value: '70.5' } });
      expect(page.data.weight).toBe('70.5');
    });

    test('onNoteInput 应该更新备注', () => {
      page.onNoteInput({ detail: { value: '早晨空腹称重' } });
      expect(page.data.note).toBe('早晨空腹称重');
    });

    test('onDateChange 应该更新日期', () => {
      page.onDateChange({ detail: { value: '2024-03-15' } });
      expect(page.data.date).toBe('2024-03-15');
    });

    test('onHeightInput 应该更新临时身高', () => {
      page.onHeightInput({ detail: { value: '175' } });
      expect(page.data.tempHeight).toBe('175');
    });

    test('onTargetWeightInput 应该更新临时目标体重', () => {
      page.onTargetWeightInput({ detail: { value: '68' } });
      expect(page.data.tempTargetWeight).toBe('68');
    });

    test('onGenderChange 应该更新性别', () => {
      // 男性
      page.onGenderChange({ detail: { value: 0 } });
      expect(page.data.tempGender).toBe('male');

      // 女性
      page.onGenderChange({ detail: { value: 1 } });
      expect(page.data.tempGender).toBe('female');

      // 其他
      page.onGenderChange({ detail: { value: 2 } });
      expect(page.data.tempGender).toBe('other');
    });
  });

  // ==================== 设置面板测试 ====================
  describe('设置面板', () => {
    test('toggleSettings 应该切换设置面板显示', () => {
      expect(page.data.showSettings).toBe(false);
      
      page.toggleSettings();
      expect(page.data.showSettings).toBe(true);
      
      page.toggleSettings();
      expect(page.data.showSettings).toBe(false);
    });

    test('openSettings 应该打开设置面板', () => {
      page.openSettings();
      expect(page.data.showSettings).toBe(true);
    });
  });

  // ==================== 体重记录测试 ====================
  describe('体重记录 (addEntry)', () => {
    beforeEach(() => {
      page.data.weight = '70.5';
      page.data.note = '测试备注';
      page.data.date = '2024-03-15';
    });

    test('应该验证有效的体重值', async () => {
      const app = getApp();
      app.request.mockResolvedValueOnce({});

      await page.addEntry();

      expect(app.request).toHaveBeenCalledWith({
        url: '/weight',
        method: 'POST',
        data: {
          weight: 70.5,
          note: '测试备注',
          date: '2024-03-15'
        }
      });
    });

    test('无效体重应该显示错误提示', async () => {
      page.data.weight = '';
      await page.addEntry();
      
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入有效的体重值',
        icon: 'none'
      });
    });

    test('负数体重应该显示错误提示', async () => {
      page.data.weight = '-10';
      await page.addEntry();
      
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入有效的体重值',
        icon: 'none'
      });
    });

    test('过大的体重应该显示错误提示', async () => {
      page.data.weight = '600';
      await page.addEntry();
      
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入有效的体重值',
        icon: 'none'
      });
    });

    test('成功记录后应该清空表单并刷新数据', async () => {
      const app = getApp();
      app.request.mockResolvedValueOnce({});
      const loadDataSpy = jest.spyOn(page, 'loadData');

      await page.addEntry();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '记录成功',
        icon: 'success'
      });
      expect(page.data.weight).toBe('');
      expect(page.data.note).toBe('');
      expect(loadDataSpy).toHaveBeenCalled();
    });

    test('记录失败应该显示错误', async () => {
      const app = getApp();
      app.request.mockRejectedValueOnce({ message: '网络错误' });

      await page.addEntry();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '网络错误',
        icon: 'none'
      });
      expect(page.data.isLoading).toBe(false);
    });
  });

  // ==================== 设置保存测试 ====================
  describe('设置保存 (saveSettings)', () => {
    test('应该验证有效的身高和目标体重', async () => {
      page.data.tempHeight = '175';
      page.data.tempTargetWeight = '68';
      page.data.tempGender = 'male';

      const app = getApp();
      app.request.mockResolvedValue({});

      await page.saveSettings();

      expect(app.request).toHaveBeenCalledWith({
        url: '/settings',
        method: 'POST',
        data: { height: 175, targetWeight: 68 }
      });
      expect(app.request).toHaveBeenCalledWith({
        url: '/settings',
        method: 'PATCH',
        data: { gender: 'male' }
      });
    });

    test('无效身高应该显示错误', async () => {
      page.data.tempHeight = '';
      page.data.tempTargetWeight = '68';

      await page.saveSettings();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入有效的数值',
        icon: 'none'
      });
    });

    test('成功保存后应该关闭面板并刷新数据', async () => {
      page.data.tempHeight = '175';
      page.data.tempTargetWeight = '68';

      const app = getApp();
      app.request.mockResolvedValue({});
      const loadDataSpy = jest.spyOn(page, 'loadData');

      await page.saveSettings();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '设置已保存',
        icon: 'success'
      });
      expect(page.data.showSettings).toBe(false);
      expect(loadDataSpy).toHaveBeenCalled();
    });
  });

  // ==================== 数据加载测试 ====================
  describe('数据加载', () => {
    test('loadData 应该获取体重记录和设置', async () => {
      const app = getApp();
      
      await page.loadData();

      expect(app.request).toHaveBeenCalledWith({ url: '/weight' });
      expect(app.request).toHaveBeenCalledWith({ url: '/settings' });
    });

    test('loadActiveChannel 应该获取活跃的打卡频道', async () => {
      const app = getApp();
      
      await page.loadActiveChannel();

      expect(app.request).toHaveBeenCalledWith({ url: '/channels' });
    });

    test('loadWeather 应该获取天气信息', async () => {
      const app = getApp();
      
      await page.loadWeather();

      expect(app.request).toHaveBeenCalledWith({ url: '/weather' });
    });
  });

  // ==================== 导航测试 ====================
  describe('导航', () => {
    test('goToChannel 在有活跃频道时应该跳转到详情', () => {
      page.data.activeChannel = { id: 123, name: '测试频道' };
      
      page.goToChannel();

      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/channel/detail?id=123'
      });
    });

    test('goToChannel 在没有活跃频道时应该跳转到频道列表', () => {
      page.data.activeChannel = null;
      
      page.goToChannel();

      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/channel/channel'
      });
    });

    test('logout 应该显示确认对话框', () => {
      page.logout();

      expect(wx.showModal).toHaveBeenCalledWith({
        title: '确认登出',
        content: '确定要退出登录吗？',
        success: expect.any(Function)
      });
    });

    test('确认登出应该执行登出操作', () => {
      const app = getApp();
      
      page.logout();
      
      // 获取 showModal 的 success 回调并调用
      const modalCall = wx.showModal.mock.calls[0][0];
      modalCall.success({ confirm: true });

      expect(app.logout).toHaveBeenCalled();
      expect(wx.reLaunch).toHaveBeenCalledWith({
        url: '/pages/login/login'
      });
    });
  });

  // ==================== 分享测试 ====================
  describe('分享', () => {
    test('onShareAppMessage 应该返回正确的分享配置', () => {
      page.data.userInfo = { username: '测试用户' };
      
      const shareConfig = page.onShareAppMessage();

      expect(shareConfig.title).toContain('测试用户');
      expect(shareConfig.title).toContain('邀请你一起记录体重');
      expect(shareConfig.path).toBe('/pages/login/login');
    });

    test('onShareTimeline 应该返回正确的时间线分享配置', () => {
      page.data.userInfo = { username: '测试用户' };
      
      const shareConfig = page.onShareTimeline();

      expect(shareConfig.title).toContain('测试用户');
      expect(shareConfig.title).toContain('体重管理器');
      expect(shareConfig.query).toBe('from=timeline');
    });

    test('匿名用户分享应该使用默认名称', () => {
      page.data.userInfo = null;
      
      const shareConfig = page.onShareAppMessage();

      expect(shareConfig.title).toContain('好友');
    });
  });

  // ==================== BMI 计算集成测试 ====================
  describe('BMI 计算集成', () => {
    test('应该正确计算和显示 BMI', async () => {
      const app = getApp();
      app.request.mockImplementation(({ url }) => {
        if (url === '/weight') {
          return Promise.resolve({
            entries: [{ weight: 72.5, date: '2024-03-15' }]
          });
        }
        if (url === '/settings') {
          return Promise.resolve({
            settings: { height: 175, targetWeight: 70 },
            user: { gender: 'male' }
          });
        }
      });

      await page.loadData();

      // 验证 BMI 计算
      const expectedBMI = util.calculateBMI(72.5, 175);
      expect(page.data.bmi).toBeCloseTo(expectedBMI, 1);
      
      // 验证 BMI 分类
      expect(page.data.bmiCategory).toBeDefined();
      expect(page.data.bmiCategory.label).toBe('正常');
      
      // 验证体重差值
      expect(page.data.weightDiff).toBeCloseTo(2.5, 1); // 72.5 - 70
    });
  });
});
