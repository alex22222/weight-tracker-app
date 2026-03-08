// pages/logs/logs.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    entries: []
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }
  },

  onShow() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }
    this.loadData()
  },

  async loadData() {
    try {
      const entries = await app.request({
        url: '/weight'
      })
      
      // 按日期降序排序
      entries.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      // 添加格式化日期和变化量
      const formattedEntries = entries.map((entry, index) => {
        const nextEntry = entries[index + 1]
        const change = nextEntry ? entry.weight - nextEntry.weight : null
        
        return {
          ...entry,
          formattedDate: util.formatDate(entry.date),
          change: change
        }
      })
      
      this.setData({ entries: formattedEntries })
    } catch (err) {
      console.error('加载记录失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 删除单条记录
  async deleteEntry(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/weight?id=${id}`,
              method: 'DELETE'
            })
            
            wx.showToast({
              title: '已删除',
              icon: 'success'
            })
            
            this.loadData()
          } catch (err) {
            wx.showToast({
              title: err.message || '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 跳转到记录页
  goToRecord() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
