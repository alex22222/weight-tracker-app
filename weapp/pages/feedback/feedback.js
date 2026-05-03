// pages/feedback/feedback.js
const app = getApp()

Page({
  data: {
    types: [
      { value: 'bug', label: '功能异常' },
      { value: 'feature', label: '功能建议' },
      { value: 'ui', label: '界面问题' },
      { value: 'performance', label: '性能问题' },
      { value: 'other', label: '其他' }
    ],
    type: '',
    content: '',
    contact: '',
    isSubmitting: false,
    history: []
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  // 选择类型
  selectType(e) {
    this.setData({
      type: e.currentTarget.dataset.value
    })
  },

  // 输入内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  // 输入联系方式
  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    })
  },

  // 是否可以提交
  canSubmit() {
    const { type, content } = this.data
    return type && content.trim().length > 0
  },

  // 提交反馈
  async submitFeedback() {
    const { type, content, contact } = this.data

    if (!type) {
      wx.showToast({ title: '请选择反馈类型', icon: 'none' })
      return
    }

    if (!content.trim()) {
      wx.showToast({ title: '请填写反馈内容', icon: 'none' })
      return
    }

    this.setData({ isSubmitting: true })

    try {
      await app.request({
        url: '/feedback',
        method: 'POST',
        data: {
          type,
          content: content.trim(),
          contact: contact.trim()
        }
      })

      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })

      // 清空表单
      this.setData({
        type: '',
        content: '',
        contact: '',
        isSubmitting: false
      })

      // 刷新历史
      this.loadHistory()
    } catch (err) {
      this.setData({ isSubmitting: false })
      wx.showToast({
        title: err.message || '提交失败',
        icon: 'none'
      })
    }
  },

  // 加载历史反馈
  async loadHistory() {
    try {
      const result = await app.request({
        url: '/feedback'
      })
      this.setData({
        history: result.feedback || []
      })
    } catch (err) {
      console.error('加载反馈历史失败:', err)
    }
  },

  // 获取类型标签
  getTypeLabel(type) {
    const map = {
      bug: '功能异常',
      feature: '功能建议',
      ui: '界面问题',
      performance: '性能问题',
      other: '其他'
    }
    return map[type] || type
  },

  // 获取状态标签
  getStatusLabel(status) {
    const map = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      rejected: '已拒绝'
    }
    return map[status] || status
  }
})
