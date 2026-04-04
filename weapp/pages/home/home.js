// pages/home/home.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    userInfo: null,
    avatarText: '用',
    welcomeName: '用户',
    todayDate: '',
    
    // 今日打卡状态
    fitnessChecked: false,
    readingChecked: false,
    
    // 统计数据
    totalCheckIns: 0,
    fitnessStreak: 0,
    readingStreak: 0,
    
    // 目标列表
    goals: [],
    showGoalModal: false,
    goalForm: {
      title: '',
      description: '',
      category: 'fitness',
      targetCount: '',
      unit: '次',
      frequency: 'daily'
    },
    
    // 天气
    weather: null,
    weatherIcon: '',
    
    // 设置
    showSettings: false,
    settings: { height: 170, targetWeight: 65, age: null },
    tempHeight: '170',
    tempTargetWeight: '65',
    tempGender: 'male',
    tempNickname: '',
    tempAge: '',
    tempAvatar: '',
    showAvatarSelector: false,
    
    // 预设头像
    presetAvatars: [
      { id: 'cat', emoji: '🐱', name: '猫咪' },
      { id: 'dog', emoji: '🐶', name: '狗狗' },
      { id: 'rabbit', emoji: '🐰', name: '兔子' },
      { id: 'panda', emoji: '🐼', name: '熊猫' },
      { id: 'bear', emoji: '🐻', name: '小熊' },
      { id: 'fox', emoji: '🦊', name: '狐狸' },
      { id: 'tiger', emoji: '🐯', name: '老虎' },
      { id: 'lion', emoji: '🦁', name: '狮子' },
      { id: 'penguin', emoji: '🐧', name: '企鹅' },
      { id: 'koala', emoji: '🐨', name: '考拉' },
      { id: 'monkey', emoji: '🐵', name: '猴子' },
      { id: 'pig', emoji: '🐷', name: '小猪' },
    ],
    
    // 消息
    showMessageModal: false,
    messages: [],
    unreadCount: 0,
    
    // 好友动态
    friendActivities: []
  },

  onLoad() {
    this.initData()
  },

  onShow() {
    this.loadData()
    this.loadWeather()
  },

  initData() {
    const userInfo = app.globalData.userInfo
    const today = new Date()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const todayDate = `${today.getMonth() + 1}月${today.getDate()}日 ${weekDays[today.getDay()]}`
    
    this.setData({
      userInfo: userInfo,
      avatarText: this.getAvatarText(userInfo),
      welcomeName: (userInfo?.nickname || userInfo?.username || '用户'),
      todayDate: todayDate
    })
  },

  async loadData() {
    try {
      // 加载体重数据（健身打卡状态）
      await this.loadFitnessStatus()
      
      // 加载统计数据
      await this.loadStats()
      
      // 加载目标列表
      await this.loadGoals()
      
      // 加载设置
      await this.loadSettings()
      
      // 加载未读消息数
      await this.loadUnreadCount()
      
      // 加载好友动态
      await this.loadFriendActivities()
    } catch (err) {
      console.error('加载首页数据失败:', err)
    }
  },

  // 加载未读消息数
  async loadUnreadCount() {
    try {
      const result = await app.request({ url: '/messages' })
      const messages = result.messages || []
      const unreadCount = messages.filter(m => !m.isRead).length
      this.setData({ unreadCount })
    } catch (err) {
      console.error('加载未读消息数失败:', err)
    }
  },

  // 加载好友动态
  async loadFriendActivities() {
    try {
      const result = await app.request({
        url: '/friends?type=activity'
      })
      const activities = (result.activities || []).map(a => ({
        ...a,
        timeAgo: this.formatTimeAgo(a.createdAt || a.date)
      }))
      this.setData({ friendActivities: activities })
    } catch (err) {
      console.error('加载好友动态失败:', err)
      this.setData({ friendActivities: [] })
    }
  },

  // 加载设置
  async loadSettings() {
    try {
      const result = await app.request({ url: '/settings' })
      const settings = result.settings || { height: 170, targetWeight: 65, age: null }
      const gender = result.user?.gender || 'male'
      
      this.setData({
        settings,
        tempHeight: String(settings.height || 170),
        tempTargetWeight: String(settings.targetWeight || 65),
        tempGender: gender,
        tempNickname: result.user?.nickname || '',
        tempAge: settings.age ? String(settings.age) : ''
      })
    } catch (err) {
      console.error('加载设置失败:', err)
    }
  },

  // 获取头像文字
  getAvatarText(userInfo) {
    if (!userInfo) return '用'
    const name = userInfo.nickname || userInfo.username || '用'
    return name.charAt(0)
  },

  // 加载健身打卡状态
  async loadFitnessStatus() {
    try {
      const result = await app.request({ url: '/weight' })
      const entries = result.entries || []
      
      // 检查今天是否有记录
      const today = util.getTodayString()
      const todayEntry = entries.find(e => {
        const entryDate = new Date(e.date).toISOString().split('T')[0]
        return entryDate === today
      })
      
      this.setData({
        fitnessChecked: !!todayEntry,
        totalCheckIns: entries.length
      })
    } catch (err) {
      console.error('加载健身状态失败:', err)
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      // 获取健身连续打卡天数
      const weightResult = await app.request({ url: '/weight' })
      const weightEntries = weightResult.entries || []
      const fitnessStreak = this.calculateStreak(weightEntries)
      
      // 获取读书连续打卡天数和状态
      const readingResult = await app.request({ url: '/reading' })
      const readingEntries = readingResult.entries || []
      const readingStreak = readingResult.streak || 0
      
      // 检查今天是否已读书打卡
      const today = util.getTodayString()
      const todayReadingEntry = readingEntries.find(e => e.date === today)
      
      this.setData({
        fitnessStreak,
        readingStreak,
        readingChecked: !!todayReadingEntry
      })
    } catch (err) {
      console.error('加载统计失败:', err)
    }
  },

  // 计算连续打卡天数
  calculateStreak(entries) {
    if (entries.length === 0) return 0
    
    // 按日期去重并排序
    const dates = [...new Set(entries.map(e => new Date(e.date).toISOString().split('T')[0]))].sort().reverse()
    
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    // 检查今天或昨天是否有打卡
    if (dates[0] === today || dates[0] === yesterday) {
      streak = 1
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1])
        const currDate = new Date(dates[i])
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000)
        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }
    }
    
    return streak
  },

  // 加载目标列表
  async loadGoals() {
    try {
      const result = await app.request({
        url: '/goals?status=active'
      })
      const goals = result.goals || []
      // 处理进度百分比
      const processedGoals = goals.map(g => ({
        ...g,
        progress: Math.round((g.currentCount / g.targetCount) * 100),
        canCheckIn: g.status === 'active'
      }))
      this.setData({ goals: processedGoals })
    } catch (err) {
      console.error('加载目标失败:', err)
      this.setData({ goals: [] })
    }
  },

  // 跳转到健身页面
  goToFitness() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 跳转到读书页面
  goToReading() {
    wx.switchTab({
      url: '/pages/reading/reading'
    })
  },

  // 打开设置面板
  goToSettings() {
    this.toggleSettings()
  },

  // 设置面板
  toggleSettings() {
    this.setData({
      showSettings: !this.data.showSettings,
      tempHeight: String(this.data.settings.height || 170),
      tempTargetWeight: String(this.data.settings.targetWeight || 65),
      tempGender: this.data.userInfo?.gender || 'male',
      tempNickname: this.data.userInfo?.nickName || '',
      tempAge: this.data.settings.age ? String(this.data.settings.age) : '',
      tempAvatar: this.data.userInfo?.avatar || ''
    })
  },

  // 显示头像选择器
  showAvatarSelector() {
    this.setData({ showAvatarSelector: true })
  },

  hideAvatarSelector() {
    this.setData({ showAvatarSelector: false })
  },

  // 选择预设头像
  selectPresetAvatar(e) {
    const avatar = e.currentTarget.dataset.avatar
    this.setData({ 
      tempAvatar: avatar,
      showAvatarSelector: false
    })
  },

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value })
  },

  onHeightInput(e) {
    this.setData({ tempHeight: e.detail.value })
  },

  onTargetWeightInput(e) {
    this.setData({ tempTargetWeight: e.detail.value })
  },

  onGenderChange(e) {
    const gender = e.currentTarget.dataset.value
    this.setData({ tempGender: gender })
  },

  onAgeInput(e) {
    this.setData({ tempAge: e.detail.value })
  },

  // 保存设置
  async saveSettings() {
    const { tempHeight, tempTargetWeight, tempGender, tempNickname, tempAge, tempAvatar, userInfo } = this.data
    
    // 验证输入（只验证已填写的）
    if (tempHeight) {
      const height = parseFloat(tempHeight)
      if (height < 50 || height > 250) {
        wx.showToast({ title: '请输入有效身高(50-250cm)', icon: 'none' })
        return
      }
    }
    if (tempTargetWeight) {
      const targetWeight = parseFloat(tempTargetWeight)
      if (targetWeight < 20 || targetWeight > 200) {
        wx.showToast({ title: '请输入有效体重(20-200kg)', icon: 'none' })
        return
      }
    }
    if (tempAge) {
      const age = parseInt(tempAge)
      if (age < 1 || age > 150) {
        wx.showToast({ title: '请输入有效年龄(1-150岁)', icon: 'none' })
        return
      }
    }

    wx.showLoading({ title: '保存中...' })
    try {
      // 更新用户信息（昵称和头像）
      const userUpdateData = {}
      if (tempNickname && tempNickname !== userInfo.nickName) {
        userUpdateData.nickname = tempNickname
      }
      if (tempAvatar && tempAvatar !== userInfo.avatar) {
        userUpdateData.avatar = tempAvatar
      }
      
      if (Object.keys(userUpdateData).length > 0) {
        await app.request({
          url: '/user',
          method: 'PATCH',
          data: userUpdateData
        })
        
        if (userUpdateData.nickname) {
          this.setData({ 
            'userInfo.nickName': tempNickname, 
            'userInfo.nickname': tempNickname,
            welcomeName: tempNickname 
          })
        }
        if (userUpdateData.avatar) {
          this.setData({ 'userInfo.avatar': tempAvatar })
        }
        wx.setStorageSync('userInfo', { ...userInfo, ...userUpdateData })
      }

      // 更新性别
      await app.request({
        url: '/user',
        method: 'PATCH',
        data: { gender: tempGender }
      })
      this.setData({ 'userInfo.gender': tempGender })

      // 更新设置
      const newSettings = {}
      if (tempHeight) newSettings.height = parseFloat(tempHeight)
      if (tempTargetWeight) newSettings.targetWeight = parseFloat(tempTargetWeight)
      if (tempAge) newSettings.age = parseInt(tempAge)
      
      if (Object.keys(newSettings).length > 0) {
        await app.request({
          url: '/settings',
          method: 'POST',
          data: newSettings
        })
      }
      
      this.setData({ 
        settings: { ...this.data.settings, ...newSettings }, 
        showSettings: false 
      })
      wx.showToast({ title: '设置已保存', icon: 'success' })
    } catch (err) {
      console.error('保存设置失败:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadFile(tempFilePath)
      },
      fail: () => {
        wx.showToast({ title: '选择图片失败', icon: 'none' })
      }
    })
  },

  // 上传文件
  async uploadFile(filePath) {
    wx.showLoading({ title: '上传中...' })
    const token = wx.getStorageSync('token')
    // token 通过 query 参数传递
    const url = `${app.globalData.apiBaseUrl}/upload?token=${encodeURIComponent(token)}`

    try {
      const res = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url,
          filePath,
          name: 'file',
          success: resolve,
          fail: reject
        })
      })

      const data = JSON.parse(res.data)
      if (data.url) {
        // 更新临时头像和用户信息
        this.setData({ 
          'userInfo.avatar': data.url,
          tempAvatar: data.url,
          showAvatarSelector: false
        })
        const userInfo = this.data.userInfo
        wx.setStorageSync('userInfo', userInfo)
        wx.showToast({ title: '头像已上传', icon: 'success' })
      }
    } catch (err) {
      console.error('上传失败:', err)
      wx.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 跳转到目标列表
  goToGoals() {
    this.toggleGoalModal()
  },

  // 跳转到好友页面
  goToFriends() {
    wx.switchTab({
      url: '/pages/friends/friends'
    })
  },

  // 切换目标创建弹窗
  toggleGoalModal() {
    this.setData({
      showGoalModal: !this.data.showGoalModal
    })
  },

  // 创建第一个目标
  createFirstGoal() {
    this.toggleGoalModal()
  },

  // 目标表单输入
  onGoalTitleInput(e) {
    this.setData({ 'goalForm.title': e.detail.value })
  },
  onGoalDescInput(e) {
    this.setData({ 'goalForm.description': e.detail.value })
  },
  onGoalCategoryChange(e) {
    const categories = ['fitness', 'reading', 'study', 'work', 'life', 'other']
    const index = parseInt(e.detail.value)
    this.setData({ 'goalForm.category': categories[index] })
  },
  onGoalTargetInput(e) {
    this.setData({ 'goalForm.targetCount': e.detail.value })
  },
  onGoalUnitInput(e) {
    this.setData({ 'goalForm.unit': e.detail.value })
  },
  onGoalFreqChange(e) {
    const frequencies = ['daily', 'weekly', 'monthly', 'once']
    const index = parseInt(e.detail.value)
    this.setData({ 'goalForm.frequency': frequencies[index] })
  },

  // 提交创建目标
  async submitGoal() {
    const { goalForm } = this.data
    if (!goalForm.title.trim()) {
      wx.showToast({ title: '请输入目标标题', icon: 'none' })
      return
    }
    if (!goalForm.targetCount || parseInt(goalForm.targetCount) <= 0) {
      wx.showToast({ title: '请输入有效目标次数', icon: 'none' })
      return
    }

    wx.showLoading({ title: '创建中...' })
    try {
      await app.request({
        url: '/goals',
        method: 'POST',
        data: {
          title: goalForm.title.trim(),
          description: goalForm.description.trim(),
          category: goalForm.category,
          targetCount: parseInt(goalForm.targetCount),
          unit: goalForm.unit.trim() || '次',
          frequency: goalForm.frequency
        }
      })
      wx.showToast({ title: '目标创建成功', icon: 'success' })
      this.setData({
        showGoalModal: false,
        goalForm: {
          title: '',
          description: '',
          category: 'fitness',
          targetCount: '',
          unit: '次',
          frequency: 'daily'
        }
      })
      await this.loadGoals()
    } catch (err) {
      console.error('创建目标失败:', err)
      wx.showToast({ title: '创建失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 目标打卡
  async checkInGoal(e) {
    const { id } = e.currentTarget.dataset
    wx.showLoading({ title: '打卡中...' })
    try {
      await app.request({
        url: '/goals',
        method: 'PATCH',
        data: { id, action: 'increment', increment: 1 }
      })
      wx.showToast({ title: '打卡成功', icon: 'success' })
      await this.loadGoals()
    } catch (err) {
      console.error('打卡失败:', err)
      wx.showToast({ title: '打卡失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 退出登录
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

  // 加载天气
  async loadWeather() {
    try {
      const result = await app.request({ url: '/weather' })
      // 计算天气图标
      let weatherIcon = '☀️'
      if (result) {
        if (result.weathercode <= 3) weatherIcon = '☀️'
        else if (result.weathercode <= 50) weatherIcon = '☁️'
        else weatherIcon = '🌧️'
      }
      this.setData({ 
        weather: result,
        weatherIcon
      })
    } catch (err) {
      console.error('加载天气失败:', err)
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadData()
    await this.loadWeather()
    wx.stopPullDownRefresh()
  },

  // 阻止触摸穿透
  preventTouchMove() {},

  // ========== 消息模块 ==========
  
  // 打开消息弹窗
  openMessageModal() {
    this.setData({ showMessageModal: true })
    this.loadMessages()
  },
  
  // 关闭消息弹窗
  closeMessageModal() {
    this.setData({ showMessageModal: false })
  },
  
  // 加载消息列表
  async loadMessages() {
    try {
      const result = await app.request({ url: '/messages' })
      console.log('[Messages] Loaded:', result.messages)
      const messages = (result.messages || []).map(m => ({
        id: m.id || m._id,
        content: m.content,
        type: m.type,
        isRead: m.isRead,
        friendRequestId: m.friendRequestId || m.friend_request_id || null,
        timeAgo: this.formatTimeAgo(m.createdAt)
      }))
      console.log('[Messages] Processed:', messages)
      const unreadCount = messages.filter(m => !m.isRead).length
      this.setData({ messages, unreadCount })
    } catch (err) {
      console.error('加载消息失败:', err)
    }
  },
  
  // 格式化时间为相对时间
  formatTimeAgo(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    
    if (diff < minute) return '刚刚'
    if (diff < hour) return Math.floor(diff / minute) + '分钟前'
    if (diff < day) return Math.floor(diff / hour) + '小时前'
    if (diff < 7 * day) return Math.floor(diff / day) + '天前'
    return date.toISOString().split('T')[0]
  },
  
  // 点击消息
  async onMessageTap(e) {
    const { id } = e.currentTarget.dataset
    const message = this.data.messages.find(m => m.id === id)
    if (!message || message.isRead) return
    
    try {
      await app.request({
        url: '/messages',
        method: 'PATCH',
        data: { messageId: id }
      })
      // 更新本地状态
      const messages = this.data.messages.map(m => 
        m.id === id ? { ...m, isRead: true } : m
      )
      const unreadCount = messages.filter(m => !m.isRead).length
      this.setData({ messages, unreadCount })
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  },
  
  // 标记全部已读
  async markAllAsRead() {
    if (this.data.unreadCount === 0) return
    
    try {
      await app.request({
        url: '/messages',
        method: 'PATCH',
        data: { markAll: true }
      })
      const messages = this.data.messages.map(m => ({ ...m, isRead: true }))
      this.setData({ messages, unreadCount: 0 })
      wx.showToast({ title: '已全部标记为已读', icon: 'success' })
    } catch (err) {
      console.error('标记全部已读失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },
  
  // 删除消息
  async deleteMessage(e) {
    const { id } = e.currentTarget.dataset
    
    const res = await wx.showModal({
      title: '确认删除',
      content: '确定要删除这条消息吗？'
    })
    
    if (!res.confirm) return
    
    try {
      await app.request({
        url: `/messages?id=${id}`,
        method: 'DELETE'
      })
      await this.loadMessages()
      wx.showToast({ title: '已删除', icon: 'success' })
    } catch (err) {
      console.error('删除消息失败:', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  // 处理好友请求（接受/拒绝）
  async handleFriendRequest(e) {
    const { id, action } = e.currentTarget.dataset
    
    console.log('[FriendRequest] ID:', id, 'Action:', action)
    
    if (!id || id === 'null' || id === 'undefined') {
      wx.showToast({ title: '请求ID无效，请刷新重试', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '处理中...' })
    try {
      const result = await app.request({
        url: '/friends',
        method: 'PATCH',
        data: { friendId: id, action }
      })
      
      wx.showToast({ 
        title: action === 'accept' ? '已接受好友请求' : '已拒绝好友请求', 
        icon: 'success' 
      })
      
      // 刷新消息列表和好友动态
      await this.loadMessages()
      await this.loadFriendActivities()
    } catch (err) {
      console.error('处理好友请求失败:', err)
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})
