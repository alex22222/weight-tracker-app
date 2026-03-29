// pages/logs/logs.js - 防缓存版本 v2
const util = require('../../utils/util.js')
const app = getApp()

// 强制转换为数组的纯函数
function forceArray(input) {
  if (Array.isArray(input)) return input
  if (input === null || input === undefined) return []
  if (typeof input === 'object') {
    if (Array.isArray(input.entries)) return input.entries
    if (Array.isArray(input.data)) return input.data
    if (Array.isArray(input.list)) return input.list
  }
  console.warn('【LOGS】无法转换为数组:', typeof input, input)
  return []
}

// 安全排序的纯函数
function safeSort(entries) {
  const arr = forceArray(entries)
  if (arr.length <= 1) return arr
  
  try {
    return arr.slice().sort((a, b) => {
      const timeA = a && a.date ? new Date(a.date).getTime() : 0
      const timeB = b && b.date ? new Date(b.date).getTime() : 0
      return timeB - timeA
    })
  } catch (e) {
    console.error('【LOGS】排序失败:', e)
    return arr
  }
}

Page({
  data: {
    entries: [],
    _version: 'v2-' + Date.now() // 缓存破坏标记
  },

  onLoad() {
    console.log('【LOGS】Page onLoad, version:', this.data._version)
    this.loadData()
  },

  onShow() {
    console.log('【LOGS】Page onShow')
    this.loadData()
  },

  async loadData() {
    console.log('【LOGS】=== 开始加载数据 ===')
    
    try {
      const result = await app.request({
        url: '/weight'
      })
      
      console.log('【LOGS】API返回:', typeof result)
      
      // 强制转换为数组
      const entries = forceArray(result)
      console.log('【LOGS】entries 数组长度:', entries.length)
      
      // 安全排序
      const sortedEntries = safeSort(entries)
      
      // 添加格式化日期和变化量
      const formattedEntries = sortedEntries.map((entry, index) => {
        const nextEntry = sortedEntries[index + 1]
        const change = nextEntry ? (parseFloat(entry.weight) || 0) - (parseFloat(nextEntry.weight) || 0) : null
        
        return {
          ...entry,
          formattedDate: util.formatDate(entry.date),
          change: change
        }
      })
      
      this.setData({ entries: formattedEntries })
      console.log('【LOGS】=== 加载完成 ===')
      
    } catch (err) {
      console.error('【LOGS】加载记录失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ entries: [] })
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadData()
    wx.stopPullDownRefresh()
  }
})
