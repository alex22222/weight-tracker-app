App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化数据存储
    this.initStorage()
  },

  initStorage() {
    // 初始化体重记录
    if (!wx.getStorageSync('weightEntries')) {
      wx.setStorageSync('weightEntries', [])
    }
    // 初始化用户设置
    if (!wx.getStorageSync('userSettings')) {
      wx.setStorageSync('userSettings', {
        height: 170,
        targetWeight: 65
      })
    }
  },

  globalData: {
    userInfo: null
  }
})