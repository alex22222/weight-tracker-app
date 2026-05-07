// pages/my/my.js
const app = getApp()

Page({
  data: {
    userInfo: {}
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo || {}
    this.setData({ userInfo })
  },

  // 跳转到首页目标（立flag）
  goToGoals() {
    app.globalData.showGoalModal = true
    wx.switchTab({
      url: '/pages/home/home'
    })
  },

  // 跳转到设置页面
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  // 跳转到反馈页面
  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.loadUserInfo()
    wx.stopPullDownRefresh()
  },

  // 阻止事件冒泡
  stopPropagation() {}
})
