// pages/channel/channel.test.js - 频道列表页测试
const path = require('path');
const util = require('../../../utils/util.js');

// 加载页面：直接 require 页面 JS 并捕获 Page() 传入的配置对象
const getPage = () => {
  const pagePath = path.resolve(__dirname, '../../channel/channel.js');

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

describe('频道列表页 (pages/channel/channel)', () => {
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
      expect(pageInstance.data.channels).toEqual([]);
      expect(pageInstance.data.activeChannel).toBeNull();
      expect(pageInstance.data.showCreateModal).toBe(false);
      expect(pageInstance.data.isLoading).toBe(false);
      expect(pageInstance.data.formData.weeklyCheckInCount).toBe(3);
      expect(pageInstance.data.formData.checkInMinutes).toBe(30);
      expect(pageInstance.data.formData.maxLeaveDays).toBe(3);
    });

    test('应该包含必要的页面方法', () => {
      expect(pageInstance.onLoad).toBeDefined();
      expect(pageInstance.onShow).toBeDefined();
      expect(pageInstance.loadChannels).toBeDefined();
      expect(pageInstance.showCreateModal).toBeDefined();
      expect(pageInstance.hideCreateModal).toBeDefined();
      expect(pageInstance.createChannel).toBeDefined();
      expect(pageInstance.goToDetail).toBeDefined();
      expect(pageInstance.onPullDownRefresh).toBeDefined();
    });

    test('onLoad 应该初始化日期', () => {
      page.onLoad();
      expect(page.data['formData.startDate']).toBe(util.getTodayString());
      expect(page.data['formData.endDate']).toBeDefined();
    });

    test('onShow 应该加载频道列表', () => {
      const loadChannelsSpy = jest.spyOn(page, 'loadChannels');
      page.onShow();
      expect(loadChannelsSpy).toHaveBeenCalled();
    });
  });

  // ==================== 频道加载测试 ====================
  describe('loadChannels', () => {
    test('应该加载并设置频道列表', async () => {
      const app = getApp();
      app.request.mockResolvedValue({
        channels: [
          { id: 1, name: '减脂群', status: 'ACTIVE' },
          { id: 2, name: '增肌群', status: 'COMPLETED' }
        ]
      });

      await page.loadChannels();

      expect(app.request).toHaveBeenCalledWith({ url: '/channels' });
      expect(page.data.channels).toHaveLength(2);
      expect(page.data.activeChannel).toEqual({ id: 1, name: '减脂群', status: 'ACTIVE' });
    });

    test('加载失败应该显示错误提示', async () => {
      const app = getApp();
      app.request.mockRejectedValue(new Error('网络错误'));

      await page.loadChannels();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '加载失败',
        icon: 'none'
      });
    });
  });

  // ==================== 创建弹窗测试 ====================
  describe('创建弹窗', () => {
    test('showCreateModal 在没有活跃频道时直接显示弹窗', () => {
      page.data.activeChannel = null;
      page.showCreateModal();
      expect(page.data.showCreateModal).toBe(true);
    });

    test('showCreateModal 在有活跃频道时显示确认对话框', () => {
      page.data.activeChannel = { id: 1, name: '减脂群', status: 'ACTIVE' };
      wx.showModal.mockImplementationOnce(({ success }) => {
        // 首次调用时不自动确认，模拟用户看到对话框
      });
      page.showCreateModal();
      expect(wx.showModal).toHaveBeenCalled();
      expect(page.data.showCreateModal).toBe(false);
    });

    test('showCreateModal 确认后应该显示弹窗', () => {
      page.data.activeChannel = { id: 1, name: '减脂群', status: 'ACTIVE' };
      page.showCreateModal();
      const modalCall = wx.showModal.mock.calls[0][0];
      modalCall.success({ confirm: true });
      expect(page.data.showCreateModal).toBe(true);
    });

    test('hideCreateModal 应该隐藏弹窗', () => {
      page.data.showCreateModal = true;
      page.hideCreateModal();
      expect(page.data.showCreateModal).toBe(false);
    });
  });

  // ==================== 表单输入测试 ====================
  describe('表单输入', () => {
    test('onNameInput 应该更新名称', () => {
      page.onNameInput({ detail: { value: '减脂打卡' } });
      expect(page.data['formData.name']).toBe('减脂打卡');
    });

    test('onDescriptionInput 应该更新描述', () => {
      page.onDescriptionInput({ detail: { value: '一起减脂' } });
      expect(page.data['formData.description']).toBe('一起减脂');
    });

    test('onStartDateChange 应该更新开始日期', () => {
      page.onStartDateChange({ detail: { value: '2024-04-01' } });
      expect(page.data['formData.startDate']).toBe('2024-04-01');
    });

    test('onEndDateChange 应该更新结束日期', () => {
      page.onEndDateChange({ detail: { value: '2024-05-01' } });
      expect(page.data['formData.endDate']).toBe('2024-05-01');
    });

    test('onWeeklyCountChange 应该更新每周打卡次数', () => {
      page.onWeeklyCountChange({ detail: { value: 2 } });
      expect(page.data['formData.weeklyCheckInCount']).toBe(3);
    });

    test('onMinutesChange 应该更新打卡时长', () => {
      page.onMinutesChange({ detail: { value: 3 } });
      expect(page.data['formData.checkInMinutes']).toBe(60);
    });

    test('onMaxLeaveDaysChange 应该更新最大请假天数', () => {
      page.onMaxLeaveDaysChange({ detail: { value: 4 } });
      expect(page.data['formData.maxLeaveDays']).toBe(5);
    });
  });

  // ==================== 创建频道测试 ====================
  describe('createChannel', () => {
    test('空名称应该显示错误提示', async () => {
      page.data.formData.name = '   ';
      await page.createChannel();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入频道名称',
        icon: 'none'
      });
    });

    test('成功创建后应该隐藏弹窗并刷新列表', async () => {
      const app = getApp();
      app.request.mockResolvedValue({ id: 1 });
      page.data.formData = {
        name: '减脂群',
        description: '一起减脂',
        startDate: '2024-04-01',
        endDate: '2024-05-01',
        weeklyCheckInCount: 3,
        checkInMinutes: 30,
        maxLeaveDays: 3
      };
      const loadChannelsSpy = jest.spyOn(page, 'loadChannels');

      await page.createChannel();

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels',
        method: 'POST',
        data: {
          name: '减脂群',
          description: '一起减脂',
          startDate: '2024-04-01',
          endDate: '2024-05-01',
          weeklyCheckInCount: 3,
          checkInMinutes: 30,
          maxLeaveDays: 3
        }
      });
      expect(page.data.showCreateModal).toBe(false);
      expect(page.data['formData.name']).toBe('');
      expect(loadChannelsSpy).toHaveBeenCalled();
    });

    test('创建失败应该显示错误提示', async () => {
      const app = getApp();
      app.request.mockRejectedValue({ message: '名称已存在' });
      page.data.formData.name = '减脂群';

      await page.createChannel();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '名称已存在',
        icon: 'none'
      });
      expect(page.data.isLoading).toBe(false);
    });
  });

  // ==================== 导航测试 ====================
  describe('goToDetail', () => {
    test('应该跳转到频道详情', () => {
      page.goToDetail({ currentTarget: { dataset: { id: 123 } } });
      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/channel/detail?id=123'
      });
    });
  });

  // ==================== 工具方法测试 ====================
  describe('工具方法', () => {
    test('getStatusText 应该返回正确文本', () => {
      expect(page.getStatusText('PENDING')).toBe('未开始');
      expect(page.getStatusText('ACTIVE')).toBe('进行中');
      expect(page.getStatusText('COMPLETED')).toBe('已结束');
      expect(page.getStatusText('UNKNOWN')).toBe('UNKNOWN');
    });

    test('getStatusColor 应该返回正确颜色', () => {
      expect(page.getStatusColor('PENDING')).toBe('#f59e0b');
      expect(page.getStatusColor('ACTIVE')).toBe('#10b981');
      expect(page.getStatusColor('COMPLETED')).toBe('#94a3b8');
      expect(page.getStatusColor('UNKNOWN')).toBe('#94a3b8');
    });
  });

  // ==================== 下拉刷新测试 ====================
  describe('onPullDownRefresh', () => {
    test('应该加载频道并停止刷新', async () => {
      const loadChannelsSpy = jest.spyOn(page, 'loadChannels');
      await page.onPullDownRefresh();
      expect(loadChannelsSpy).toHaveBeenCalled();
      expect(wx.stopPullDownRefresh).toHaveBeenCalled();
    });
  });
});
