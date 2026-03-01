// pages/login/login.js
const app = getApp()

Page({
  data: {
    isRegister: false,
    username: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    isLoading: false,
    error: ''
  },

  onLoad() {
    // 检查是否已登录
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

  // 切换记住我
  toggleRemember() {
    this.setData({ rememberMe: !this.data.rememberMe })
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
  handleSubmit() {
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

    if (isRegister) {
      // 注册
      if (password !== confirmPassword) {
        this.setData({ error: '两次输入的密码不一致', isLoading: false })
        return
      }

      const result = app.register(username, password)
      
      if (result.success) {
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        })
        this.setData({
          isRegister: false,
          password: '',
          confirmPassword: ''
        })
      } else {
        this.setData({ error: result.error })
      }
    } else {
      // 登录
      const success = app.authenticate(username, password)
      
      if (success) {
        app.login(username)
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 500)
      } else {
        this.setData({ error: '用户名或密码错误' })
      }
    }

    this.setData({ isLoading: false })
  },

  // 游客登录
  guestLogin() {
    app.login('guest')
    wx.showToast({
      title: '游客模式',
      icon: 'none'
    })
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }, 500)
  },

  // 忘记密码
  onForgotPassword() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
})