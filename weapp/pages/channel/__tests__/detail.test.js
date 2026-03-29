// pages/channel/detail.test.js - 频道详情页测试
const path = require('path');
const util = require('../../../utils/util.js');

// 加载页面：直接 require 页面 JS 并捕获 Page() 传入的配置对象
const getPage = () => {
  const pagePath = path.resolve(__dirname, '../../channel/detail.js');

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

describe('频道详情页 (pages/channel/detail)', () => {
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
      expect(pageInstance.data.channelId).toBeNull();
      expect(pageInstance.data.channel).toBeNull();
      expect(pageInstance.data.activeTab).toBe('checkin');
      expect(pageInstance.data.isSubmittingCheckIn).toBe(false);
      expect(pageInstance.data.showCheckInModal).toBe(false);
      expect(pageInstance.data.showInviteModal).toBe(false);
      expect(pageInstance.data.commentText).toBe('');
      expect(pageInstance.data.showLeaveModal).toBe(false);
    });

    test('应该包含必要的页面方法', () => {
      expect(pageInstance.onLoad).toBeDefined();
      expect(pageInstance.onShow).toBeDefined();
      expect(pageInstance.loadChannelDetail).toBeDefined();
      expect(pageInstance.switchTab).toBeDefined();
      expect(pageInstance.startChannel).toBeDefined();
      expect(pageInstance.endChannel).toBeDefined();
      expect(pageInstance.deleteChannel).toBeDefined();
      expect(pageInstance.submitCheckIn).toBeDefined();
      expect(pageInstance.submitComment).toBeDefined();
      expect(pageInstance.submitLeave).toBeDefined();
    });

    test('onLoad 应该初始化 channelId 和日期', () => {
      page.onLoad({ id: '123' });
      expect(page.data.channelId).toBe('123');
      expect(page.data['checkInData.date']).toBe(util.getTodayString());
      expect(page.data['leaveData.startDate']).toBe(util.getTodayString());
    });

    test('onShow 有 channelId 时应该加载详情', () => {
      page.data.channelId = '123';
      const loadChannelDetailSpy = jest.spyOn(page, 'loadChannelDetail');
      page.onShow();
      expect(loadChannelDetailSpy).toHaveBeenCalled();
    });

    test('onShow 无 channelId 时不加载', () => {
      page.data.channelId = null;
      const loadChannelDetailSpy = jest.spyOn(page, 'loadChannelDetail');
      page.onShow();
      expect(loadChannelDetailSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== 加载详情测试 ====================
  describe('loadChannelDetail', () => {
    test('应该加载频道详情、统计和打卡记录', async () => {
      const app = getApp();
      app.request
        .mockResolvedValueOnce({ channel: { id: 1, creatorId: 1 } })
        .mockResolvedValueOnce({ total: 10 })
        .mockResolvedValueOnce({ checkIns: [{ id: 1 }] });
      page.data.channelId = '1';

      await page.loadChannelDetail();

      expect(app.request).toHaveBeenCalledWith({ url: '/channels/1' });
      expect(app.request).toHaveBeenCalledWith({ url: '/channels/1/stats' });
      expect(app.request).toHaveBeenCalledWith({ url: '/channels/1/checkin' });
      expect(page.data.channel).toEqual({ id: 1, creatorId: 1 });
      expect(page.data.isOwner).toBe(true);
    });

    test('activeTab 为 comment 时应该加载评论', async () => {
      const app = getApp();
      app.request
        .mockResolvedValueOnce({ channel: { id: 1, creatorId: 1 } })
        .mockResolvedValueOnce({ total: 10 })
        .mockResolvedValueOnce({ checkIns: [] });
      page.data.channelId = '1';
      page.data.activeTab = 'comment';
      const loadCommentsSpy = jest.spyOn(page, 'loadComments');

      await page.loadChannelDetail();

      expect(loadCommentsSpy).toHaveBeenCalled();
    });

    test('加载失败应该显示错误提示', async () => {
      const app = getApp();
      app.request.mockRejectedValue(new Error('网络错误'));
      page.data.channelId = '1';

      await page.loadChannelDetail();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '加载失败',
        icon: 'none'
      });
    });
  });

  // ==================== 标签切换测试 ====================
  describe('switchTab', () => {
    test('切换到 comment 应该加载评论', () => {
      const loadCommentsSpy = jest.spyOn(page, 'loadComments');
      page.switchTab({ currentTarget: { dataset: { tab: 'comment' } } });
      expect(page.data.activeTab).toBe('comment');
      expect(loadCommentsSpy).toHaveBeenCalled();
    });

    test('切换到 leave 应该加载请假列表', () => {
      const loadLeavesSpy = jest.spyOn(page, 'loadLeaves');
      page.switchTab({ currentTarget: { dataset: { tab: 'leave' } } });
      expect(page.data.activeTab).toBe('leave');
      expect(loadLeavesSpy).toHaveBeenCalled();
    });

    test('切换到 checkin 不加载额外数据', () => {
      const loadCommentsSpy = jest.spyOn(page, 'loadComments');
      const loadLeavesSpy = jest.spyOn(page, 'loadLeaves');
      page.switchTab({ currentTarget: { dataset: { tab: 'checkin' } } });
      expect(page.data.activeTab).toBe('checkin');
      expect(loadCommentsSpy).not.toHaveBeenCalled();
      expect(loadLeavesSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== 频道控制测试 ====================
  describe('startChannel', () => {
    test('成功开始频道', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.channelId = '1';
      const loadChannelDetailSpy = jest.spyOn(page, 'loadChannelDetail');

      await page.startChannel();

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels/1/control',
        method: 'POST',
        data: { action: 'start' }
      });
      expect(wx.showToast).toHaveBeenCalledWith({ title: '已开始', icon: 'success' });
      expect(loadChannelDetailSpy).toHaveBeenCalled();
    });
  });

  describe('endChannel', () => {
    test('确认后应该结束频道', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.channelId = '1';
      const loadChannelDetailSpy = jest.spyOn(page, 'loadChannelDetail');

      page.endChannel();
      const modalCall = wx.showModal.mock.calls[0][0];
      await modalCall.success({ confirm: true });

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels/1/control',
        method: 'POST',
        data: { action: 'end' }
      });
      expect(wx.showToast).toHaveBeenCalledWith({ title: '已结束', icon: 'success' });
      expect(loadChannelDetailSpy).toHaveBeenCalled();
    });
  });

  describe('deleteChannel', () => {
    test('确认后应该删除并返回', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.channelId = '1';

      page.deleteChannel();
      const modalCall = wx.showModal.mock.calls[0][0];
      await modalCall.success({ confirm: true });

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels/1',
        method: 'DELETE'
      });
      expect(wx.showToast).toHaveBeenCalledWith({ title: '已删除', icon: 'success' });
    });
  });

  // ==================== 打卡功能测试 ====================
  describe('打卡功能', () => {
    test('showCheckInModal 无频道数据时提示加载中', () => {
      page.data.channel = null;
      page.showCheckInModal();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '频道数据加载中，请稍候',
        icon: 'none'
      });
    });

    test('showCheckInModal 已完成频道不能打卡', () => {
      page.data.channel = { status: 'COMPLETED' };
      page.showCheckInModal();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '频道已结束',
        icon: 'none'
      });
    });

    test('showCheckInModal 正常显示弹窗', () => {
      page.data.channel = { status: 'ACTIVE', checkInMinutes: 45 };
      page.showCheckInModal();
      expect(page.data.showCheckInModal).toBe(true);
      expect(page.data['checkInData.duration']).toBe(45);
    });

    test('hideCheckInModal 应该隐藏弹窗', () => {
      page.hideCheckInModal();
      expect(page.data.showCheckInModal).toBe(false);
    });

    test('submitCheckIn 时长不足应该提示', async () => {
      page.data.channel = { checkInMinutes: 30 };
      page.data.checkInData = { duration: 20 };
      await page.submitCheckIn();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '打卡时长至少30分钟',
        icon: 'none'
      });
    });

    test('submitCheckIn 成功应该隐藏弹窗并刷新', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.channelId = '1';
      page.data.channel = { checkInMinutes: 30 };
      page.data.checkInData = { date: '2024-03-15', duration: 30, note: '跑步', imageUrl: '' };
      const loadChannelDetailSpy = jest.spyOn(page, 'loadChannelDetail');

      await page.submitCheckIn();

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels/1/checkin',
        method: 'POST',
        data: {
          checkDate: '2024-03-15',
          duration: 30,
          note: '跑步',
          imageUrl: ''
        }
      });
      expect(page.data.showCheckInModal).toBe(false);
      expect(loadChannelDetailSpy).toHaveBeenCalled();
    });
  });

  // ==================== 邀请功能测试 ====================
  describe('邀请功能', () => {
    test('showInviteModal 应该显示弹窗并加载好友', () => {
      const loadFriendsSpy = jest.spyOn(page, 'loadFriends');
      page.showInviteModal();
      expect(page.data.showInviteModal).toBe(true);
      expect(loadFriendsSpy).toHaveBeenCalled();
    });

    test('hideInviteModal 应该隐藏弹窗', () => {
      page.hideInviteModal();
      expect(page.data.showInviteModal).toBe(false);
    });

    test('toggleFriend 应该选择好友', () => {
      page.data.selectedFriends = [];
      page.toggleFriend({ currentTarget: { dataset: { id: 1 } } });
      expect(page.data.selectedFriends).toContain(1);
    });

    test('toggleFriend 应该取消选择', () => {
      page.data.selectedFriends = [1];
      page.toggleFriend({ currentTarget: { dataset: { id: 1 } } });
      expect(page.data.selectedFriends).not.toContain(1);
    });

    test('sendInvites 未选择好友应该提示', async () => {
      page.data.selectedFriends = [];
      await page.sendInvites();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请选择好友',
        icon: 'none'
      });
    });

    test('sendInvites 成功应该发送邀请', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.channelId = '1';
      page.data.selectedFriends = [2];
      page.data.friends = [{ id: 2, username: 'user2' }];

      await page.sendInvites();

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels/1',
        method: 'POST',
        data: { username: 'user2' }
      });
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '邀请已发送',
        icon: 'success'
      });
    });
  });

  // ==================== 评论功能测试 ====================
  describe('评论功能', () => {
    test('onCommentInput 应该更新评论文本', () => {
      page.onCommentInput({ detail: { value: '加油！' } });
      expect(page.data.commentText).toBe('加油！');
    });

    test('submitComment 空内容应该提示', async () => {
      page.data.commentText = '   ';
      await page.submitComment();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入评论内容',
        icon: 'none'
      });
    });

    test('submitComment 成功应该清空并刷新', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.channelId = '1';
      page.data.commentText = '加油！';
      const loadCommentsSpy = jest.spyOn(page, 'loadComments');

      await page.submitComment();

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels/1/comments',
        method: 'POST',
        data: { content: '加油！' }
      });
      expect(page.data.commentText).toBe('');
      expect(loadCommentsSpy).toHaveBeenCalled();
    });

    test('deleteComment 确认后应该删除', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.channelId = '1';
      const loadCommentsSpy = jest.spyOn(page, 'loadComments');

      page.deleteComment({ currentTarget: { dataset: { id: 5 } } });
      const modalCall = wx.showModal.mock.calls[0][0];
      await modalCall.success({ confirm: true });

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels/1/comments?commentId=5',
        method: 'DELETE'
      });
      expect(loadCommentsSpy).toHaveBeenCalled();
    });
  });

  // ==================== 请假功能测试 ====================
  describe('请假功能', () => {
    test('showLeaveModal maxLeaveDays 为 0 时不允许请假', () => {
      page.data.channel = { maxLeaveDays: 0 };
      page.showLeaveModal();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '该频道不允许请假',
        icon: 'none'
      });
    });

    test('showLeaveModal 正常显示弹窗', () => {
      page.data.channel = { maxLeaveDays: 3 };
      page.showLeaveModal();
      expect(page.data.showLeaveModal).toBe(true);
    });

    test('hideLeaveModal 应该隐藏弹窗', () => {
      page.hideLeaveModal();
      expect(page.data.showLeaveModal).toBe(false);
    });

    test('submitLeave 未选择日期应该提示', async () => {
      page.data.leaveData = { startDate: '', endDate: '', reason: '' };
      await page.submitLeave();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请选择请假日期',
        icon: 'none'
      });
    });

    test('submitLeave 成功应该隐藏弹窗并刷新', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.channelId = '1';
      page.data.leaveData = { startDate: '2024-03-15', endDate: '2024-03-16', reason: '生病' };
      const loadLeavesSpy = jest.spyOn(page, 'loadLeaves');

      await page.submitLeave();

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels/1/leave',
        method: 'POST',
        data: {
          startDate: '2024-03-15',
          endDate: '2024-03-16',
          reason: '生病'
        }
      });
      expect(page.data.showLeaveModal).toBe(false);
      expect(loadLeavesSpy).toHaveBeenCalled();
    });

    test('handleLeaveRequest 批准请假', async () => {
      const app = getApp();
      app.request.mockResolvedValue({});
      page.data.channelId = '1';
      const loadLeavesSpy = jest.spyOn(page, 'loadLeaves');

      await page.handleLeaveRequest({ currentTarget: { dataset: { id: 5, action: 'approve' } } });

      expect(app.request).toHaveBeenCalledWith({
        url: '/channels/1/leave',
        method: 'PATCH',
        data: { requestId: 5, action: 'approve' }
      });
      expect(wx.showToast).toHaveBeenCalledWith({ title: '已批准', icon: 'success' });
      expect(loadLeavesSpy).toHaveBeenCalled();
    });
  });

  // ==================== 工具方法测试 ====================
  describe('工具方法', () => {
    test('getStatusText 应该返回正确文本', () => {
      expect(page.getStatusText('PENDING')).toBe('未开始');
      expect(page.getStatusText('ACTIVE')).toBe('进行中');
      expect(page.getStatusText('COMPLETED')).toBe('已结束');
    });

    test('getLeaveStatusText 应该返回正确文本', () => {
      expect(page.getLeaveStatusText('PENDING')).toBe('待审批');
      expect(page.getLeaveStatusText('APPROVED')).toBe('已通过');
      expect(page.getLeaveStatusText('REJECTED')).toBe('已拒绝');
    });

    test('stopPropagation 应该存在', () => {
      expect(page.stopPropagation).toBeDefined();
      expect(() => page.stopPropagation()).not.toThrow();
    });
  });
});
