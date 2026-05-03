// pages/channel/channel.js
const app = getApp()

Page({
  data: {
    tasks: [],
    isLoading: false,
    
    // 创建任务弹窗
    showCreateModal: false,
    createForm: {
      title: '',
      description: '',
      type: 'fitness',
      startDate: '',
      endDate: '',
      invitees: []
    },
    
    // 好友列表（用于邀请）
    friends: [],
    showFriendSelector: false,
    
    // 同步打卡弹窗
    showCheckInModal: false,
    currentTask: null,
    myEntries: [],
    syncedEntryIds: []
  },

  onLoad() {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    this.setData({
      'createForm.startDate': this.formatDate(today),
      'createForm.endDate': this.formatDate(nextWeek)
    })
  },

  onShow() {
    this.loadTasks()
    this.loadFriends()
  },

  formatDate(date) {
    return date.toISOString().split('T')[0]
  },

  // 加载任务列表
  async loadTasks() {
    this.setData({ isLoading: true })
    try {
      const result = await app.request({ url: '/tasks' })
      const tasks = (result.tasks || []).map(t => ({
        ...t,
        timeLeft: this.calculateTimeLeft(t.endDate),
        dateRange: this.formatDateRange(t.startDate, t.endDate)
      }))
      this.setData({ tasks, isLoading: false })
    } catch (err) {
      console.error('加载任务失败:', err)
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 计算剩余时间
  calculateTimeLeft(endDate) {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return '已结束'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 0) return `剩${days}天`
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return `剩${hours}小时`
  },

  // 格式化日期范围
  formatDateRange(start, end) {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.getMonth() + 1}/${s.getDate()}-${e.getMonth() + 1}/${e.getDate()}`
  },

  // 加载好友列表
  async loadFriends() {
    try {
      const result = await app.request({ url: '/friends' })
      this.setData({ friends: result.friends || [] })
    } catch (err) {
      console.error('加载好友失败:', err)
    }
  },

  // 显示创建弹窗
  showCreateModal() {
    this.setData({ 
      showCreateModal: true,
      'createForm.invitees': []
    })
  },

  // 隐藏创建弹窗
  hideCreateModal() {
    this.setData({ showCreateModal: false })
  },

  // 创建表单输入
  onTitleInput(e) {
    this.setData({ 'createForm.title': e.detail.value })
  },

  onDescInput(e) {
    this.setData({ 'createForm.description': e.detail.value })
  },

  onTypeChange(e) {
    const types = ['fitness', 'reading']
    this.setData({ 'createForm.type': types[e.detail.value] })
  },

  onStartDateChange(e) {
    this.setData({ 'createForm.startDate': e.detail.value })
  },

  onEndDateChange(e) {
    this.setData({ 'createForm.endDate': e.detail.value })
  },

  // 显示好友选择器
  showFriendSelector() {
    this.setData({ showFriendSelector: true })
  },

  hideFriendSelector() {
    this.setData({ showFriendSelector: false })
  },

  // 选择好友
  toggleInvitee(e) {
    const { id } = e.currentTarget.dataset
    const invitees = this.data.createForm.invitees
    const index = invitees.indexOf(id)
    
    if (index > -1) {
      invitees.splice(index, 1)
    } else {
      invitees.push(id)
    }
    
    this.setData({ 'createForm.invitees': invitees })
  },

  // 获取好友名称
  getFriendName(friendId) {
    const friend = this.data.friends.find(f => f.friendId === friendId || f.id === friendId)
    return friend ? (friend.nickname || friend.username || '好友') : '好友'
  },

  // 确认邀请
  confirmInvitees() {
    this.setData({ showFriendSelector: false })
  },

  // 提交创建任务
  async submitCreate() {
    const { title, type, startDate, endDate, invitees } = this.data.createForm
    
    if (!title.trim()) {
      wx.showToast({ title: '请输入任务标题', icon: 'none' })
      return
    }

    wx.showLoading({ title: '创建中...' })
    try {
      await app.request({
        url: '/tasks',
        method: 'POST',
        data: {
          title: title.trim(),
          description: this.data.createForm.description,
          type,
          startDate,
          endDate,
          invitees
        }
      })
      
      wx.showToast({ title: '创建成功', icon: 'success' })
      this.setData({ showCreateModal: false })
      this.loadTasks()
    } catch (err) {
      console.error('创建任务失败:', err)
      wx.showToast({ title: '创建失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 接受邀请
  async joinTask(e) {
    const { id } = e.currentTarget.dataset
    wx.showLoading({ title: '处理中...' })
    try {
      await app.request({
        url: '/tasks',
        method: 'PATCH',
        data: { taskId: id, action: 'join' }
      })
      wx.showToast({ title: '已加入任务', icon: 'success' })
      this.loadTasks()
    } catch (err) {
      console.error('加入任务失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 拒绝邀请
  async declineTask(e) {
    const { id } = e.currentTarget.dataset
    wx.showLoading({ title: '处理中...' })
    try {
      await app.request({
        url: '/tasks',
        method: 'PATCH',
        data: { taskId: id, action: 'decline' }
      })
      wx.showToast({ title: '已拒绝邀请', icon: 'success' })
      this.loadTasks()
    } catch (err) {
      console.error('拒绝邀请失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 退出任务
  async leaveTask(e) {
    const { id } = e.currentTarget.dataset
    const res = await wx.showModal({
      title: '确认退出',
      content: '退出后将无法同步打卡记录到该任务，确定要退出吗？'
    })
    
    if (!res.confirm) return
    
    wx.showLoading({ title: '处理中...' })
    try {
      await app.request({
        url: '/tasks',
        method: 'PATCH',
        data: { taskId: id, action: 'leave' }
      })
      wx.showToast({ title: '已退出任务', icon: 'success' })
      this.loadTasks()
    } catch (err) {
      console.error('退出任务失败:', err)
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 提前结束任务
  async completeTask(e) {
    const { id } = e.currentTarget.dataset
    const res = await wx.showModal({
      title: '确认结束',
      content: '提前结束任务后，所有成员将无法继续打卡，确定要结束吗？'
    })
    
    if (!res.confirm) return
    
    wx.showLoading({ title: '处理中...' })
    try {
      await app.request({
        url: '/tasks',
        method: 'PATCH',
        data: { taskId: id, action: 'complete' }
      })
      wx.showToast({ title: '任务已结束', icon: 'success' })
      this.loadTasks()
    } catch (err) {
      console.error('结束任务失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 取消任务
  async cancelTask(e) {
    const { id } = e.currentTarget.dataset
    const res = await wx.showModal({
      title: '确认取消',
      content: '取消后任务将无法恢复，确定要取消吗？'
    })
    
    if (!res.confirm) return
    
    wx.showLoading({ title: '处理中...' })
    try {
      await app.request({
        url: '/tasks',
        method: 'PATCH',
        data: { taskId: id, action: 'cancel' }
      })
      wx.showToast({ title: '任务已取消', icon: 'success' })
      this.loadTasks()
    } catch (err) {
      console.error('取消任务失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 删除任务
  async deleteTask(e) {
    const { id } = e.currentTarget.dataset
    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后任务将无法恢复，确定要删除吗？'
    })
    
    if (!res.confirm) return
    
    wx.showLoading({ title: '删除中...' })
    try {
      await app.request({
        url: `/tasks?id=${id}`,
        method: 'DELETE'
      })
      wx.showToast({ title: '已删除', icon: 'success' })
      this.loadTasks()
    } catch (err) {
      console.error('删除任务失败:', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 显示同步打卡弹窗
  async showCheckInModal(e) {
    const { id, type } = e.currentTarget.dataset
    
    wx.showLoading({ title: '加载中...' })
    try {
      // 获取任务详情
      const result = await app.request({ url: `/tasks?id=${id}` })
      
      // 获取已同步的记录ID
      const syncedIds = result.checkIns
        .filter(c => String(c.userId) === String(app.globalData.userInfo?.id))
        .map(c => String(c.detail?.id))
      
      // 获取我的打卡记录
      let entries = []
      if (type === 'fitness') {
        const weightResult = await app.request({ url: '/weight' })
        entries = (weightResult.entries || []).map(e => ({
          ...e,
          displayText: `${e.weight} kg · ${e.note || '无备注'}`,
          dateStr: new Date(e.date).toLocaleDateString('zh-CN')
        }))
      } else {
        const readingResult = await app.request({ url: '/reading' })
        entries = (readingResult.entries || []).map(e => ({
          ...e,
          displayText: `《${e.bookName}》${e.pages}页 · ${e.note || '无备注'}`,
          dateStr: new Date(e.date).toLocaleDateString('zh-CN')
        }))
      }
      
      this.setData({
        showCheckInModal: true,
        currentTask: result.task,
        myEntries: entries,
        syncedEntryIds: syncedIds
      })
    } catch (err) {
      console.error('加载打卡记录失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  hideCheckInModal() {
    this.setData({ showCheckInModal: false })
  },

  // 同步打卡
  async syncCheckIn(e) {
    const { id, type } = e.currentTarget.dataset
    const { currentTask } = this.data
    
    if (!currentTask) return
    
    wx.showLoading({ title: '同步中...' })
    try {
      await app.request({
        url: '/tasks',
        method: 'PATCH',
        data: {
          taskId: currentTask.id,
          action: 'checkin',
          entryId: id,
          entryType: type === 'fitness' ? 'weight' : 'reading'
        }
      })
      wx.showToast({ title: '同步成功', icon: 'success' })
      this.setData({ 
        syncedEntryIds: [...this.data.syncedEntryIds, String(id)]
      })
    } catch (err) {
      console.error('同步打卡失败:', err)
      wx.showToast({ title: err.message || '同步失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 跳转到任务详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/channel/detail?id=${id}`
    })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadTasks()
    wx.stopPullDownRefresh()
  }
})
