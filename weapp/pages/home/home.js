// pages/home/home.js
const app = getApp()
const util = require('../../utils/util.js')

/*
  语音打卡功能 - 暂时注释，保留后续开发
const recorderManager = wx.getRecorderManager()
const audioContext = wx.createInnerAudioContext()
*/

Page({
  data: {
    userInfo: null,
    avatarText: '用',
    welcomeName: '用户',
    todayDate: '',
    // 语音打卡功能已注释
    // isRecording: false,
    // voiceResult: '',

    // 今日记录状态
    fitnessChecked: false,
    readingChecked: false,
    
    // 统计数据
    totalCheckIns: 0,
    fitnessStreak: 0,
    readingStreak: 0,
    
    // 记录列表
    activeRecordType: '',
    activeRecordTitle: '',
    activeRecordIcon: '',
    weightEntries: [],
    readingEntries: [],
    runningEntries: [],
    cyclingEntries: [],
    dietEntries: [],
    latestWeightText: '--',
    latestReadingText: '--',
    
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

    // 模块配置
    enabledModules: ['weight', 'reading', 'diet'],
    showModuleManager: false,
    isRemovingMode: false,
    moduleDefs: [
      { key: 'weight', name: '体重', icon: '🏋️', color: '#f97316', added: true },
      { key: 'reading', name: '读书', icon: '📖', color: '#8b5cf6', added: true },
      { key: 'diet', name: '饮食', icon: '🍱', color: '#10b981', added: true },
      { key: 'running', name: '跑步', icon: '🏃', color: '#f97316', added: false },
      { key: 'cycling', name: '骑行', icon: '🚴', color: '#3b82f6', added: false },
    ],

    // 跑步/骑行数据
    runningChecked: false,
    cyclingChecked: false,
    latestRunningText: '--',
    latestCyclingText: '--',
  },

  onLoad() {
    this.initData()
    // this.initVoiceRecorder()  // 语音打卡功能已注释
  },

  /*
    语音打卡功能 - 暂时注释，保留后续开发
  初始化录音管理器
  initVoiceRecorder() {
    recorderManager.onStart = () => {
      console.log('[Voice] recorder started')
      this.setData({ isRecording: true, voiceResult: '' })
    }

    recorderManager.onStop = (res) => {
      console.log('[Voice] recorder stopped, tempFilePath:', res.tempFilePath)
      console.log('[Voice] duration:', res.duration, 'fileSize:', res.fileSize)
      this.setData({ isRecording: false })
      if (res.tempFilePath) {
        this.uploadAndTranscribe(res.tempFilePath)
      } else {
        console.error('[Voice] no tempFilePath')
        wx.showToast({ title: '录音文件为空', icon: 'none' })
      }
    }

    recorderManager.onError = (res) => {
      console.error('[Voice] recorder error:', JSON.stringify(res))
      this.setData({ isRecording: false })
      wx.showToast({ title: '录音失败', icon: 'none' })
    }

    recorderManager.onFrameRecorded = () => {
      if (!this._frameLogged) {
        console.log('[Voice] frame received, audio active')
        this._frameLogged = true
      }
    }
  },
  */

  /*
    语音打卡功能 - 暂时注释，保留后续开发
  开始语音录音
  onVoicePressStart() {
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    console.log('[Voice] using recorderManager mp3')
    this.setData({ isRecording: true, voiceResult: '' })
    recorderManager.start({
      duration: 6000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3',
    })
  },

  // 松手停止录音
  onVoicePressEnd() {
    recorderManager.stop()
  },
  */

  /*
    语音打卡功能 - 暂时注释，保留后续开发
  上传录音到后端进行语音识别
  async uploadAndTranscribe(filePath) {
    this.setData({ isRecording: true, voiceResult: '' })
    try {
      const token = wx.getStorageSync('token')
      console.log('[Voice] uploading to:', `${app.globalData.apiBaseUrl}/voice`, 'file:', filePath)
      const uploadRes = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${app.globalData.apiBaseUrl}/voice?token=${encodeURIComponent(token)}`,
          filePath,
          name: 'file',
          success: (res) => {
            console.log('[Voice] upload response status:', res.statusCode)
            console.log('[Voice] upload response data:', res.data)
            resolve(res)
          },
          fail: (err) => {
            console.error('[Voice] upload failed:', JSON.stringify(err))
            reject(err)
          },
        })
      })

      let data
      try {
        data = JSON.parse(uploadRes.data)
        console.log('[Voice] parsed response:', JSON.stringify(data))
      } catch (e) {
        console.error('[Voice] JSON parse error:', e, 'raw:', uploadRes.data)
        this.setData({ voiceResult: '解析失败' })
        wx.showToast({ title: '服务器响应异常', icon: 'none' })
        return
      }

      if (data.weight) {
        this.setData({ voiceResult: `${data.weight} kg` })
        wx.vibrateShort({ type: 'medium' }).catch(() => {})
        await this.createVoiceWeightEntry(data.weight)
      } else {
        this.setData({ voiceResult: data.text || '未识别到体重' })
        wx.showToast({
          title: data.text ? `识别到: ${data.text}` : '未识别到体重数字',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('[Voice] upload error:', err)
      this.setData({ voiceResult: '识别失败' })
      wx.showToast({ title: '语音识别失败', icon: 'none' })
    } finally {
      this.setData({ isRecording: false })
    }
  },
  */

  // 通过语音创建体重记录
  /*
    语音打卡功能 - 暂时注释，保留后续开发
  async createVoiceWeightEntry(weight) {
    try {
      await app.request({
        url: '/weight',
        method: 'POST',
        data: {
          weight,
          note: '语音记录',
          date: util.getTodayString()
        }
      })
      wx.showToast({
        title: `✅ 记录成功 ${weight}kg`,
        icon: 'none',
        duration: 2000
      })
      this.setData({ voiceResult: `✅ ${weight} kg` })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.message || '记录失败', icon: 'none' })
    }
  },
  */

  onShow() {
    console.log('[Home] onShow, globalData:', {
      isLoggedIn: app.globalData.isLoggedIn,
      hasToken: !!app.globalData.token,
      tokenPrefix: app.globalData.token ? app.globalData.token.substring(0, 20) : 'none'
    })
    // 同步用户信息
    const userInfo = app.globalData.userInfo
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: userInfo,
      avatarText: this.getAvatarText(userInfo),
      welcomeName: (userInfo?.nickname || userInfo?.username || '用户')
    })
    this.loadData()
    this.loadWeather()

    // 检查是否从"我的"页面跳转过来要显示目标弹窗
    if (app.globalData.showGoalModal) {
      app.globalData.showGoalModal = false
      this.loadGoals().then(() => {
        this.toggleGoalModal()
      })
    }
  },

  initData() {
    const userInfo = app.globalData.userInfo
    const today = new Date()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const todayDate = `${today.getMonth() + 1}月${today.getDate()}日 ${weekDays[today.getDay()]}`
    const enabledModules = wx.getStorageSync('enabledModules') || ['weight', 'reading', 'diet']

    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: userInfo,
      avatarText: this.getAvatarText(userInfo),
      welcomeName: (userInfo?.nickname || userInfo?.username || '用户'),
      todayDate: todayDate,
      enabledModules,
    }, () => {
      this.computeQuickModules()
    })
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  async loadData() {
    this.setData({ isLoggedIn: app.globalData.isLoggedIn })

    if (!app.globalData.token) {
      console.log('[Home] 未登录，跳过个人数据加载')
      return
    }

    console.log('[Home] 开始加载数据...')
    try {
      await this.loadFitnessStatus()
      await this.loadStats()
      await this.loadGoals()
      await this.loadSettings()
      console.log('[Home] 数据加载完成')
    } catch (err) {
      console.error('[Home] 加载首页数据失败:', err)
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

  // 加载体重记录状态
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
      console.error('加载体重状态失败:', err)
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      const today = util.getTodayString()
      const promises = []

      // 体重
      promises.push(app.request({ url: '/weight' }).catch(() => ({ entries: [] })))
      // 读书
      promises.push(app.request({ url: '/reading' }).catch(() => ({ entries: [], streak: 0 })))
      // 跑步
      promises.push(app.request({ url: '/running' }).catch(() => ({ entries: [] })))
      // 骑行
      promises.push(app.request({ url: '/cycling' }).catch(() => ({ entries: [] })))
      // 饮食
      promises.push(app.request({ url: '/diet' }).catch(() => ({ records: [] })))

      const [weightResult, readingResult, runningResult, cyclingResult, dietResult] = await Promise.all(promises)

      const weightEntries = weightResult.entries || []
      const readingEntries = readingResult.entries || []
      const runningEntries = runningResult.entries || []
      const cyclingEntries = cyclingResult.entries || []
      const dietEntries = (dietResult.records || []).map(r => ({
        ...r,
        displayDate: this.formatDisplayDate(r.createdAt),
      }))

      const fitnessStreak = this.calculateStreak(weightEntries)
      const readingStreak = readingResult.streak || 0

      const todayReadingEntry = readingEntries.find(e => e.date === today)
      const todayRunningEntry = runningEntries.find(e => {
        const d = new Date(e.date).toISOString().split('T')[0]
        return d === today
      })
      const todayCyclingEntry = cyclingEntries.find(e => {
        const d = new Date(e.date).toISOString().split('T')[0]
        return d === today
      })

      const formattedWeightEntries = weightEntries.slice(0, 10).map(e => ({
        ...e,
        displayDate: this.formatDisplayDate(e.date)
      }))
      const formattedReadingEntries = readingEntries.slice(0, 10).map(e => ({
        ...e,
        displayDate: this.formatDisplayDate(e.date)
      }))

      const latestWeight = weightEntries.length > 0 ? weightEntries[0].weight : null
      const latestReading = readingEntries.length > 0 ? readingEntries[0] : null
      const latestRunning = runningEntries.length > 0 ? runningEntries[0] : null
      const latestCycling = cyclingEntries.length > 0 ? cyclingEntries[0] : null

      this.setData({
        fitnessStreak,
        readingStreak,
        readingChecked: !!todayReadingEntry,
        runningChecked: !!todayRunningEntry,
        cyclingChecked: !!todayCyclingEntry,
        weightEntries: formattedWeightEntries,
        readingEntries: formattedReadingEntries,
        runningEntries: runningEntries.slice(0, 10).map(e => ({ ...e, displayDate: this.formatDisplayDate(e.date) })),
        cyclingEntries: cyclingEntries.slice(0, 10).map(e => ({ ...e, displayDate: this.formatDisplayDate(e.date) })),
        dietEntries: dietEntries.slice(0, 10),
        latestWeightText: latestWeight ? parseFloat(latestWeight).toFixed(1) : '--',
        latestReadingText: latestReading ? `${latestReading.pages}页` : '--',
        latestRunningText: latestRunning ? `${latestRunning.distance}km` : '--',
        latestCyclingText: latestCycling ? `${latestCycling.distance}km` : '--',
      }, () => {
        this.computeQuickModules()
        this.determineDefaultRecordType()
      })
    } catch (err) {
      console.error('加载统计失败:', err)
    }
  },

  // 格式化日期显示（今天/昨天/具体日期）
  formatDisplayDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    return `${date.getMonth() + 1}月${date.getDate()}日`
  },

  // 自动判断默认展示的记录类型（第一个有历史记录的）
  determineDefaultRecordType() {
    const recordTypes = [
      { key: 'weight', entries: this.data.weightEntries, title: '体重记录', icon: '⚖️' },
      { key: 'reading', entries: this.data.readingEntries, title: '读书记录', icon: '📖' },
      { key: 'running', entries: this.data.runningEntries, title: '跑步记录', icon: '🏃' },
      { key: 'cycling', entries: this.data.cyclingEntries, title: '骑行记录', icon: '🚴' },
      { key: 'diet', entries: this.data.dietEntries, title: '饮食记录', icon: '🍱' },
    ]
    for (const t of recordTypes) {
      if (t.entries.length > 0) {
        this.setData({
          activeRecordType: t.key,
          activeRecordTitle: t.title,
          activeRecordIcon: t.icon,
        })
        return
      }
    }
    // 都没有数据，默认显示体重
    this.setData({
      activeRecordType: 'weight',
      activeRecordTitle: '体重记录',
      activeRecordIcon: '⚖️',
    })
  },

  // 切换记录类型
  switchRecordType(e) {
    const type = e.currentTarget.dataset.type
    const typeMap = {
      weight: { title: '体重记录', icon: '⚖️' },
      reading: { title: '读书记录', icon: '📖' },
      running: { title: '跑步记录', icon: '🏃' },
      cycling: { title: '骑行记录', icon: '🚴' },
      diet: { title: '饮食记录', icon: '🍱' },
    }
    const info = typeMap[type]
    if (info) {
      this.setData({
        activeRecordType: type,
        activeRecordTitle: info.title,
        activeRecordIcon: info.icon,
      })
    }
  },

  // 计算快速记录模块显示数据
  computeQuickModules() {
    const { enabledModules, fitnessChecked, readingChecked, runningChecked, cyclingChecked } = this.data
    const moduleMap = {
      weight: { key: 'weight', name: '体重', icon: '🏋️', checked: fitnessChecked, status: fitnessChecked ? '今日已打卡' : '今日未记录', action: 'goToFitness' },
      reading: { key: 'reading', name: '读书', icon: '📖', checked: readingChecked, status: readingChecked ? '今日已打卡' : '今日未记录', action: 'goToReading' },
      diet: { key: 'diet', name: '饮食', icon: '🍱', checked: false, status: 'AI 算卡路里', action: 'goToDiet' },
      running: { key: 'running', name: '跑步', icon: '🏃', checked: runningChecked, status: runningChecked ? '今日已记录' : '记录跑步', action: 'goToRunning' },
      cycling: { key: 'cycling', name: '骑行', icon: '🚴', checked: cyclingChecked, status: cyclingChecked ? '今日已记录' : '记录骑行', action: 'goToCycling' },
    }
    const quickModules = enabledModules.map(key => moduleMap[key]).filter(Boolean)
    this.setData({ quickModules })
  },

  // 计算连续记录天数
  calculateStreak(entries) {
    if (entries.length === 0) return 0
    
    // 按日期去重并排序
    const dates = [...new Set(entries.map(e => new Date(e.date).toISOString().split('T')[0]))].sort().reverse()
    
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    // 检查今天或昨天是否有记录
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

  // 快速记录模块点击
  onQuickModuleTap(e) {
    if (this.data.isRemovingMode) return
    const key = e.currentTarget.dataset.key
    const actionMap = {
      weight: 'goToFitness',
      reading: 'goToReading',
      diet: 'goToDiet',
      running: 'goToRunning',
      cycling: 'goToCycling',
    }
    const method = actionMap[key]
    if (method && this[method]) {
      this[method]()
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

  // 跳转到饮食页面
  goToDiet() {
    wx.switchTab({
      url: '/pages/diet/diet'
    })
  },

  // 跳转到跑步页面
  goToRunning() {
    wx.navigateTo({
      url: '/pages/running/running'
    })
  },

  // 跳转到骑行页面
  goToCycling() {
    wx.navigateTo({
      url: '/pages/cycling/cycling'
    })
  },

  // 打开模块管理器
  openModuleManager() {
    const enabled = this.data.enabledModules
    const moduleDefs = this.data.moduleDefs.map(d => ({
      ...d,
      added: enabled.includes(d.key)
    }))
    this.setData({ showModuleManager: true, isRemovingMode: false, moduleDefs })
  },

  // 关闭模块管理器
  closeModuleManager() {
    this.setData({ showModuleManager: false, isRemovingMode: false })
  },

  // 切换到删除模式
  toggleRemoveMode() {
    this.setData({ isRemovingMode: !this.data.isRemovingMode })
  },

  // 添加模块到快速记录
  addModule(e) {
    const key = e.currentTarget.dataset.key
    const enabled = [...this.data.enabledModules]
    if (!enabled.includes(key)) {
      enabled.push(key)
      wx.setStorageSync('enabledModules', enabled)
      const moduleDefs = this.data.moduleDefs.map(d => ({
        ...d,
        added: enabled.includes(d.key)
      }))
      this.setData({ enabledModules: enabled, moduleDefs })
      this.computeQuickModules()
      this.refreshTabBar()
    }
  },

  // 从快速记录移除模块
  removeModule(e) {
    const key = e.currentTarget.dataset.key
    const enabled = this.data.enabledModules.filter(k => k !== key)
    if (enabled.length === 0) {
      wx.showToast({ title: '至少保留一个模块', icon: 'none' })
      return
    }
    wx.setStorageSync('enabledModules', enabled)
    const moduleDefs = this.data.moduleDefs.map(d => ({
      ...d,
      added: enabled.includes(d.key)
    }))
    this.setData({ enabledModules: enabled, isRemovingMode: false, moduleDefs })
    this.computeQuickModules()
    this.refreshTabBar()
  },

  // 刷新自定义 tabBar
  refreshTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().refreshTabs()
    }
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
      tempNickname: this.data.userInfo?.nickname || this.data.userInfo?.nickName || '',
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

  // 选择预设头像（仅支持 emoji，不支持自定义上传）
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
      // 未登录时阻止保存
      if (!userInfo) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        wx.navigateTo({ url: '/pages/login/login' })
        return
      }

      // 更新用户信息（昵称和头像）
      const userUpdateData = {}
      if (tempNickname && tempNickname !== (userInfo.nickName || userInfo.nickname)) {
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

  // 跳转到目标列表
  goToGoals() {
    this.toggleGoalModal()
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

  // 目标记录
  async checkInGoal(e) {
    const { id } = e.currentTarget.dataset
    wx.showLoading({ title: '记录中...' })
    try {
      await app.request({
        url: '/goals',
        method: 'PATCH',
        data: { id, action: 'increment', increment: 1 }
      })
      wx.showToast({ title: '记录成功', icon: 'success' })
      await this.loadGoals()
    } catch (err) {
      console.error('记录失败:', err)
      wx.showToast({ title: '记录失败', icon: 'none' })
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
  }
})
