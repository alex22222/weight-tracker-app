// app.js
const config = require('./config.js')

App({
  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    this.globalData.token = token || null
    this.globalData.userInfo = userInfo || null
    this.globalData.isLoggedIn = !!token
  },

  // 全局数据
  globalData: {
    isLoggedIn: false,
    token: null,
    userInfo: null
  },

  // 封装请求方法
  request(options) {
    const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options
    
    return new Promise((resolve, reject) => {
      const requestHeader = { ...header }
      
      // 添加认证token
      if (needAuth && this.globalData.token) {
        requestHeader['Authorization'] = `Bearer ${this.globalData.token}`
      }
      
      wx.request({
        url: `${config.apiBaseUrl}${url}`,
        method,
        data,
        header: requestHeader,
        timeout: config.timeout,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else if (res.statusCode === 401) {
            // Token 过期，清除登录状态
            this.logout()
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            })
            reject(new Error('Unauthorized'))
          } else {
            reject(new Error(res.data?.error || '请求失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  // 登录
  login(token, userInfo) {
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    this.globalData.isLoggedIn = true
  },

  // 登出
  logout() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
  },

  // 更新用户信息
  updateUserInfo(userInfo) {
    wx.setStorageSync('userInfo', userInfo)
    this.globalData.userInfo = userInfo
  }
})
