// pages/messages/messages.test.js - 消息页测试
const path = require('path');

// 加载页面：直接 require 页面 JS 并捕获 Page() 传入的配置对象
const getPage = () => {
  const pagePath = path.resolve(__dirname, '../../messages/messages.js');

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

describe('消息页 (pages/messages/messages)', () => {
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
      expect(pageInstance.data.messages).toEqual([]);
      expect(pageInstance.data.unreadCount).toBe(0);
      expect(pageInstance.data.isLoading).toBe(false);
    });

    test('应该包含必要的页面方法', () => {
      expect(pageInstance.onLoad).toBeDefined();
      expect(pageInstance.onShow).toBeDefined();
      expect(pageInstance.loadMessages).toBeDefined();
      expect(pageInstance.markAllAsRead).toBeDefined();
      expect(pageInstance.deleteMessage).toBeDefined();
      expect(pageInstance.handleMessageTap).toBeDefined();
      expect(pageInstance.onPullDownRefresh).toBeDefined();
    });

    test('onLoad 应该加载消息', () => {
      const loadMessagesSpy = jest.spyOn(page, 'loadMessages');
      page.onLoad();
      expect(loadMessagesSpy).toHaveBeenCalled();
    });

    test('onShow 应该加载消息并标记已读', () => {
      const loadMessagesSpy = jest.spyOn(page, 'loadMessages');
      const markAllAsReadSpy = jest.spyOn(page, 'markAllAsRead');
      page.onShow();
      expect(loadMessagesSpy).toHaveBeenCalled();
      expect(markAllAsReadSpy).toHaveBeenCalled();
    });
  });

  // ==================== 加载消息测试 ====================
  describe('loadMessages', () => {
    test('应该加载消息并计算未读数', async () => {
      const app = getApp();
      app.request.mockResolvedValue({
        messages: [
          { id: 1, type: 'SYSTEM_LOGIN', isRead: false },
          { id: 2, type: 'FRIEND_REQUEST', isRead: true },
          { id: 3, type: 'CHANNEL_INVITE', isRead: false }
        ]
      });

      await page.loadMessages();

      expect(app.request).toHaveBeenCalledWith({ url: '/messages' });
      expect(page.data.messages).toHaveLength(3);
      expect(page.data.unreadCount).toBe(2);
    });

    test('加载失败应该显示错误提示', async () => {
      const app = getApp();
      app.request.mockRejectedValue(new Error('网络错误'));

      await page.loadMessages();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '加载失败',
        icon: 'none'
      });
    });
  });

  // ==================== 标记已读测试 ====================
  describe('markAllAsRead', () => {
    test('应该发送标记已读请求', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});

      await page.markAllAsRead();

      expect(app.request).toHaveBeenCalledWith({
        url: '/messages',
        method: 'PATCH',
        data: { action: 'markAllRead' }
      });
    });
  });

  // ==================== 删除消息测试 ====================
  describe('deleteMessage', () => {
    test('确认后应该删除消息并刷新', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      const loadMessagesSpy = jest.spyOn(page, 'loadMessages');

      page.deleteMessage({ currentTarget: { dataset: { id: 1 } } });
      const modalCall = wx.showModal.mock.calls[0][0];
      await modalCall.success({ confirm: true });

      expect(app.request).toHaveBeenCalledWith({
        url: '/messages?id=1',
        method: 'DELETE'
      });
      expect(wx.showToast).toHaveBeenCalledWith({ title: '已删除', icon: 'success' });
      expect(loadMessagesSpy).toHaveBeenCalled();
    });

    test('取消后不应该删除', async () => {
      const app = getApp();
      const loadMessagesSpy = jest.spyOn(page, 'loadMessages');

      // 覆盖默认的自动确认行为，模拟用户取消
      wx.showModal.mockImplementationOnce(({ success }) => {
        if (success) success({ confirm: false, cancel: true });
      });

      page.deleteMessage({ currentTarget: { dataset: { id: 1 } } });

      expect(app.request).not.toHaveBeenCalled();
      expect(loadMessagesSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== 消息点击测试 ====================
  describe('handleMessageTap', () => {
    test('CHANNEL_INVITE 应该跳转到频道详情', () => {
      page.handleMessageTap({
        currentTarget: {
          dataset: {
            message: {
              type: 'CHANNEL_INVITE',
              relatedData: JSON.stringify({ channelId: 123 })
            }
          }
        }
      });
      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/channel/detail?id=123'
      });
    });

    test('FRIEND_REQUEST 应该跳转到好友页', () => {
      page.handleMessageTap({
        currentTarget: {
          dataset: {
            message: { type: 'FRIEND_REQUEST' }
          }
        }
      });
      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/friends/friends'
      });
    });

    test('解析失败不应该抛出异常', () => {
      expect(() => {
        page.handleMessageTap({
          currentTarget: {
            dataset: {
              message: {
                type: 'CHANNEL_INVITE',
                relatedData: 'invalid json'
              }
            }
          }
        });
      }).not.toThrow();
    });
  });

  // ==================== 工具方法测试 ====================
  describe('工具方法', () => {
    test('getMessageIcon 应该返回正确图标', () => {
      expect(page.getMessageIcon('SYSTEM_LOGIN')).toBe('🔔');
      expect(page.getMessageIcon('SYSTEM_PASSWORD')).toBe('🔐');
      expect(page.getMessageIcon('FRIEND_REQUEST')).toBe('👋');
      expect(page.getMessageIcon('FRIEND_ACCEPT')).toBe('✅');
      expect(page.getMessageIcon('FRIEND_REJECT')).toBe('❌');
      expect(page.getMessageIcon('CHANNEL_INVITE')).toBe('🏃');
      expect(page.getMessageIcon('CHANNEL_CHECKIN')).toBe('📸');
      expect(page.getMessageIcon('UNKNOWN')).toBe('📢');
    });

    test('getMessageTypeText 应该返回正确文本', () => {
      expect(page.getMessageTypeText('SYSTEM_LOGIN')).toBe('系统');
      expect(page.getMessageTypeText('SYSTEM_PASSWORD')).toBe('安全');
      expect(page.getMessageTypeText('FRIEND_REQUEST')).toBe('好友');
      expect(page.getMessageTypeText('FRIEND_ACCEPT')).toBe('好友');
      expect(page.getMessageTypeText('FRIEND_REJECT')).toBe('好友');
      expect(page.getMessageTypeText('CHANNEL_INVITE')).toBe('健身');
      expect(page.getMessageTypeText('CHANNEL_CHECKIN')).toBe('打卡');
      expect(page.getMessageTypeText('UNKNOWN')).toBe('消息');
    });
  });

  // ==================== 下拉刷新测试 ====================
  describe('onPullDownRefresh', () => {
    test('应该加载消息并停止刷新', async () => {
      const loadMessagesSpy = jest.spyOn(page, 'loadMessages');
      await page.onPullDownRefresh();
      expect(loadMessagesSpy).toHaveBeenCalled();
      expect(wx.stopPullDownRefresh).toHaveBeenCalled();
    });
  });
});
