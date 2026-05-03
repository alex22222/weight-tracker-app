const app = getApp()

Page({
  data: {
    userInfo: {}
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo || {}
    })
  },

  onShow() {
    this.setData({
      userInfo: app.globalData.userInfo || {}
    })
  },

  goToPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  goToAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          wx.reLaunch({ url: '/pages/home/home' })
        }
      }
    })
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({ title: '已清除', icon: 'success' })
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/home/home' })
          }, 1000)
        }
      }
    })
  }
})
