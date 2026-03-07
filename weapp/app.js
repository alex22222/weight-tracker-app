App({
  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()
    
    // 初始化数据存储
    this.initStorage()
  },

  checkLoginStatus() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn')
    const currentUser = wx.getStorageSync('currentUser')
    
    this.globalData.isLoggedIn = isLoggedIn || false
    this.globalData.currentUser = currentUser || null
  },

  initStorage() {
    // 初始化用户数据
    if (!wx.getStorageSync('users')) {
      wx.setStorageSync('users', [])
    }
    
    // 初始化体重记录（按用户存储）
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

  // 登录
  login(username) {
    wx.setStorageSync('isLoggedIn', true)
    wx.setStorageSync('currentUser', username)
    this.globalData.isLoggedIn = true
    this.globalData.currentUser = username
  },

  // 登出
  logout() {
    wx.setStorageSync('isLoggedIn', false)
    wx.removeStorageSync('currentUser')
    this.globalData.isLoggedIn = false
    this.globalData.currentUser = null
  },

  // 注册
  register(username, password) {
    const users = wx.getStorageSync('users') || []
    
    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
      return { success: false, error: '用户名已存在' }
    }
    
    // 添加新用户
    users.push({
      username,
      password, // 注意：实际应用需要加密
      createdAt: new Date().toISOString()
    })
    
    wx.setStorageSync('users', users)
    return { success: true }
  },

  // 验证登录
  authenticate(username, password) {
    const users = wx.getStorageSync('users') || []
    const user = users.find(u => u.username === username && u.password === password)
    return !!user
  },

  globalData: {
    isLoggedIn: false,
    currentUser: null
  }
})