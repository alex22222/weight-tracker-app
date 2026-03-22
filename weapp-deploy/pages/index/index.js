// pages/index/index.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    isLoading: false,
    weight: '',
    note: '',
    date: '',
    settings: { height: 170, targetWeight: 65 },
    tempHeight: '170',
    tempTargetWeight: '65',
    tempGender: 'other',
    showSettings: false,
    gender: 'other',
    entries: [],
    currentWeight: 0,
    bmi: 0,
    bmiCategory: { label: '暂无数据', color: '#94a3b8' },
    bmiStyle: { bg: 'bg-gray-light', color: '#94a3b8', border: '2rpx solid #e2e8f0' },
    weightDiff: 0,
    chartData: [],
    userInfo: null,
    activeChannel: null,
    weather: null
  },

  onLoad() {
    this.setData({
      date: util.getTodayString(),
      userInfo: app.globalData.userInfo
    })
  },

  onShow() {
    this.loadData()
    this.loadActiveChannel()
    this.loadWeather()
  },

  // 加载数据
  async loadData() {
    try {
      const entries = await app.request({ url: '/weight' })
      const settingsResult = await app.request({ url: '/settings' })
      
      const settings = settingsResult.settings || { height: 170, targetWeight: 65 }
      const gender = settingsResult.user?.gender || 'other'
      
      entries.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      const currentWeight = entries.length > 0 ? entries[0].weight : 0
      const bmi = util.calculateBMI(currentWeight, settings.height)
      const bmiCategory = util.getBMICategory(bmi)
      const bmiStyle = util.getBMIStyles(bmi)
      const weightDiff = currentWeight - settings.targetWeight
      
      const chartData = [...entries]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7)
        .map(e => ({
          date: util.formatShortDate(e.date),
          weight: e.weight,
          fullDate: e.date
        }))
      
      this.setData({
        entries, settings, gender,
        tempHeight: String(settings.height),
        tempTargetWeight: String(settings.targetWeight),
        tempGender: gender,
        currentWeight, bmi, bmiCategory, bmiStyle, weightDiff, chartData
      }, () => {
        if (chartData.length > 0) this.drawChart()
      })
    } catch (err) {
      console.error('加载数据失败:', err)
    }
  },
  
  async loadActiveChannel() {
    try {
      const result = await app.request({ url: '/channels' })
      const activeChannel = result.channels?.find(
        c => c.status === 'PENDING' || c.status === 'ACTIVE'
      )
      this.setData({ activeChannel: activeChannel || null })
    } catch (err) {
      console.error('加载频道失败:', err)
    }
  },
  
  async loadWeather() {
    try {
      const result = await app.request({ url: '/weather' })
      this.setData({ weather: result })
    } catch (err) {
      console.error('加载天气失败:', err)
    }
  },

  onDateChange(e) { this.setData({ date: e.detail.value }) },
  onWeightInput(e) { this.setData({ weight: e.detail.value }) },
  onNoteInput(e) { this.setData({ note: e.detail.value }) },
  onHeightInput(e) { this.setData({ tempHeight: e.detail.value }) },
  onTargetWeightInput(e) { this.setData({ tempTargetWeight: e.detail.value }) },
  onGenderChange(e) {
    const genders = ['male', 'female', 'other']
    this.setData({ tempGender: genders[e.detail.value] })
  },

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

  toggleSettings() { this.setData({ showSettings: !this.data.showSettings }) },
  openSettings() { this.setData({ showSettings: true }) },

  async saveSettings() {
    const height = parseFloat(this.data.tempHeight)
    const targetWeight = parseFloat(this.data.tempTargetWeight)

    if (isNaN(height) || height <= 0 || isNaN(targetWeight) || targetWeight <= 0) {
      wx.showToast({ title: '请输入有效的数值', icon: 'none' })
      return
    }

    try {
      await app.request({
        url: '/settings',
        method: 'POST',
        data: { height, targetWeight }
      })
      await app.request({
        url: '/settings',
        method: 'PATCH',
        data: { gender: this.data.tempGender }
      })

      wx.showToast({ title: '设置已保存', icon: 'success' })
      this.setData({ showSettings: false })
      await this.loadData()
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    }
  },

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
          ctx.strokeStyle = '#10b981'
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
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
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
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 2
          ctx.stroke()
          
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fillStyle = '#10b981'
          ctx.fill()

          ctx.fillStyle = '#64748b'
          ctx.font = '20rpx sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(d.date, x, height - 10)
        })
      })
  },

  goToChannel() {
    const { activeChannel } = this.data
    if (activeChannel) {
      wx.navigateTo({ url: `/pages/channel/detail?id=${activeChannel.id}` })
    } else {
      wx.navigateTo({ url: '/pages/channel/channel' })
    }
  },

  logout() {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          wx.reLaunch({ url: '/pages/login/login' })
        }
      }
    })
  },

  onChartTouch() {},

  onShareAppMessage() {
    const username = this.data.userInfo?.username || '好友'
    return {
      title: `${username} 邀请你一起记录体重，坚持健身！`,
      path: '/pages/login/login'
    }
  },

  onShareTimeline() {
    const username = this.data.userInfo?.username || '好友'
    return {
      title: `${username} 正在用体重管理器记录体重变化，邀请你一起加入！`,
      query: 'from=timeline'
    }
  }
})
