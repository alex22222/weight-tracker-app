// pages/channel/channel.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    channels: [],
    activeChannel: null,
    showCreateModal: false,
    isLoading: false,
    
    // 创建表单
    formData: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      weeklyCheckInCount: 3,
      checkInMinutes: 30,
      maxLeaveDays: 3
    }
  },

  onLoad() {
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    this.setData({
      'formData.startDate': util.getTodayString(),
      'formData.endDate': nextMonth.toISOString().split('T')[0]
    })
  },

  onShow() {
    this.loadChannels()
  },

  // 加载频道列表
  async loadChannels() {
    try {
      const result = await app.request({
        url: '/channels'
      })
      
      const channels = result.channels || []
      const activeChannel = channels.find(c => c.status === 'PENDING' || c.status === 'ACTIVE')
      
      this.setData({
        channels,
        activeChannel
      })
    } catch (err) {
      console.error('加载频道失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 显示创建弹窗
  showCreateModal() {
    // 检查是否已有进行中的频道
    if (this.data.activeChannel) {
      wx.showModal({
        title: '提示',
        content: '您已有进行中的频道，是否需要结束当前频道后创建新频道？',
        success: (res) => {
          if (res.confirm) {
            this.setData({ showCreateModal: true })
          }
        }
      })
      return
    }
    
    this.setData({ showCreateModal: true })
  },

  // 隐藏创建弹窗
  hideCreateModal() {
    this.setData({ showCreateModal: false })
  },

  // 表单输入
  onNameInput(e) {
    this.setData({ 'formData.name': e.detail.value })
  },

  onDescriptionInput(e) {
    this.setData({ 'formData.description': e.detail.value })
  },

  onStartDateChange(e) {
    this.setData({ 'formData.startDate': e.detail.value })
  },

  onEndDateChange(e) {
    this.setData({ 'formData.endDate': e.detail.value })
  },

  onWeeklyCountChange(e) {
    const values = [1, 2, 3, 4, 5, 6, 7]
    this.setData({ 'formData.weeklyCheckInCount': values[e.detail.value] })
  },

  onMinutesChange(e) {
    const values = [15, 30, 45, 60, 90, 120]
    this.setData({ 'formData.checkInMinutes': values[e.detail.value] })
  },

  onMaxLeaveDaysChange(e) {
    const values = [0, 1, 2, 3, 5, 7, 10, 14]
    this.setData({ 'formData.maxLeaveDays': values[e.detail.value] })
  },

  // 创建频道
  async createChannel() {
    const { formData } = this.data
    
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入频道名称',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

    try {
      await app.request({
        url: '/channels',
        method: 'POST',
        data: {
          name: formData.name,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          weeklyCheckInCount: formData.weeklyCheckInCount,
          checkInMinutes: formData.checkInMinutes,
          maxLeaveDays: formData.maxLeaveDays
        }
      })

      wx.showToast({
        title: '创建成功',
        icon: 'success'
      })

      this.setData({ 
        showCreateModal: false,
        'formData.name': '',
        'formData.description': ''
      }, () => {
        this.loadChannels()
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '创建失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 跳转到频道详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/channel/detail?id=${id}`
    })
  },

  // 获取状态文本
  getStatusText(status) {
    const map = {
      'PENDING': '未开始',
      'ACTIVE': '进行中',
      'COMPLETED': '已结束'
    }
    return map[status] || status
  },

  // 获取状态颜色
  getStatusColor(status) {
    const map = {
      'PENDING': '#f59e0b',
      'ACTIVE': '#10b981',
      'COMPLETED': '#94a3b8'
    }
    return map[status] || '#94a3b8'
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadChannels()
    wx.stopPullDownRefresh()
  }
})
