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
    userInfo: null,
    avatarText: '用',
    welcomeName: '用户',

    currentWeightText: '--',
    weightDiffText: '',
    weightDiffValue: '',
    weightDiffClass: '',
    _version: 'v2-' + Date.now() // 缓存破坏标记
  },

  onLoad() {
    console.log('【INDEX】Page onLoad, version:', this.data._version)
    const userInfo = app.globalData.userInfo
    this.setData({
      date: util.getTodayString(),
      userInfo: userInfo,
      avatarText: this.getAvatarText(userInfo),
      welcomeName: (userInfo?.nickname || userInfo?.username || '用户')
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
            formattedDate: `${date.getMonth() + 1}月${date.getDate()}日`,
            daysAgo: diffDays
          }
        })
      }
    } catch (err) {
      console.error('加载上次记录失败:', err)
    }
  },

  // 获取头像文字
  getAvatarText(userInfo) {
    if (!userInfo) return '用'
    const name = userInfo.nickname || userInfo.username || '用'
    return name.charAt(0)
  },

  onShow() {
    console.log('【INDEX】Page onShow')
    // 每次显示时从 globalData 同步用户信息头像
    const userInfo = app.globalData.userInfo
    this.setData({
      userInfo: userInfo,
      avatarText: this.getAvatarText(userInfo),
      welcomeName: (userInfo?.nickname || userInfo?.username || '用户')
    })
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
        
        // 保存头像到 data
        if (settingsResponse.user?.avatar) {
          const newUserInfo = { ...app.globalData.userInfo, avatar: settingsResponse.user.avatar }
          app.updateUserInfo(newUserInfo)
          this.setData({ 
            userInfo: newUserInfo,
            avatarText: this.getAvatarText(newUserInfo)
          })
        }
      }
      
    } catch (overallError) {
      console.error('【INDEX】loadData 整体错误:', overallError)
    }

    // 确保头像从 globalData 同步
    const curUserInfo = this.data.userInfo
    const globalUserInfo = app.globalData.userInfo
    if (globalUserInfo?.avatar && globalUserInfo.avatar !== curUserInfo?.avatar) {
      this.setData({
        userInfo: globalUserInfo,
        avatarText: this.getAvatarText(globalUserInfo)
      })
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
    const userInfo = this.data.userInfo
    const welcomeName = (userInfo?.nickname || userInfo?.username || '用户')
    const currentWeightText = currentWeight > 0 ? currentWeight.toFixed(1) : '--'
    const weightDiffText = weightDiff > 0 ? '超出' : '距离'
    const weightDiffValue = Math.abs(weightDiff).toFixed(1)
    const weightDiffClass = weightDiff > 0 ? 'text-danger' : 'text-success'
    
    // 生成图表数据 - 使用安全排序
    let chartData = []
    try {
      if (sortedEntries.length > 0) {
        const chartSorted = safeSort(sortedEntries, false).slice(-7)
        chartData = chartSorted.map(e => ({
          date: util.formatShortDate(e.date),
          weight: parseFloat(e.weight) || 0,
          fullDate: e.date
        }))
      }
    } catch (chartError) {
      console.error('【INDEX】图表数据处理失败:', chartError)
    }
    
    console.log('【INDEX】更新页面数据:', { 
      currentWeight, 
      entriesCount: sortedEntries.length,
      chartCount: chartData.length 
    })
    
    // 更新页面数据
    this.setData({
      entries: sortedEntries, 
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
      welcomeName,
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

    const query = wx.createSelectorQuery()
    query.select('#weightChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return
        
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        const width = res[0].width
        const height = res[0].height
        const padding = { top: 30, right: 20, bottom: 40, left: 50 }
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
          ctx.font = '22rpx sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText(weightValue.toFixed(1), padding.left - 10, y + 6)
        }

        if (chartData.length > 1) {
          ctx.strokeStyle = '#f97316'
          ctx.lineWidth = 3
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          
          ctx.beginPath()
          chartData.forEach((d, i) => {
            const x = padding.left + (chartWidth / (chartData.length - 1)) * i
            const y = padding.top + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.stroke()

          ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
          ctx.lineTo(padding.left, padding.top + chartHeight)
          ctx.closePath()
          
          const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)')
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0)')
          ctx.fillStyle = gradient
          ctx.fill()
        }

        chartData.forEach((d, i) => {
          const x = padding.left + (chartWidth / Math.max(chartData.length - 1, 1)) * i
          const y = padding.top + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight
          
          ctx.beginPath()
          ctx.arc(x, y, 6, 0, Math.PI * 2)
          ctx.fillStyle = 'white'
          ctx.fill()
          ctx.strokeStyle = '#f97316'
          ctx.lineWidth = 2
          ctx.stroke()
          
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fillStyle = '#f97316'
          ctx.fill()

          ctx.fillStyle = '#64748b'
          ctx.font = '20rpx sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(d.date, x, height - 10)
        })
      })
  },

  onChartTouch() {},
})
