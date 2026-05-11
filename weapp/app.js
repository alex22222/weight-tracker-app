// app.js
const config = require('./config.js')

// 使用时长上报间隔（毫秒）
const USAGE_REPORT_INTERVAL = 30000

App({
  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()
    // 如果已登录，启动使用时长统计
    if (this.globalData.isLoggedIn) {
      this.startUsageTracking()
    }
  },

  onShow() {
    // 应用回到前台，恢复计时
    if (this.globalData.isLoggedIn && !this.globalData.usageStartTime) {
      this.startUsageTracking()
    }
  },

  onHide() {
    // 应用进入后台，立即上报当前累积时长
    if (this.globalData.isLoggedIn) {
      this.reportUsageTime()
      this.pauseUsageTracking()
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    console.log('[App] checkLoginStatus:', { 
      hasToken: !!token, 
      tokenPrefix: token ? token.substring(0, 20) : 'none',
      isJWT: token && token.includes('.')
    })
    
    // 检测是否是旧版 Base64 Token（JWT 包含三个点号分隔的部分）
    if (token && !token.includes('.')) {
      console.log('[App] 检测到旧版 Token，需要重新登录')
      // 清除旧 Token
      wx.removeStorageSync('token')
      wx.removeStorageSync('userInfo')
      this.globalData.token = null
      this.globalData.userInfo = null
      this.globalData.isLoggedIn = false
      return
    }
    
    this.globalData.token = token || null
    this.globalData.userInfo = userInfo || null
    this.globalData.isLoggedIn = !!token
    
    console.log('[App] globalData updated:', { 
      isLoggedIn: this.globalData.isLoggedIn,
      hasToken: !!this.globalData.token
    })
  },

  // 全局数据
  globalData: {
    isLoggedIn: false,
    token: null,
    userInfo: null,
    apiBaseUrl: config.apiBaseUrl,
    // 使用时长统计
    usageStartTime: null,    // 本次计时开始时间戳
    usageAccumulated: 0,     // 本次累积秒数（未上报部分）
    usageTimer: null,        // 定时上报 timer
  },

  // 开始使用时长统计
  startUsageTracking() {
    if (this.globalData.usageStartTime) return
    this.globalData.usageStartTime = Date.now()
    // 启动定时上报
    if (!this.globalData.usageTimer) {
      this.globalData.usageTimer = setInterval(() => {
        this.reportUsageTime()
      }, USAGE_REPORT_INTERVAL)
    }
    console.log('[App] 使用时长统计已启动')
  },

  // 暂停使用时长统计（应用进入后台）
  pauseUsageTracking() {
    if (this.globalData.usageStartTime) {
      const now = Date.now()
      const delta = Math.floor((now - this.globalData.usageStartTime) / 1000)
      this.globalData.usageAccumulated += delta
      this.globalData.usageStartTime = null
    }
    // 清除定时器，避免后台继续上报
    if (this.globalData.usageTimer) {
      clearInterval(this.globalData.usageTimer)
      this.globalData.usageTimer = null
    }
    console.log('[App] 使用时长统计已暂停，累积:', this.globalData.usageAccumulated)
  },

  // 上报使用时长
  async reportUsageTime() {
    if (!this.globalData.isLoggedIn || !this.globalData.token) return

    let delta = this.globalData.usageAccumulated
    if (this.globalData.usageStartTime) {
      const now = Date.now()
      delta += Math.floor((now - this.globalData.usageStartTime) / 1000)
      this.globalData.usageStartTime = now
    }
    this.globalData.usageAccumulated = 0

    if (delta <= 0) return

    try {
      await this.request({
        url: '/usage',
        method: 'POST',
        data: { deltaSeconds: delta }
      })
      console.log('[App] 使用时长上报成功:', delta, '秒')
    } catch (err) {
      // 上报失败，把时长加回累积值
      this.globalData.usageAccumulated += delta
      console.error('[App] 使用时长上报失败:', err)
    }
  },

  // 封装请求方法
  request(options) {
    const { url, method = 'GET', data = {}, header = {}, needAuth = true, timeout } = options
    
    console.log(`[请求] ${method} ${url}`, data)
    
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
        timeout: timeout || config.timeout,
        success: (res) => {
          console.log(`[响应] ${method} ${url}:`, res.statusCode, res.data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
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
    if (!token) {
      console.error('[App] login called without token, aborting')
      return
    }
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo || {})
    this.globalData.token = token
    this.globalData.userInfo = userInfo || {}
    this.globalData.isLoggedIn = true
    // 启动使用时长统计
    this.startUsageTracking()
  },

  // 登出
  logout() {
    // 先上报当前使用时长
    this.reportUsageTime()
    // 停止计时
    if (this.globalData.usageTimer) {
      clearInterval(this.globalData.usageTimer)
      this.globalData.usageTimer = null
    }
    this.globalData.usageStartTime = null
    this.globalData.usageAccumulated = 0
    // 清除登录状态
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
