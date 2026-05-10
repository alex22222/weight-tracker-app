// pages/login/login.js
const app = getApp()

Page({
  data: {
    isRegister: false,
    username: '',
    email: '',
    verifyCode: '',
    password: '',
    confirmPassword: '',
    isLoading: false,
    error: '',
    // 密码显示控制
    showPassword: false,
    showConfirmPassword: false,
    // 验证码
    sendingCode: false,
    countdown: 0,
    // 微信登录相关
    canIUseGetUserProfile: false,
    loginType: 'wechat', // 'wechat' | 'account'
    // 隐私政策同意状态
    agreePrivacy: false,
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

  // 切换隐私政策同意状态
  togglePrivacy() {
    this.setData({ agreePrivacy: !this.data.agreePrivacy })
  },

  // 跳转到用户协议
  goToAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  },

  // 跳转到隐私政策
  goToPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  // 检查是否同意隐私政策
  checkPrivacyAgreement() {
    if (!this.data.agreePrivacy) {
      this.setData({ error: '请先阅读并同意《用户协议》和《隐私政策》' })
      return false
    }
    return true
  },

  // ========== 微信登录（简化版，不使用 getUserProfile） ==========
  async handleWechatLogin() {
    if (!this.checkPrivacyAgreement()) return
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
        
        this.setData({ isLoading: false })
        wx.showToast({
          title: result.user.isNewUser ? '注册成功' : '登录成功',
          icon: 'success'
        })

        // 4. 跳转到引导页（新用户）或首页（老用户）
        setTimeout(() => {
          if (result.user.isNewUser) {
            // 新用户：清除引导完成标记，跳转到引导页
            wx.removeStorageSync('onboardingCompleted')
            wx.redirectTo({ 
              url: '/pages/onboarding/onboarding',
              fail: () => {
                wx.switchTab({ url: '/pages/home/home' })
              }
            })
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
        error: typeof err === 'string' ? err : (err.message || err.errMsg || '微信登录失败，请重试'),
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

  onEmailInput(e) {
    this.setData({ email: e.detail.value, error: '' })
  },

  onVerifyCodeInput(e) {
    this.setData({ verifyCode: e.detail.value, error: '' })
  },

  // 发送验证码
  async sendVerifyCode() {
    const { email } = this.data
    if (!email) {
      this.setData({ error: '请输入邮箱地址' })
      return
    }

    this.setData({ sendingCode: true, error: '' })

    try {
      const result = await app.request({
        url: '/auth/verify-code',
        method: 'POST',
        data: { email, purpose: 'register' },
        needAuth: false,
      })

      wx.showToast({ title: '验证码已发送', icon: 'success' })

      // 开发/测试环境：如果返回了验证码，显示给用户
      if (result.code) {
        wx.showModal({
          title: '开发模式',
          content: `验证码: ${result.code}`,
          showCancel: false,
        })
      }

      // 开始倒计时
      this.setData({ countdown: 60 })
      this.startCountdown()
    } catch (err) {
      this.setData({ error: err.message || '发送失败' })
    } finally {
      this.setData({ sendingCode: false })
    }
  },

  startCountdown() {
    const timer = setInterval(() => {
      const { countdown } = this.data
      if (countdown <= 1) {
        clearInterval(timer)
        this.setData({ countdown: 0 })
      } else {
        this.setData({ countdown: countdown - 1 })
      }
    }, 1000)
  },

  goToForgotPassword() {
    wx.navigateTo({ url: '/pages/forgot-password/forgot-password' })
  },

  toggleMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      error: '',
      password: '',
      confirmPassword: '',
      email: '',
      verifyCode: '',
    })
  },

  async handleSubmit() {
    if (!this.checkPrivacyAgreement()) return

    const { isRegister, username, email, verifyCode, password, confirmPassword } = this.data

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
          data: { username, password, email, verifyCode },
          needAuth: false
        })

        // 验证服务器返回了有效的 token
        if (!result || !result.token) {
          throw new Error(result?.error || '服务器响应异常，请稍后重试')
        }

        // 注册成功后自动登录
        app.login(result.token, result.user)
        
        this.setData({ isLoading: false })
        wx.showToast({ title: '注册成功', icon: 'success' })

        setTimeout(() => {
          // 新用户跳转到引导页
          wx.removeStorageSync('onboardingCompleted')
          wx.redirectTo({ 
            url: '/pages/onboarding/onboarding',
            fail: () => {
              // redirectTo 失败时回退到首页
              wx.switchTab({ url: '/pages/home/home' })
            }
          })
        }, 500)
      } else {
        // 登录
        const result = await app.request({
          url: '/auth/login',
          method: 'POST',
          data: { username, password },
          needAuth: false
        })

        if (!result || !result.token) {
          throw new Error(result?.error || '用户名或密码错误')
        }

        app.login(result.token, result.user)
        
        this.setData({ isLoading: false })
        wx.showToast({ title: '登录成功', icon: 'success' })

        setTimeout(() => {
          wx.switchTab({ url: '/pages/home/home' })
        }, 500)
      }
    } catch (err) {
      console.error('登录/注册失败:', err)
      this.setData({ 
        error: typeof err === 'string' ? err : (err.message || err.errMsg || '请求失败，请检查网络连接'),
        isLoading: false 
      })
    }
  },

  // ========== 游客登录 ==========
  async guestLogin() {
    if (!this.checkPrivacyAgreement()) return
    this.setData({ isLoading: true, error: '' })

    try {
      const result = await app.request({
        url: '/auth/guest',
        method: 'POST',
        needAuth: false
      })

      if (!result || !result.token) {
        throw new Error('游客登录失败，请稍后重试')
      }

      app.login(result.token, result.user)
      
      this.setData({ isLoading: false })
      wx.showToast({ title: '登录成功', icon: 'success' })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' })
      }, 500)
    } catch (err) {
      console.error('游客登录失败:', err)
      this.setData({ 
        error: typeof err === 'string' ? err : (err.message || err.errMsg || '登录失败，请检查网络'),
        isLoading: false 
      })
    }
  }
})
