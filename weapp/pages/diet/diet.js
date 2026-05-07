const app = getApp()

Page({
  data: {
    previewImage: '',
    imageBase64: '',
    analyzing: false,
    lastResult: null,
    lastError: '',
    records: [],
    remainingToday: 20,
    todayCount: 0,
    pollTimer: null,
  },

  onLoad() {
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  onUnload() {
    this.clearPollTimer()
  },

  clearPollTimer() {
    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer)
      this.setData({ pollTimer: null })
    }
  },

  // 选择图片
  chooseImage() {
    if (this.data.remainingToday <= 0) {
      wx.showToast({ title: '今日次数已用完', icon: 'none' })
      return
    }

    wx.chooseMedia({
      mediaType: ['image'],
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({ previewImage: tempFilePath, lastResult: null, lastError: '' })

        // 读取为 base64
        const fs = wx.getFileSystemManager()
        fs.readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: (fileRes) => {
            this.setData({ imageBase64: fileRes.data })
          },
          fail: (err) => {
            console.error('readFile fail:', err)
            wx.showToast({ title: '图片读取失败', icon: 'none' })
          },
        })
      },
      fail: (err) => {
        console.error('chooseMedia fail:', err)
      },
    })
  },

  // 开始分析
  async analyzeImage() {
    const { imageBase64, remainingToday } = this.data
    if (!imageBase64) {
      wx.showToast({ title: '请先选择图片', icon: 'none' })
      return
    }
    if (remainingToday <= 0) {
      wx.showToast({ title: '今日次数已用完', icon: 'none' })
      return
    }

    this.setData({ analyzing: true, lastResult: null, lastError: '' })

    try {
      const res = await app.request({
        url: '/diet/analyze',
        method: 'POST',
        data: { image: imageBase64 },
        timeout: 15000, // 上传只需几秒，AI 在后台运行
      })

      if (res.success && res.status === 'analyzing' && res.taskId) {
        // 开始轮询
        this.setData({
          remainingToday: res.remainingToday ?? remainingToday,
        })
        this.startPolling(res.taskId)
      } else {
        this.setData({
          lastError: res.error || '提交失败',
          remainingToday: res.remainingToday ?? remainingToday,
          analyzing: false,
        })
      }
    } catch (err) {
      console.error('analyze error:', err)
      this.setData({ lastError: '提交失败', analyzing: false })
    }
  },

  // 轮询任务状态
  startPolling(taskId) {
    this.clearPollTimer()

    let attempts = 0
    const maxAttempts = 40 // 最多轮询 40 次 * 3秒 = 120 秒

    const poll = async () => {
      attempts++
      if (attempts > maxAttempts) {
        this.clearPollTimer()
        this.setData({
          lastError: '分析时间过长，请稍后刷新查看结果',
          analyzing: false,
        })
        this.loadRecords()
        return
      }

      try {
        const res = await app.request({
          url: `/diet/analyze?id=${taskId}`,
          method: 'GET',
          timeout: 10000,
        })

        if (!res.success) {
          this.clearPollTimer()
          this.setData({
            lastError: res.error || '查询失败',
            analyzing: false,
          })
          return
        }

        if (res.status === 'completed') {
          this.clearPollTimer()
          this.setData({
            lastResult: {
              calories: res.calories,
              foodItems: res.foodItems,
              analysis: res.analysis,
            },
            previewImage: '',
            imageBase64: '',
            analyzing: false,
          })
          this.loadRecords()
          return
        }

        if (res.status === 'failed') {
          this.clearPollTimer()
          this.setData({
            lastError: res.error || '分析失败',
            analyzing: false,
          })
          this.loadRecords()
          return
        }

        // status === 'analyzing'，继续轮询
      } catch (err) {
        console.error('poll error:', err)
        // 网络错误继续轮询
      }
    }

    // 立即查一次，然后每 3 秒查一次
    poll()
    const timer = setInterval(poll, 3000)
    this.setData({ pollTimer: timer })
  },

  // 加载历史记录
  async loadRecords() {
    try {
      const res = await app.request({
        url: '/diet',
        method: 'GET',
      })

      const records = (res.records || []).map((r) => ({
        ...r,
        createdAt: this.formatTime(r.createdAt),
      }))

      this.setData({
        records,
        todayCount: res.todayCount || 0,
        remainingToday: (res.maxDaily || 3) - (res.todayCount || 0),
      })
    } catch (err) {
      console.error('loadRecords error:', err)
    }
  },

  // 删除记录
  async deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      confirmColor: '#ef4444',
    })

    if (!res.confirm) return

    try {
      await app.request({
        url: `/diet?id=${id}`,
        method: 'DELETE',
      })
      wx.showToast({ title: '已删除', icon: 'success' })
      this.loadRecords()
    } catch (err) {
      console.error('delete error:', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  // 格式化时间
  formatTime(isoString) {
    if (!isoString) return ''
    const d = new Date(isoString)
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },
})
