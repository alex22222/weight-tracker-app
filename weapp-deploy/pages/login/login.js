// pages/login/login.js
const app = getApp()

Page({
  data: {
    isRegister: false,
    username: '',
    password: '',
    confirmPassword: '',
    isLoading: false,
    error: '',
    // 微信登录相关
    canIUseGetUserProfile: false,
    loginType: 'wechat', // 'wechat' | 'account'
  },

  onLoad() {
    // 检查是否支持 getUserProfile
    if (wx.getUserProfile) {
      this.setData({ canIUseGetUserProfile: true })
    }

    // 如果已登录，跳转到首页
    if (app.globalData.isLoggedIn) {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  // 切换登录方式
  switchLoginType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      loginType: type,
      error: ''
    })
  },

  // ========== 微信登录 ==========
  // 获取用户信息并登录
  async handleWechatLogin() {
    this.setData({ isLoading: true, error: '' })

    try {
      // 1. 获取微信登录凭证
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }

      // 2. 获取用户信息（可选，需要用户授权）
      let userInfo = null
      try {
        const profileRes = await new Promise((resolve, reject) => {
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: resolve,
            fail: (err) => {
              // 用户拒绝授权，继续用 code 登录
              console.log('用户拒绝授权:', err)
              resolve({ userInfo: null })
            }
          })
        })
        userInfo = profileRes.userInfo
      } catch (e) {
        console.log('获取用户信息失败:', e)
      }

      // 3. 发送到后端验证登录
      const result = await app.request({
        url: '/auth/wechat-login',
        method: 'POST',
        data: {
          code: loginRes.code,
          userInfo: userInfo
        },
        needAuth: false
      })

      // 4. 保存登录状态
      app.login(result.token, result.user)

      wx.showToast({
        title: result.user.isNewUser ? '注册成功' : '登录成功',
        icon: 'success'
      })

      // 5. 跳转到首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)

    } catch (err) {
      console.error('微信登录失败:', err)
      this.setData({
        error: err.message || '微信登录失败，请重试',
        isLoading: false
      })
    }
  },

  // 仅使用 code 登录（不获取用户信息）
  async handleWechatLoginSilent() {
    this.setData({ isLoading: true, error: '' })

    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }

      const result = await app.request({
        url: '/auth/wechat-login',
        method: 'POST',
        data: { code: loginRes.code },
        needAuth: false
      })

      app.login(result.token, result.user)

      wx.showToast({
        title: result.user.isNewUser ? '注册成功' : '登录成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)

    } catch (err) {
      console.error('微信登录失败:', err)
      this.setData({
        error: err.message || '微信登录失败，请重试',
        isLoading: false
      })
    }
  },

  // ========== 账号密码登录 ==========
  onUsernameInput(e) {
    this.setData({ username: e.detail.value, error: '' })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, error: '' })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value, error: '' })
  },

  toggleMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      error: '',
      password: '',
      confirmPassword: ''
    })
  },

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

  // ========== 游客登录 ==========
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
