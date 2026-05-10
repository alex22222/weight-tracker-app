// pages/onboarding/onboarding.js
const app = getApp()

// 预设可爱头像列表（仅支持 emoji，不支持自定义上传）
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
    formData: {
      avatar: '',   // 选中的头像 emoji
      gender: '',   // male/female
      height: '',
      weight: '',
      age: ''
    },

    presetAvatars: PRESET_AVATARS,

    currentStep: 0,
    totalSteps: 6,

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
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    const onboardingCompleted = wx.getStorageSync('onboardingCompleted')
    if (onboardingCompleted) {
      wx.switchTab({ url: '/pages/home/home' })
      return
    }
  },

  // 选择头像（仅 emoji）
  selectAvatar(e) {
    const avatar = e.currentTarget.dataset.avatar
    this.setData({ 'formData.avatar': avatar })
    this.nextStep()
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ 'formData.gender': gender })
    this.nextStep()
  },

  onHeightInput(e) { this.setData({ 'formData.height': e.detail.value }) },
  onWeightInput(e) { this.setData({ 'formData.weight': e.detail.value }) },
  onAgeInput(e) { this.setData({ 'formData.age': e.detail.value }) },

  nextStep() {
    const { currentStep, totalSteps } = this.data
    if (currentStep < totalSteps - 1) {
      this.setData({ currentStep: currentStep + 1 })
    }
  },

  prevStep() {
    const { currentStep } = this.data
    if (currentStep > 0) {
      this.setData({ currentStep: currentStep - 1 })
    }
  },

  skipStep() { this.nextStep() },

  skipAll() {
    wx.setStorageSync('onboardingCompleted', true)
    wx.switchTab({ url: '/pages/home/home' })
  },

  // 完成引导
  async completeOnboarding() {
    const { formData } = this.data
    this.setData({ isLoading: true })

    try {
      // 保存头像（emoji 字符串，永久有效）
      if (formData.avatar) {
        await app.request({
          url: '/user',
          method: 'PATCH',
          data: { avatar: formData.avatar }
        })
      }

      const settingsData = {}
      if (formData.gender) settingsData.gender = formData.gender
      if (formData.age) settingsData.age = parseInt(formData.age)
      if (formData.height) settingsData.height = parseFloat(formData.height)
      if (formData.weight) settingsData.targetWeight = parseFloat(formData.weight)

      if (Object.keys(settingsData).length > 0) {
        await app.request({
          url: '/settings',
          method: 'POST',
          data: settingsData
        })
      }

      wx.setStorageSync('onboardingCompleted', true)
      wx.showToast({ title: '设置完成', icon: 'success' })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' })
      }, 500)

    } catch (err) {
      console.error('保存信息失败:', err)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      this.setData({ isLoading: false })
    }
  }
})
