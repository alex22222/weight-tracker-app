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
    tempHeight: '170',
    tempTargetWeight: '65',
    tempGender: 'other',
    tempNickname: '', // 昵称临时值
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
    weather: null,
    _version: 'v2-' + Date.now() // 缓存破坏标记
  },

  onLoad() {
    console.log('【INDEX】Page onLoad, version:', this.data._version)
    this.setData({
      date: util.getTodayString(),
      userInfo: app.globalData.userInfo
    })
  },

  onShow() {
    console.log('【INDEX】Page onShow')
    this.loadData()
    this.loadActiveChannel()
    this.loadWeather()
  },

  // 加载数据 - 彻底重写，避免任何可能的 sort 调用错误
  async loadData() {
    console.log('【INDEX】=== 开始加载数据 ===')
    
    let entries = []
    let settings = { height: 170, targetWeight: 65 }
    let gender = 'other'
    
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
        gender = settingsResponse.gender || settingsResponse.user?.gender || 'other'
        
        // 保存昵称和头像到 data
        if (settingsResponse.user?.nickname) {
          this.setData({ tempNickname: settingsResponse.user.nickname })
        }
        if (settingsResponse.user?.avatar) {
          const newUserInfo = { ...app.globalData.userInfo, avatar: settingsResponse.user.avatar }
          app.updateUserInfo(newUserInfo)
          this.setData({ userInfo: newUserInfo })
        }
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
      tempHeight: String(settings.height || 170),
      tempTargetWeight: String(settings.targetWeight || 65),
      tempGender: gender,
      currentWeight, 
      bmi, 
      bmiCategory, 
      bmiStyle, 
      weightDiff, 
      chartData
    }, () => {
      if (chartData.length > 0) {
        this.drawChart()
      }
    })
    
    console.log('【INDEX】=== 加载数据完成 ===')
  },
  
  async loadActiveChannel() {
    try {
      const result = await app.request({ url: '/channels' })
      const channels = forceArray(result.channels || result)
      const activeChannel = channels.find(
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

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value })
  },

  // 选择头像
  async chooseAvatar() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      })
      
      const tempFilePath = res.tempFiles[0].tempFilePath
      
      // 上传图片到服务器
      wx.showLoading({ title: '上传中...' })
      
      const uploadRes = await this.uploadFile(tempFilePath)
      
      // 更新用户头像
      await app.request({
        url: '/settings',
        method: 'POST',
        data: { avatar: uploadRes.url }
      })
      
      // 更新本地显示
      const newUserInfo = { ...app.globalData.userInfo, avatar: uploadRes.url }
      app.updateUserInfo(newUserInfo)
      this.setData({ userInfo: newUserInfo })
      
      wx.showToast({ title: '头像已更新', icon: 'success' })
    } catch (err) {
      console.error('选择头像失败:', err)
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  // 上传文件到服务器
  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      const config = require('../../config.js')
      // 上传接口需要从 query 传递 token
      const uploadUrl = `${config.apiBaseUrl}/upload?token=${encodeURIComponent(app.globalData.token || '')}`
      
      wx.uploadFile({
        url: uploadUrl,
        filePath: filePath,
        name: 'file',
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.url) {
              resolve(data)
            } else {
              reject(new Error(data.error || '上传失败'))
            }
          } catch (e) {
            reject(e)
          }
        },
        fail: reject
      })
    })
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
      // 保存身高、体重目标和昵称
      await app.request({
        url: '/settings',
        method: 'POST',
        data: { 
          height, 
          targetWeight,
          nickname: this.data.tempNickname 
        }
      })
      await app.request({
        url: '/settings',
        method: 'PATCH',
        data: { gender: this.data.tempGender }
      })
      
      // 更新全局用户信息
      const newUserInfo = { 
        ...app.globalData.userInfo, 
        nickname: this.data.tempNickname || app.globalData.userInfo?.nickname
      }
      app.updateUserInfo(newUserInfo)
      this.setData({ userInfo: newUserInfo })

      wx.showToast({ title: '设置已保存', icon: 'success' })
      this.setData({ showSettings: false })
      await this.loadData()
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
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
    const username = this.data.userInfo?.nickname || this.data.userInfo?.username || '好友'
    return {
      title: `${username} 邀请你一起记录体重，坚持健身！`,
      path: '/pages/login/login'
    }
  },

  onShareTimeline() {
    const username = this.data.userInfo?.nickname || this.data.userInfo?.username || '好友'
    return {
      title: `${username} 正在用体重管理器记录体重变化，邀请你一起加入！`,
      query: 'from=timeline'
    }
  }
})
