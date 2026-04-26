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
    // 密码显示控制
    showPassword: false,
    showConfirmPassword: false,
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
        url: '/pages/home/home'
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

  // ========== 微信登录（简化版，不使用 getUserProfile） ==========
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

      console.log('获取 code 成功:', loginRes.code)

      // 2. 发送到后端验证登录（不使用 userInfo，后端会自动处理）
      console.log('开始调用后端登录...')
      const result = await app.request({
        url: '/auth/wechat-login',
        method: 'POST',
        data: {
          code: loginRes.code,
          userInfo: { nickName: '微信用户' } // 提供默认昵称
        },
        needAuth: false
      })

      console.log('登录返回:', result)
      console.log('是否有 token:', !!result.token)
      if (result.token) {
        console.log('Token 前30位:', result.token.substring(0, 30))
      }

      // 3. 保存登录状态
      if (result.token) {
        console.log('调用 app.login 保存 token...')
        app.login(result.token, result.user)
        
        // 验证保存成功
        const savedToken = wx.getStorageSync('token')
        console.log('验证保存的 token:', savedToken ? savedToken.substring(0, 30) : '无')
        
        wx.showToast({
          title: result.user.isNewUser ? '注册成功' : '登录成功',
          icon: 'success'
        })

        // 4. 跳转到引导页（新用户）或首页（老用户）
        setTimeout(() => {
          if (result.user.isNewUser) {
            // 新用户：清除引导完成标记，跳转到引导页
            wx.removeStorageSync('onboardingCompleted')
            wx.redirectTo({ url: '/pages/onboarding/onboarding' })
          } else {
            // 老用户：直接跳转到首页
            wx.switchTab({ url: '/pages/home/home' })
          }
        }, 500)
      } else {
        throw new Error(result.error || '登录失败')
      }

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

  // 切换密码显示/隐藏
  togglePasswordVisibility() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  toggleConfirmPasswordVisibility() {
    this.setData({ showConfirmPassword: !this.data.showConfirmPassword })
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

        const result = await app.request({
          url: '/auth/register',
          method: 'POST',
          data: { username, password },
          needAuth: false
        })

        // 注册成功后自动登录
        app.login(result.token, result.user)
        wx.showToast({ title: '注册成功', icon: 'success' })

        setTimeout(() => {
          // 新用户跳转到引导页
          wx.removeStorageSync('onboardingCompleted')
          wx.redirectTo({ url: '/pages/onboarding/onboarding' })
        }, 500)
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
          wx.switchTab({ url: '/pages/home/home' })
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
        url: '/auth/guest',
        method: 'POST',
        needAuth: false
      })

      app.login(result.token, result.user)
      wx.showToast({ title: '游客登录成功', icon: 'success' })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' })
      }, 500)
    } catch (err) {
      this.setData({ error: err.message || '登录失败', isLoading: false })
    }
  }
})
