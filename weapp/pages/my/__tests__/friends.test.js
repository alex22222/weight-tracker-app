// pages/my/my.test.js - 我的页面测试
const path = require('path');

// 加载页面：直接 require 页面 JS 并捕获 Page() 传入的配置对象
const getPage = () => {
  const pagePath = path.resolve(__dirname, '../../friends/friends.js');

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

describe('我的页面 (pages/my/my)', () => {
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
      expect(pageInstance.data.friends).toEqual([]);
      expect(pageInstance.data.pendingRequests).toEqual([]);
      expect(pageInstance.data.suggestions).toEqual([]);
      expect(pageInstance.data.showAddModal).toBe(false);
      expect(pageInstance.data.searchUsername).toBe('');
      expect(pageInstance.data.isLoading).toBe(false);
    });

    test('应该包含必要的页面方法', () => {
      expect(pageInstance.onLoad).toBeDefined();
      expect(pageInstance.onShow).toBeDefined();
      expect(pageInstance.loadFriends).toBeDefined();
      expect(pageInstance.loadSuggestions).toBeDefined();
      expect(pageInstance.showAddModal).toBeDefined();
      expect(pageInstance.hideAddModal).toBeDefined();
      expect(pageInstance.addFriend).toBeDefined();
      expect(pageInstance.acceptRequest).toBeDefined();
      expect(pageInstance.rejectRequest).toBeDefined();
      expect(pageInstance.onPullDownRefresh).toBeDefined();
    });

    test('onLoad 应该加载好友和推荐', () => {
      const loadFriendsSpy = jest.spyOn(page, 'loadFriends');
      const loadSuggestionsSpy = jest.spyOn(page, 'loadSuggestions');
      page.onLoad();
      expect(loadFriendsSpy).toHaveBeenCalled();
      expect(loadSuggestionsSpy).toHaveBeenCalled();
    });

    test('onShow 应该加载好友和推荐', () => {
      const loadFriendsSpy = jest.spyOn(page, 'loadFriends');
      const loadSuggestionsSpy = jest.spyOn(page, 'loadSuggestions');
      page.onShow();
      expect(loadFriendsSpy).toHaveBeenCalled();
      expect(loadSuggestionsSpy).toHaveBeenCalled();
    });
  });

  // ==================== 加载推荐测试 ====================
  describe('loadSuggestions', () => {
    test('应该加载推荐用户', async () => {
      const app = getApp();
      app.request.mockResolvedValue({
        suggestions: [{ id: 1, username: 'user1' }]
      });

      await page.loadSuggestions();

      expect(app.request).toHaveBeenCalledWith({ url: '/friends?type=suggestions' });
      expect(page.data.suggestions).toEqual([{ id: 1, username: 'user1' }]);
    });
  });

  // ==================== 快速添加好友测试 ====================
  describe('quickAddFriend', () => {
    test('成功添加后应该从推荐列表移除', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.suggestions = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ];

      await page.quickAddFriend({ currentTarget: { dataset: { username: 'user1' } } });

      expect(app.request).toHaveBeenCalledWith({
        url: '/friends',
        method: 'POST',
        data: { username: 'user1' }
      });
      expect(page.data.suggestions).toEqual([{ id: 2, username: 'user2' }]);
      expect(page.data.isLoading).toBe(false);
    });
  });

  // ==================== 加载好友测试 ====================
  describe('loadFriends', () => {
    test('应该正确分离已接受和待处理请求', async () => {
      const app = getApp();
      app.request.mockResolvedValue({
        friends: [
          { id: 1, status: 'ACCEPTED', username: 'friend1' },
          { id: 2, status: 'PENDING', username: 'friend2' },
          { id: 3, status: 'ACCEPTED', username: 'friend3' }
        ]
      });

      await page.loadFriends();

      expect(app.request).toHaveBeenCalledWith({ url: '/friends' });
      expect(page.data.friends).toHaveLength(2);
      expect(page.data.pendingRequests).toHaveLength(1);
      expect(page.data.pendingRequests[0].username).toBe('friend2');
    });

    test('加载失败应该显示错误提示', async () => {
      const app = getApp();
      app.request.mockRejectedValue(new Error('网络错误'));

      await page.loadFriends();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '加载失败',
        icon: 'none'
      });
    });
  });

  // ==================== 添加好友弹窗测试 ====================
  describe('添加好友弹窗', () => {
    test('showAddModal 应该显示弹窗并清空搜索', () => {
      page.data.searchUsername = 'test';
      page.showAddModal();
      expect(page.data.showAddModal).toBe(true);
      expect(page.data.searchUsername).toBe('');
    });

    test('hideAddModal 应该隐藏弹窗', () => {
      page.hideAddModal();
      expect(page.data.showAddModal).toBe(false);
    });

    test('onSearchInput 应该更新搜索用户名', () => {
      page.onSearchInput({ detail: { value: 'newuser' } });
      expect(page.data.searchUsername).toBe('newuser');
    });
  });

  // ==================== 添加好友测试 ====================
  describe('addFriend', () => {
    test('空用户名应该提示', async () => {
      page.data.searchUsername = '   ';
      await page.addFriend();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入用户名',
        icon: 'none'
      });
    });

    test('不能添加自己', async () => {
      const app = getApp();
      app.globalData.userInfo = { username: 'self' };
      page.data.searchUsername = 'self';
      await page.addFriend();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '不能添加自己',
        icon: 'none'
      });
    });

    test('成功添加后应该隐藏弹窗', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      app.globalData.userInfo = { username: 'self' };
      page.data.searchUsername = 'newfriend';

      await page.addFriend();

      expect(app.request).toHaveBeenCalledWith({
        url: '/friends',
        method: 'POST',
        data: { username: 'newfriend' }
      });
      expect(page.data.showAddModal).toBe(false);
      expect(page.data.searchUsername).toBe('');
    });

    test('添加失败应该显示错误', async () => {
      const app = getApp();
      app.request.mockRejectedValue({ message: '用户不存在' });
      app.globalData.userInfo = { username: 'self' };
      page.data.searchUsername = 'unknown';

      await page.addFriend();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '用户不存在',
        icon: 'none'
      });
      expect(page.data.isLoading).toBe(false);
    });
  });

  // ==================== 处理请求测试 ====================
  describe('acceptRequest', () => {
    test('成功接受后应该刷新列表', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      const loadFriendsSpy = jest.spyOn(page, 'loadFriends');

      await page.acceptRequest({ currentTarget: { dataset: { id: 2 } } });

      expect(app.request).toHaveBeenCalledWith({
        url: '/friends',
        method: 'PATCH',
        data: { friendId: 2, action: 'accept' }
      });
      expect(wx.showToast).toHaveBeenCalledWith({ title: '已接受', icon: 'success' });
      expect(loadFriendsSpy).toHaveBeenCalled();
    });
  });

  describe('rejectRequest', () => {
    test('成功拒绝后应该刷新列表', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      const loadFriendsSpy = jest.spyOn(page, 'loadFriends');

      await page.rejectRequest({ currentTarget: { dataset: { id: 3 } } });

      expect(app.request).toHaveBeenCalledWith({
        url: '/friends',
        method: 'PATCH',
        data: { friendId: 3, action: 'reject' }
      });
      expect(wx.showToast).toHaveBeenCalledWith({ title: '已拒绝', icon: 'success' });
      expect(loadFriendsSpy).toHaveBeenCalled();
    });
  });

  // ==================== 下拉刷新测试 ====================
  describe('onPullDownRefresh', () => {
    test('应该加载好友并停止刷新', async () => {
      const loadFriendsSpy = jest.spyOn(page, 'loadFriends');
      await page.onPullDownRefresh();
      expect(loadFriendsSpy).toHaveBeenCalled();
      expect(wx.stopPullDownRefresh).toHaveBeenCalled();
    });
  });

  // ==================== 阻止冒泡测试 ====================
  describe('stopPropagation', () => {
    test('应该存在且不抛出异常', () => {
      expect(page.stopPropagation).toBeDefined();
      expect(() => page.stopPropagation()).not.toThrow();
    });
  });
});
