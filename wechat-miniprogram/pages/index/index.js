// pages/index/index.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    // 表单数据
    weight: '',
    note: '',
    date: '',

    // 设置
    settings: {
      height: 170,
      targetWeight: 65
    },
    tempHeight: '170',
    tempTargetWeight: '65',
    showSettings: false,

    // 统计数据
    entries: [],
    currentWeight: 0,
    bmi: 0,
    bmiCategory: { label: '暂无数据', color: '#94a3b8' },
    bmiStyle: { bg: 'bg-gray-light', color: '#94a3b8', border: '2rpx solid #e2e8f0' },
    weightDiff: 0,

    // 图表数据
    chartData: [],

    // 用户信息
    currentUser: null
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.setData({
      date: util.getTodayString(),
      currentUser: app.globalData.currentUser
    })
    this.loadData()
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

  onShow() {
    this.loadData()
  },

  onReady() {
    this.drawChart()
  },

  // 加载数据
  loadData() {
    const entries = wx.getStorageSync('weightEntries') || []
    const settings = wx.getStorageSync('userSettings') || { height: 170, targetWeight: 65 }
    
    // 按日期降序排序
    entries.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    const currentWeight = entries.length > 0 ? entries[0].weight : 0
    const bmi = util.calculateBMI(currentWeight, settings.height)
    const bmiCategory = util.getBMICategory(bmi)
    const bmiStyle = util.getBMIStyles(bmi)
    const weightDiff = currentWeight - settings.targetWeight
    
    // 准备图表数据（最近7条，按时间升序）
    const chartData = [...entries]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7)
      .map(e => ({
        date: util.formatShortDate(e.date),
        weight: e.weight,
        fullDate: e.date
      }))
    
    this.setData({
      entries,
      settings,
      tempHeight: String(settings.height),
      tempTargetWeight: String(settings.targetWeight),
      currentWeight,
      bmi,
      bmiCategory,
      bmiStyle,
      weightDiff,
      chartData
    }, () => {
      this.drawChart()
    })
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  // 体重输入
  onWeightInput(e) {
    this.setData({ weight: e.detail.value })
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  // 身高输入
  onHeightInput(e) {
    this.setData({ tempHeight: e.detail.value })
  },

  // 目标体重输入
  onTargetWeightInput(e) {
    this.setData({ tempTargetWeight: e.detail.value })
  },

  // 添加记录
  addEntry() {
    const weight = parseFloat(this.data.weight)
    
    if (isNaN(weight) || weight <= 0 || weight > 500) {
      wx.showToast({
        title: '请输入有效的体重值',
        icon: 'none'
      })
      return
    }

    const entry = {
      id: util.generateId(),
      weight: weight,
      note: this.data.note || null,
      date: this.data.date,
      createdAt: new Date().toISOString()
    }

    const entries = wx.getStorageSync('weightEntries') || []
    entries.unshift(entry)
    wx.setStorageSync('weightEntries', entries)

    wx.showToast({
      title: '记录成功',
      icon: 'success'
    })

    this.setData({
      weight: '',
      note: '',
      date: util.getTodayString()
    }, () => {
      this.loadData()
    })
  },

  // 切换设置面板
  toggleSettings() {
    this.setData({ showSettings: !this.data.showSettings })
  },

  // 保存设置
  saveSettings() {
    const height = parseFloat(this.data.tempHeight)
    const targetWeight = parseFloat(this.data.tempTargetWeight)

    if (isNaN(height) || height <= 0 || isNaN(targetWeight) || targetWeight <= 0) {
      wx.showToast({
        title: '请输入有效的数值',
        icon: 'none'
      })
      return
    }

    const settings = { height, targetWeight }
    wx.setStorageSync('userSettings', settings)

    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    })

    this.setData({ showSettings: false }, () => {
      this.loadData()
    })
  },

  // 绘制图表
  drawChart() {
    const { chartData } = this.data
    if (chartData.length === 0) return

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

        // 清空画布
        ctx.clearRect(0, 0, width, height)

        // 计算数据范围
        const weights = chartData.map(d => d.weight)
        const minWeight = Math.min(...weights) - 1
        const maxWeight = Math.max(...weights) + 1
        const weightRange = maxWeight - minWeight || 1

        // 绘制网格线
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        
        // 水平网格线
        for (let i = 0; i <= 4; i++) {
          const y = padding.top + (chartHeight / 4) * i
          ctx.beginPath()
          ctx.moveTo(padding.left, y)
          ctx.lineTo(width - padding.right, y)
          ctx.stroke()
          
          // Y轴标签
          const weightValue = maxWeight - (weightRange / 4) * i
          ctx.fillStyle = '#64748b'
          ctx.font = '22rpx sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText(weightValue.toFixed(1), padding.left - 10, y + 6)
        }

        // 绘制数据线
        if (chartData.length > 1) {
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 3
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          
          ctx.beginPath()
          chartData.forEach((d, i) => {
            const x = padding.left + (chartWidth / (chartData.length - 1)) * i
            const y = padding.top + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight
            
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          })
          ctx.stroke()

          // 填充渐变区域
          ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
          ctx.lineTo(padding.left, padding.top + chartHeight)
          ctx.closePath()
          
          const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
          ctx.fillStyle = gradient
          ctx.fill()
        }

        // 绘制数据点
        chartData.forEach((d, i) => {
          const x = padding.left + (chartWidth / Math.max(chartData.length - 1, 1)) * i
          const y = padding.top + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight
          
          // 外圈
          ctx.beginPath()
          ctx.arc(x, y, 6, 0, Math.PI * 2)
          ctx.fillStyle = 'white'
          ctx.fill()
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 2
          ctx.stroke()
          
          // 内圈
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fillStyle = '#10b981'
          ctx.fill()

          // X轴标签
          ctx.fillStyle = '#64748b'
          ctx.font = '20rpx sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(d.date, x, height - 10)
        })
      })
  },

  // 登出
  logout() {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  },

  onChartTouch() {
    // 图表触摸交互可以在这里扩展
  }
})