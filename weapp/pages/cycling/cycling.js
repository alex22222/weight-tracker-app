const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    distance: '',
    duration: '',
    note: '',
    date: '',
    records: [],
    totalDistance: 0,
    totalDuration: 0,
    isSubmitting: false,
  },

  goToHome() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  onLoad() {
    this.setData({ date: util.getTodayString() })
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    try {
      const result = await app.request({ url: '/cycling' })
      const records = result.entries || []

      const totalDistance = records.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0)
      const totalDuration = records.reduce((sum, r) => sum + (parseInt(r.duration) || 0), 0)

      this.setData({
        records: records.slice(0, 20).map(r => ({
          ...r,
          displayDate: this.formatDate(r.date)
        })),
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalDuration,
      })
    } catch (err) {
      console.error('加载骑行数据失败:', err)
    }
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  onDistanceInput(e) {
    this.setData({ distance: e.detail.value })
  },

  onDurationInput(e) {
    this.setData({ duration: e.detail.value })
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  async submitRecord() {
    const distance = parseFloat(this.data.distance)
    const duration = parseInt(this.data.duration)

    if (isNaN(distance) || distance <= 0) {
      wx.showToast({ title: '请输入有效的距离', icon: 'none' })
      return
    }
    if (isNaN(duration) || duration <= 0) {
      wx.showToast({ title: '请输入有效的时长', icon: 'none' })
      return
    }

    this.setData({ isSubmitting: true })
    try {
      await app.request({
        url: '/cycling',
        method: 'POST',
        data: {
          distance,
          duration,
          note: this.data.note || undefined,
          date: this.data.date,
        }
      })
      wx.showToast({ title: '记录成功', icon: 'success' })
      this.setData({ distance: '', duration: '', note: '', date: util.getTodayString() })
      await this.loadData()
    } catch (err) {
      wx.showToast({ title: err.message || '记录失败', icon: 'none' })
    } finally {
      this.setData({ isSubmitting: false })
    }
  },

  async deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      confirmColor: '#ef4444',
    })
    if (!res.confirm) return

    try {
      await app.request({ url: `/cycling?id=${id}`, method: 'DELETE' })
      wx.showToast({ title: '已删除', icon: 'success' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  }
})
