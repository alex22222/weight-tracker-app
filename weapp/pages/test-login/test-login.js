// 登录测试页面
const app = getApp()

Page({
  data: {
    apiUrl: '',
    testUsername: 'admin',
    testPassword: '123123',
    results: [],
    isTesting: false
  },

  onLoad() {
    const config = require('../../config.js')
    this.setData({ apiUrl: config.apiBaseUrl })
  },

  onUsernameInput(e) {
    this.setData({ testUsername: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ testPassword: e.detail.value })
  },

  addResult(type, message, detail = '') {
    const time = new Date().toLocaleTimeString()
    this.setData({
      results: [{ time, type, message, detail }, ...this.data.results].slice(0, 20)
    })
  },

  async testConnection() {
    this.setData({ isTesting: true })
    this.addResult('info', '测试服务器连接...')

    wx.request({
      url: `${this.data.apiUrl}/health`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200) {
          this.addResult('success', '服务器连接正常', JSON.stringify(res.data))
        } else {
          this.addResult('error', `服务器返回 ${res.statusCode}`, JSON.stringify(res.data))
        }
        this.setData({ isTesting: false })
      },
      fail: (err) => {
        this.addResult('error', '连接失败', err.errMsg)
        this.setData({ isTesting: false })
      }
    })
  },

  async testLogin() {
    const { testUsername, testPassword } = this.data
    
    if (!testUsername || !testPassword) {
      this.addResult('error', '请输入用户名和密码')
      return
    }

    this.setData({ isTesting: true })
    this.addResult('info', `开始登录测试: ${testUsername}`)

    const startTime = Date.now()
    wx.request({
      url: `${this.data.apiUrl}/auth/login`,
      method: 'POST',
      data: { username: testUsername, password: testPassword },
      header: { 'Content-Type': 'application/json' },
      timeout: 15000,
      success: (res) => {
        const duration = Date.now() - startTime
        if (res.statusCode === 200) {
          this.addResult('success', `登录成功 (${duration}ms)`, 
            `Token: ${res.data.token?.substring(0, 30)}...`)
        } else if (res.statusCode === 401) {
          this.addResult('error', `登录失败 401 (${duration}ms)`, 
            `错误: ${res.data?.error || '未知错误'}`)
        } else {
          this.addResult('error', `登录失败 ${res.statusCode} (${duration}ms)`, 
            JSON.stringify(res.data))
        }
        this.setData({ isTesting: false })
      },
      fail: (err) => {
        this.addResult('error', '请求失败', err.errMsg)
        this.setData({ isTesting: false })
      }
    })
  },

  clearResults() {
    this.setData({ results: [] })
  }
})
