// pages/onboarding/onboarding.js
const app = getApp()

// 预设可爱头像列表（使用emoji）
const PRESET_AVATARS = [
  { id: 'cat', emoji: '🐱', name: '猫咪' },
  { id: 'dog', emoji: '🐶', name: '狗狗' },
  { id: 'rabbit', emoji: '🐰', name: '兔子' },
  { id: 'panda', emoji: '🐼', name: '熊猫' },
  { id: 'bear', emoji: '🐻', name: '小熊' },
  { id: 'fox', emoji: '🦊', name: '狐狸' },
  { id: 'tiger', emoji: '🐯', name: '老虎' },
  { id: 'lion', emoji: '🦁', name: '狮子' },
  { id: 'penguin', emoji: '🐧', name: '企鹅' },
  { id: 'koala', emoji: '🐨', name: '考拉' },
  { id: 'monkey', emoji: '🐵', name: '猴子' },
  { id: 'pig', emoji: '🐷', name: '小猪' },
]

Page({
  data: {
    // 用户信息表单
    formData: {
      avatar: '', // 选中的头像emoji
      gender: '', // male/female
      height: '',
      weight: '',
      age: ''
    },
    
    // 预设头像
    presetAvatars: PRESET_AVATARS,
    
    // 步骤控制
    currentStep: 0,
    totalSteps: 6,
    
    // 步骤标题
    steps: [
      { title: '欢迎', subtitle: '让我们更好地了解你' },
      { title: '选择头像', subtitle: '挑一个你喜欢的头像' },
      { title: '性别', subtitle: '选择你的性别' },
      { title: '身高', subtitle: '输入你的身高（cm）' },
      { title: '体重', subtitle: '输入你的体重（kg）' },
      { title: '年龄', subtitle: '输入你的年龄' }
    ],
    
    isLoading: false
  },

  onLoad() {
    // 检查是否已登录
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    
    // 检查是否已完成引导
    const onboardingCompleted = wx.getStorageSync('onboardingCompleted')
    if (onboardingCompleted) {
      wx.switchTab({ url: '/pages/home/home' })
      return
    }
  },

  // 选择头像
  selectAvatar(e) {
    const avatar = e.currentTarget.dataset.avatar
    this.setData({ 'formData.avatar': avatar })
    this.nextStep()
  },

  // 上传自定义头像
  uploadCustomAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.doUploadAvatar(tempFilePath)
      },
      fail: () => {
        wx.showToast({ title: '选择图片失败', icon: 'none' })
      }
    })
  },

  // 执行上传
  async doUploadAvatar(filePath) {
    wx.showLoading({ title: '上传中...' })
    const app = getApp()
    const token = wx.getStorageSync('token')
    const url = `${app.globalData.apiBaseUrl}/upload?token=${encodeURIComponent(token)}`

    try {
      const res = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url,
          filePath,
          name: 'file',
          success: resolve,
          fail: reject
        })
      })

      const data = JSON.parse(res.data)
      if (data.url) {
        this.setData({ 'formData.avatar': data.url })
        wx.showToast({ title: '头像已上传', icon: 'success' })
      } else {
        wx.showToast({ title: '上传失败', icon: 'none' })
      }
    } catch (err) {
      console.error('上传失败:', err)
      wx.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ 'formData.gender': gender })
    this.nextStep()
  },

  // 输入身高
  onHeightInput(e) {
    this.setData({ 'formData.height': e.detail.value })
  },

  // 输入体重
  onWeightInput(e) {
    this.setData({ 'formData.weight': e.detail.value })
  },

  // 输入年龄
  onAgeInput(e) {
    this.setData({ 'formData.age': e.detail.value })
  },

  // 下一步
  nextStep() {
    const { currentStep, totalSteps } = this.data
    if (currentStep < totalSteps - 1) {
      this.setData({ currentStep: currentStep + 1 })
    }
  },

  // 上一步
  prevStep() {
    const { currentStep } = this.data
    if (currentStep > 0) {
      this.setData({ currentStep: currentStep - 1 })
    }
  },

  // 跳过当前步骤
  skipStep() {
    this.nextStep()
  },

  // 跳过全部
  skipAll() {
    wx.setStorageSync('onboardingCompleted', true)
    wx.switchTab({ url: '/pages/home/home' })
  },

  // 完成引导
  async completeOnboarding() {
    const { formData } = this.data
    
    this.setData({ isLoading: true })
    
    try {
      // 1. 保存头像到用户信息（如果有选择）
      if (formData.avatar) {
        await app.request({
          url: '/user',
          method: 'PATCH',
          data: { avatar: formData.avatar }
        })
      }
      
      // 2. 准备要保存的设置数据
      const settingsData = {}
      
      if (formData.gender) {
        settingsData.gender = formData.gender
      }
      
      if (formData.age) {
        settingsData.age = parseInt(formData.age)
      }
      
      if (formData.height) {
        settingsData.height = parseFloat(formData.height)
      }
      
      if (formData.weight) {
        settingsData.targetWeight = parseFloat(formData.weight)
      }
      
      // 保存所有信息到设置
      if (Object.keys(settingsData).length > 0) {
        await app.request({
          url: '/settings',
          method: 'POST',
          data: settingsData
        })
      }
      
      // 标记引导完成
      wx.setStorageSync('onboardingCompleted', true)
      
      wx.showToast({
        title: '设置完成',
        icon: 'success'
      })
      
      // 跳转到首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' })
      }, 500)
      
    } catch (err) {
      console.error('保存信息失败:', err)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
      this.setData({ isLoading: false })
    }
  }
})
