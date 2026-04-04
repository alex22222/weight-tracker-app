// pages/reading/reading.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    // 连续打卡天数
    streakDays: 0,
    
    // 表单数据
    bookName: '',
    pages: '',
    note: '',
    
    // 提交状态
    isSubmitting: false,
    
    // 阅读记录
    records: [],
    
    // 今天是否已打卡
    hasCheckedInToday: false
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    try {
      const result = await app.request({ url: '/reading' })
      
      this.setData({
        streakDays: result.streak || 0,
        records: result.entries || [],
        hasCheckedInToday: this.checkIfCheckedInToday(result.entries || [])
      })
    } catch (err) {
      console.error('加载读书数据失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 检查今天是否已打卡
  checkIfCheckedInToday(entries) {
    const today = util.getTodayString()
    return entries.some(e => e.date === today)
  },

  // 输入书名
  onBookNameInput(e) {
    this.setData({ bookName: e.detail.value })
  },

  // 输入页数
  onPagesInput(e) {
    this.setData({ pages: e.detail.value })
  },

  // 输入笔记
  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  // 提交打卡
  async submitCheckIn() {
    const { bookName, pages, note, hasCheckedInToday } = this.data
    
    // 验证
    if (!bookName.trim()) {
      wx.showToast({ title: '请输入书名', icon: 'none' })
      return
    }
    
    if (!pages || isNaN(parseInt(pages)) || parseInt(pages) <= 0) {
      wx.showToast({ title: '请输入有效的页数', icon: 'none' })
      return
    }

    if (hasCheckedInToday) {
      wx.showToast({ title: '今天已经打卡了', icon: 'none' })
      return
    }

    this.setData({ isSubmitting: true })

    try {
      const result = await app.request({
        url: '/reading',
        method: 'POST',
        data: {
          bookName: bookName.trim(),
          pages: parseInt(pages),
          note: note.trim() || undefined,
          date: util.getTodayString()
        }
      })

      wx.showToast({
        title: '打卡成功',
        icon: 'success'
      })

      // 更新数据
      this.setData({
        bookName: '',
        pages: '',
        note: '',
        streakDays: result.streak || 0,
        hasCheckedInToday: true
      })

      // 刷新记录列表
      await this.loadData()
    } catch (err) {
      console.error('打卡失败:', err)
      wx.showToast({
        title: err.message || '打卡失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isSubmitting: false })
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadData()
    wx.stopPullDownRefresh()
  }
})
