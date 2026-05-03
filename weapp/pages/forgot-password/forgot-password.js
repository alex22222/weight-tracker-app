// pages/forgot-password/forgot-password.js
const app = getApp()

Page({
  data: {
    email: '',
    code: '',
    newPassword: '',
    showPassword: false,
    isLoading: false,
    sending: false,
    countdown: 0,
    error: '',
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value, error: '' })
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value, error: '' })
  },

  onPasswordInput(e) {
    this.setData({ newPassword: e.detail.value, error: '' })
  },

  togglePasswordVisibility() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  // 发送验证码
  async sendCode() {
    const { email } = this.data
    if (!email) {
      this.setData({ error: '请输入邮箱地址' })
      return
    }

    this.setData({ sending: true, error: '' })

    try {
      const result = await app.request({
        url: '/auth/verify-code',
        method: 'POST',
        data: { email, purpose: 'reset' },
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
      this.setData({ sending: false })
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

  // 重置密码
  async handleReset() {
    const { email, code, newPassword } = this.data

    if (!email || !code || !newPassword) {
      this.setData({ error: '请填写完整信息' })
      return
    }

    if (newPassword.length < 6) {
      this.setData({ error: '密码长度至少6个字符' })
      return
    }

    this.setData({ isLoading: true, error: '' })

    try {
      await app.request({
        url: '/auth/reset-password',
        method: 'POST',
        data: { email, code, newPassword },
        needAuth: false,
      })

      wx.showToast({ title: '重置成功', icon: 'success' })

      setTimeout(() => {
        wx.redirectTo({ url: '/pages/login/login' })
      }, 1000)
    } catch (err) {
      this.setData({ error: err.message || '重置失败', isLoading: false })
    }
  },

  goToLogin() {
    wx.redirectTo({ url: '/pages/login/login' })
  },
})
