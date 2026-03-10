// pages/login/login.js
const app = getApp()

Page({
  data: {
    isRegister: false,
    username: '',
    password: '',
    confirmPassword: '',
    isLoading: false,
    error: ''
  },

  onLoad() {
    // 如果已登录，跳转到首页
    if (app.globalData.isLoggedIn) {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  // 输入处理
  onUsernameInput(e) {
    this.setData({ username: e.detail.value, error: '' })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, error: '' })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value, error: '' })
  },

  // 切换登录/注册模式
  toggleMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      error: '',
      password: '',
      confirmPassword: ''
    })
  },

  // 提交表单
  async handleSubmit() {
    const { isRegister, username, password, confirmPassword } = this.data

    // 基础验证
    if (!username || !password) {
      this.setData({ error: '请填写用户名和密码' })
      return
    }

    if (username.length < 3 || username.length > 20) {
      this.setData({ error: '用户名长度应为3-20个字符' })
      return
    }

    if (password.length < 6) {
      this.setData({ error: '密码长度至少6个字符' })
      return
    }

    this.setData({ isLoading: true, error: '' })

    try {
      if (isRegister) {
        // 注册
        if (password !== confirmPassword) {
          this.setData({ error: '两次输入的密码不一致', isLoading: false })
          return
        }

        await app.request({
          url: '/auth/register',
          method: 'POST',
          data: { username, password },
          needAuth: false
        })

        wx.showToast({ title: '注册成功', icon: 'success' })
        this.setData({
          isRegister: false,
          password: '',
          confirmPassword: '',
          isLoading: false
        })
      } else {
        // 登录
        const result = await app.request({
          url: '/auth/login',
          method: 'POST',
          data: { username, password },
          needAuth: false
        })

        app.login(result.token, result.user)
        wx.showToast({ title: '登录成功', icon: 'success' })
        
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 500)
      }
    } catch (err) {
      this.setData({ error: err.message || '请求失败', isLoading: false })
    }
  },

  // 游客登录
  async guestLogin() {
    this.setData({ isLoading: true, error: '' })
    
    try {
      const result = await app.request({
        url: '/auth/login',
        method: 'POST',
        data: { username: 'user1', password: '111111' },
        needAuth: false
      })

      app.login(result.token, result.user)
      wx.showToast({ title: '登录成功', icon: 'success' })
      
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (err) {
      this.setData({ error: err.message || '登录失败', isLoading: false })
    }
  }
})
