// pages/index/index.js - 防缓存版本 v2
const util = require('../../utils/util.js')
const app = getApp()

// 强制转换为数组的纯函数（不依赖 this）
function forceArray(input) {
  if (Array.isArray(input)) return input
  if (input === null || input === undefined) return []
  if (typeof input === 'object') {
    if (Array.isArray(input.entries)) return input.entries
    if (Array.isArray(input.data)) return input.data
    if (Array.isArray(input.list)) return input.list
  }
  console.warn('【INDEX】无法转换为数组:', typeof input, input)
  return []
}

// 安全排序的纯函数
function safeSort(entries, desc = true) {
  const arr = forceArray(entries)
  if (arr.length <= 1) return arr
  
  try {
    const sorted = arr.slice().sort((a, b) => {
      const timeA = a && a.date ? new Date(a.date).getTime() : 0
      const timeB = b && b.date ? new Date(b.date).getTime() : 0
      return desc ? timeB - timeA : timeA - timeB
    })
    return sorted
  } catch (e) {
    console.error('【INDEX】排序失败:', e)
    return arr
  }
}

Page({
  data: {
    isLoading: false,
    weight: '',
    note: '',
    date: '',
    settings: { height: 170, targetWeight: 65 },
    gender: 'male',
    entries: [],
    currentWeight: 0,
    bmi: 0,
    bmiCategory: { label: '暂无数据', color: '#94a3b8' },
    bmiStyle: { bg: 'bg-gray-light', color: '#94a3b8', border: '2rpx solid #e2e8f0' },
    weightDiff: 0,
    chartData: [],
    chartViewMode: 'day', // day | week | month
    loadError: '',

    currentWeightText: '--',
    weightDiffText: '',
    weightDiffValue: '',
    weightDiffClass: '',
    _version: 'v2-' + Date.now() // 缓存破坏标记
  },

  goToHome() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  onLoad() {
    console.log('【INDEX】Page onLoad, version:', this.data._version)
    const userInfo = app.globalData.userInfo
    this.setData({
      date: util.getTodayString(),
    })
    this.loadLastRecord()
  },

  // 加载上次记录
  async loadLastRecord() {
    try {
      const result = await app.request({
        url: '/last-record?type=weight'
      })
      if (result.entry) {
        const entry = result.entry
        const date = new Date(entry.date)
        const now = new Date()
        const diffTime = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        this.setData({
          lastRecord: {
            weight: entry.weight,
            formattedDate: this.formatDisplayDate(entry.date),
            daysAgo: diffDays
          }
        })
      }
    } catch (err) {
      console.error('加载上次记录失败:', err)
    }
  },

  onShow() {
    console.log('【INDEX】Page onShow')
    this.loadLastRecord()
    this.loadData()
  },

  // 加载数据 - 彻底重写，避免任何可能的 sort 调用错误
  async loadData() {
    console.log('【INDEX】=== 开始加载数据 ===')
    
    let entries = []
    let settings = { height: 170, targetWeight: 65 }
    let gender = 'male'
    
    try {
      // 获取体重数据
      let weightResponse = null
      try {
        weightResponse = await app.request({ url: '/weight' })
        console.log('【INDEX】体重API返回:', typeof weightResponse)
      } catch (e) {
        console.error('【INDEX】请求体重数据失败:', e)
      }
      
      // 强制转换为数组
      entries = forceArray(weightResponse)
      console.log('【INDEX】entries 数组长度:', entries.length)
      
      // 获取设置数据
      let settingsResponse = null
      try {
        settingsResponse = await app.request({ url: '/settings' })
      } catch (e) {
        console.error('【INDEX】请求设置数据失败:', e)
      }
      
      // 解析设置
      if (settingsResponse && typeof settingsResponse === 'object') {
        const s = settingsResponse.settings || settingsResponse
        if (s && typeof s === 'object') {
          settings.height = s.height || 170
          settings.targetWeight = s.targetWeight || 65
        }
        gender = settingsResponse.gender || settingsResponse.user?.gender || 'male'
      }
      
    } catch (overallError) {
      console.error('【INDEX】loadData 整体错误:', overallError)
    }

    // === 关键：确保 entries 一定是数组 ===
    if (!Array.isArray(entries)) {
      console.error('【INDEX】entries 不是数组，强制设为空数组')
      entries = []
    }
    
    console.log('【INDEX】处理 entries:', entries.length, '条')
    
    // === 关键：使用安全排序，不直接调用 entries.sort ===
    const sortedEntries = safeSort(entries, true)
    
    // 计算统计数据
    const currentWeight = sortedEntries.length > 0 ? (parseFloat(sortedEntries[0].weight) || 0) : 0
    const bmi = util.calculateBMI(currentWeight, settings.height)
    const bmiCategory = util.getBMICategory(bmi)
    const bmiStyle = util.getBMIStyles(bmi)
    const weightDiff = currentWeight - (settings.targetWeight || 65)
    
    // 计算展示用的值（避免 WXML 复杂表达式）
    const currentWeightText = currentWeight > 0 ? currentWeight.toFixed(1) : '--'
    const weightDiffText = weightDiff > 0 ? '超出' : '距离'
    const weightDiffValue = Math.abs(weightDiff).toFixed(1)
    const weightDiffClass = weightDiff > 0 ? 'text-danger' : 'text-success'
    
    // 生成图表数据 - 根据视图模式聚合
    let chartData = []
    try {
      if (sortedEntries.length > 0) {
        const mode = this.data.chartViewMode || 'day'
        let aggregatedEntries = []

        if (mode === 'day') {
          // 按天去重，每天保留最后一条（最新的），显示最近5天
          const dayMap = new Map()
          for (const e of sortedEntries) {
            const d = new Date(e.date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            dayMap.set(key, e)
          }
          aggregatedEntries = Array.from(dayMap.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-5)
        } else if (mode === 'week') {
          // 按周去重，每周保留最新一条（reverse 后新的会覆盖旧的）
          const weekMap = new Map()
          for (const e of [...sortedEntries].reverse()) {
            const key = this.getWeekKey(e.date)
            weekMap.set(key, e)
          }
          aggregatedEntries = Array.from(weekMap.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-8)
        } else if (mode === 'month') {
          // 按月去重，每月保留最后一条
          const monthMap = new Map()
          for (const e of sortedEntries) {
            const d = new Date(e.date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            monthMap.set(key, e)
          }
          aggregatedEntries = Array.from(monthMap.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-6)
        }

        chartData = aggregatedEntries.map(e => ({
          date: this.formatChartDate(e.date, mode),
          weight: parseFloat(e.weight) || 0,
          fullDate: e.date
        }))
      }
    } catch (chartError) {
      console.error('【INDEX】图表数据处理失败:', chartError)
    }
    
    // 为每条记录添加格式化日期
    const entriesWithDate = sortedEntries.map(e => ({
      ...e,
      displayDate: this.formatDisplayDate(e.date)
    }))
    
    console.log('【INDEX】更新页面数据:', { 
      currentWeight, 
      entriesCount: sortedEntries.length,
      chartCount: chartData.length 
    })
    
    // 更新页面数据
    this.setData({
      entries: entriesWithDate, 
      settings, 
      gender,
      currentWeight, 
      currentWeightText,
      bmi, 
      bmiCategory, 
      bmiStyle, 
      weightDiff, 
      weightDiffText,
      weightDiffValue,
      weightDiffClass,
      chartData
    }, () => {
      if (chartData.length > 0) {
        this.drawChart()
      }
    })
    
    console.log('【INDEX】=== 加载数据完成 ===')
  },
  
  onDateChange(e) { this.setData({ date: e.detail.value }) },
  onWeightInput(e) { this.setData({ weight: e.detail.value }) },
  onNoteInput(e) { this.setData({ note: e.detail.value }) },


async addEntry() {
    const weight = parseFloat(this.data.weight)
    
    if (isNaN(weight) || weight <= 0 || weight > 500) {
      wx.showToast({ title: '请输入有效的体重值', icon: 'none' })
      return
    }

    this.setData({ isLoading: true })

    try {
      await app.request({
        url: '/weight',
        method: 'POST',
        data: {
          weight,
          note: this.data.note || undefined,
          date: this.data.date
        }
      })

      wx.showToast({ title: '记录成功', icon: 'success' })
      this.setData({ weight: '', note: '', date: util.getTodayString() })
      await this.loadData()
    } catch (err) {
      wx.showToast({ title: err.message || '记录失败', icon: 'none' })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  drawChart() {
    const { chartData } = this.data
    if (!Array.isArray(chartData) || chartData.length === 0) return

    const sysInfo = wx.getSystemInfoSync()
    const dpr = sysInfo.pixelRatio
    const rpx = sysInfo.windowWidth / 750

    const query = wx.createSelectorQuery()
    query.select('#weightChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return
        
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        const width = res[0].width
        const height = res[0].height
        const padding = { top: 30 * rpx, right: 20 * rpx, bottom: 40 * rpx, left: 50 * rpx }
        const chartWidth = width - padding.left - padding.right
        const chartHeight = height - padding.top - padding.bottom

        ctx.clearRect(0, 0, width, height)

        const weights = chartData.map(d => d.weight)
        const minWeight = Math.min(...weights) - 1
        const maxWeight = Math.max(...weights) + 1
        const weightRange = maxWeight - minWeight || 1

        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        
        for (let i = 0; i <= 4; i++) {
          const y = padding.top + (chartHeight / 4) * i
          ctx.beginPath()
          ctx.moveTo(padding.left, y)
          ctx.lineTo(width - padding.right, y)
          ctx.stroke()
          
          const weightValue = maxWeight - (weightRange / 4) * i
          ctx.fillStyle = '#64748b'
          ctx.font = `${Math.round(22 * rpx)}px sans-serif`
          ctx.textAlign = 'right'
          ctx.fillText(weightValue.toFixed(1), padding.left - 10 * rpx, y + 6 * rpx)
        }

        // 绘制折线和渐变填充（至少1个点也画，方便后续扩展）
        ctx.strokeStyle = '#f97316'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        ctx.beginPath()
        chartData.forEach((d, i) => {
          const x = padding.left + (chartWidth / Math.max(chartData.length - 1, 1)) * i
          const y = padding.top + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()

        // 填充渐变区域（至少2个点才填充，否则不好看）
        if (chartData.length > 1) {
          ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
          ctx.lineTo(padding.left, padding.top + chartHeight)
          ctx.closePath()
          
          const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)')
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0)')
          ctx.fillStyle = gradient
          ctx.fill()
        }

        // 绘制数据点和标签
        chartData.forEach((d, i) => {
          const x = padding.left + (chartWidth / Math.max(chartData.length - 1, 1)) * i
          const y = padding.top + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight
          
          ctx.beginPath()
          ctx.arc(x, y, 6 * rpx, 0, Math.PI * 2)
          ctx.fillStyle = 'white'
          ctx.fill()
          ctx.strokeStyle = '#f97316'
          ctx.lineWidth = 2
          ctx.stroke()
          
          ctx.beginPath()
          ctx.arc(x, y, 3 * rpx, 0, Math.PI * 2)
          ctx.fillStyle = '#f97316'
          ctx.fill()

          ctx.fillStyle = '#64748b'
          ctx.font = `${Math.round(20 * rpx)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(d.date, x, height - 10 * rpx)
        })
      })
  },

  onChartTouch() {},

  // 切换图表视图模式
  switchChartView(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === this.data.chartViewMode) return
    this.setData({ chartViewMode: mode }, () => {
      this.loadData()
    })
  },

  // 计算 ISO 周数 key
  getWeekKey(dateStr) {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `${d.getFullYear()}-W${weekNo}`
  },

  // 格式化图表日期标签
  formatChartDate(dateStr, mode) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (mode === 'day') {
      return util.formatShortDate(dateStr)
    }
    if (mode === 'week') {
      // 显示周号，如 "W12"
      const weekKey = this.getWeekKey(dateStr)
      const match = weekKey.match(/W(\d+)/)
      return match ? 'W' + match[1] : util.formatShortDate(dateStr)
    }
    if (mode === 'month') {
      return `${date.getMonth() + 1}月`
    }
    return util.formatShortDate(dateStr)
  },

  // 格式化日期显示（今天/昨天/N天前/X月X日）
  formatDisplayDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays <= 7) return `${diffDays}天前`
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  },
})
