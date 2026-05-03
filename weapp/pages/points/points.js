// pages/points/points.js
const app = getApp()

Page({
  data: {
    summary: {
      totalPoints: 0,
      todayPoints: 0,
      weekPoints: 0,
      monthPoints: 0,
      currentStreak: {
        fitness: 0,
        reading: 0
      }
    },
    logs: [],
    page: 1,
    hasMore: true,
    isLoading: false,
    ranking: [],
    showRanking: false
  },

  onLoad() {
    this.loadPointsSummary()
    this.loadPointsLogs()
    this.loadRanking()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    Promise.all([
      this.loadPointsSummary(),
      this.loadPointsLogs()
    ]).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载积分排行
  async loadRanking() {
    try {
      const result = await app.request({
        url: '/points/ranking'
      })
      this.setData({ ranking: result.ranking || [] })
    } catch (err) {
      console.error('加载排行失败:', err)
    }
  },

  // 切换排行显示
  toggleRanking() {
    this.setData({ showRanking: !this.data.showRanking })
  },

  // 显示积分规则
  showRules() {
    this.setData({ showRules: true })
  },

  // 隐藏积分规则
  hideRules() {
    this.setData({ showRules: false })
  },

  preventTouchMove() {
    return
  },

  // 加载积分统计
  async loadPointsSummary() {
    try {
      const result = await app.request({
        url: '/points'
      })
      this.setData({ summary: result })
    } catch (err) {
      console.error('加载积分统计失败:', err)
    }
  },

  // 加载积分记录
  async loadPointsLogs() {
    if (this.data.isLoading || !this.data.hasMore) return

    this.setData({ isLoading: true })

    try {
      const { page } = this.data
      const result = await app.request({
        url: `/points?type=logs&page=${page}&limit=20`
      })

      const logs = page === 1 ? result.logs : [...this.data.logs, ...result.logs]
      
      this.setData({
        logs,
        page: page + 1,
        hasMore: logs.length < result.total,
        isLoading: false
      })
    } catch (err) {
      console.error('加载积分记录失败:', err)
      this.setData({ isLoading: false })
    }
  },

  // 加载更多
  onReachBottom() {
    this.loadPointsLogs()
  },

  // 获取积分类型图标
  getPointsIcon(type) {
    const icons = {
      login: '📅',
      checkin_fitness: '💪',
      checkin_reading: '📚',
      continuous_3: '🔥',
      continuous_7: '🌟',
      continuous_30: '🏆',
      admin_adjust: '⚙️'
    }
    return icons[type] || '💎'
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
})
