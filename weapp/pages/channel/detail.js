// pages/channel/detail.js
const app = getApp()

Page({
  data: {
    taskId: '',
    task: null,
    members: [],
    checkIns: [],
    isLoading: true,
    
    // 排行榜数据
    ranking: [],
    myRank: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ taskId: options.id })
      this.loadTaskDetail()
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  onPullDownRefresh() {
    this.loadTaskDetail()
  },

  // 加载任务详情
  async loadTaskDetail() {
    this.setData({ isLoading: true })
    try {
      const result = await app.request({ 
        url: `/tasks?id=${this.data.taskId}` 
      })
      
      const task = result.task
      const members = result.members || []
      const checkIns = result.checkIns || []
      
      // 计算排行榜
      const memberStats = members.map(m => {
        const memberCheckIns = checkIns.filter(c => 
          String(c.userId) === String(m.userId)
        )
        return {
          ...m,
          checkInCount: memberCheckIns.length,
          lastCheckIn: memberCheckIns[0]?.checkedAt || null
        }
      })
      
      // 排序：打卡次数多的在前，相同则按最后打卡时间
      memberStats.sort((a, b) => {
        if (b.checkInCount !== a.checkInCount) {
          return b.checkInCount - a.checkInCount
        }
        const timeA = a.lastCheckIn ? new Date(a.lastCheckIn).getTime() : 0
        const timeB = b.lastCheckIn ? new Date(b.lastCheckIn).getTime() : 0
        return timeB - timeA
      })
      
      // 添加排名
      const ranking = memberStats.map((m, index) => ({
        ...m,
        rank: index + 1
      }))
      
      // 计算我的排名
      const myUserId = app.globalData.userInfo?.id
      const myRank = ranking.findIndex(r => String(r.userId) === String(myUserId))
      
      this.setData({
        task,
        members,
        checkIns,
        ranking,
        myRank: myRank >= 0 ? myRank + 1 : 0,
        isLoading: false
      })
    } catch (err) {
      console.error('加载任务详情失败:', err)
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  },

  // 格式化时间
  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    
    if (diff < minute) return '刚刚'
    if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
    if (diff < day) return `${Math.floor(diff / hour)}小时前`
    if (diff < 7 * day) return `${Math.floor(diff / day)}天前`
    
    return this.formatDate(dateStr)
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})
