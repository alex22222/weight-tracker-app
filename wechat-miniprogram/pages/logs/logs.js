// pages/logs/logs.js
const util = require('../../utils/util.js')

Page({
  data: {
    entries: []
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const entries = wx.getStorageSync('weightEntries') || []
    
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
  },

  // 删除单条记录
  deleteEntry(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          let entries = wx.getStorageSync('weightEntries') || []
          entries = entries.filter(e => e.id !== id)
          wx.setStorageSync('weightEntries', entries)
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          })
          
          this.loadData()
        }
      }
    })
  },

  // 清空所有记录
  clearAll() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有记录吗？此操作不可恢复！',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('weightEntries', [])
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
          
          this.loadData()
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