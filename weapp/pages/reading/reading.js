// pages/reading/reading.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    // 连续记录天数
    streakDays: 0,
    
    // 表单数据
    bookName: '',
    pages: '',
    note: '',
    
    // 提交状态
    isSubmitting: false,
    
    // 阅读记录
    records: [],
    
    // 今天是否已记录
    hasCheckedInToday: false,

    // 推荐书籍
    recommendBooks: []
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    try {
      const [readingResult, lastResult, recommendResult] = await Promise.all([
        app.request({ url: '/reading' }),
        app.request({ url: '/last-record?type=reading' }),
        app.request({ url: '/reading/recommendations' }).catch(() => ({ books: [] }))
      ])
      
      let lastRecord = null
      if (lastResult.entry) {
        const entry = lastResult.entry
        const date = new Date(entry.date)
        const now = new Date()
        const diffTime = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        lastRecord = {
          bookName: entry.bookName,
          pages: entry.pages,
          formattedDate: `${date.getMonth() + 1}月${date.getDate()}日`,
          daysAgo: diffDays
        }
      }
      
      this.setData({
        streakDays: readingResult.streak || 0,
        records: readingResult.entries || [],
        hasCheckedInToday: this.checkIfCheckedInToday(readingResult.entries || []),
        lastRecord,
        recommendBooks: recommendResult.books || []
      })
    } catch (err) {
      console.error('加载读书数据失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 检查今天是否已记录
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

  // 提交记录
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
      wx.showToast({ title: '今天已经记录过了', icon: 'none' })
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
        title: '记录成功',
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
      console.error('记录失败:', err)
      wx.showToast({
        title: err.message || '记录失败',
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
