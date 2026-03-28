// pages/channel/detail.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    channelId: null,
    channel: null,
    weeklyStats: null,
    checkIns: [],
    comments: [],
    leaves: [],
    leaveStats: { totalDays: 0, leaves: [] },
    isOwner: false,
    activeTab: 'checkin', // checkin | comment | leave
    
    // 加载状态
    isSubmittingCheckIn: false,
    isSubmittingComment: false,
    isSubmittingLeave: false,
    
    // 打卡弹窗
    showCheckInModal: false,
    checkInData: {
      date: '',
      duration: 30,
      note: ''
    },
    
    // 邀请弹窗
    showInviteModal: false,
    friends: [],
    selectedFriends: [],

    // 评论输入
    commentText: '',

    // 请假弹窗
    showLeaveModal: false,
    leaveData: {
      startDate: '',
      endDate: '',
      reason: ''
    }
  },

  onLoad(options) {
    const { id } = options
    const today = util.getTodayString()
    this.setData({ 
      channelId: id,
      'checkInData.date': today,
      'leaveData.startDate': today,
      'leaveData.endDate': today
    })
    this.loadChannelDetail()
  },

  onShow() {
    if (this.data.channelId) {
      this.loadChannelDetail()
    }
  },

  // 加载频道详情
  async loadChannelDetail() {
    try {
      const { channelId, activeTab } = this.data
      
      // 获取频道详情
      const channelResult = await app.request({
        url: `/channels/${channelId}`
      })
      const channel = channelResult.channel || channelResult
      
      // 获取每周统计
      const stats = await app.request({
        url: `/channels/${channelId}/stats`
      })
      
      // 获取打卡记录
      const checkInsResult = await app.request({
        url: `/channels/${channelId}/checkin`
      })
      const checkIns = checkInsResult.checkIns || checkInsResult || []
      
      const isOwner = channel.creatorId === app.globalData.userInfo?.id
      
      this.setData({
        channel,
        weeklyStats: stats,
        checkIns: checkIns,
        isOwner
      })

      // 根据当前 tab 加载对应数据
      if (activeTab === 'comment') {
        this.loadComments()
      } else if (activeTab === 'leave') {
        this.loadLeaves()
      }
    } catch (err) {
      console.error('加载频道详情失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 切换标签
  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({ activeTab: tab })
    
    if (tab === 'comment') {
      this.loadComments()
    } else if (tab === 'leave') {
      this.loadLeaves()
    }
  },

  // ========== 频道控制 ==========
  
  // 开始频道
  async startChannel() {
    try {
      await app.request({
        url: `/channels/${this.data.channelId}/control`,
        method: 'POST',
        data: { action: 'start' }
      })
      
      wx.showToast({
        title: '已开始',
        icon: 'success'
      })
      
      this.loadChannelDetail()
    } catch (err) {
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      })
    }
  },

  // 结束频道
  async endChannel() {
    wx.showModal({
      title: '确认结束',
      content: '确定要提前结束这个健身频道吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/channels/${this.data.channelId}/control`,
              method: 'POST',
              data: { action: 'end' }
            })
            
            wx.showToast({
              title: '已结束',
              icon: 'success'
            })
            
            this.loadChannelDetail()
          } catch (err) {
            wx.showToast({
              title: err.message || '操作失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 删除频道
  async deleteChannel() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个健身频道吗？此操作不可恢复！',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/channels/${this.data.channelId}`,
              method: 'DELETE'
            })
            
            wx.showToast({
              title: '已删除',
              icon: 'success'
            })
            
            setTimeout(() => {
              wx.navigateBack()
            }, 500)
          } catch (err) {
            wx.showToast({
              title: err.message || '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // ========== 打卡功能 ==========

  // 显示打卡弹窗
  showCheckInModal() {
    console.log('=== 点击打卡按钮 ===', this.data.channel)
    const { channel } = this.data
    
    // 检查频道数据是否加载完成
    if (!channel) {
      console.log('频道数据未加载')
      wx.showToast({
        title: '频道数据加载中，请稍候',
        icon: 'none'
      })
      return
    }
    
    if (channel.status === 'COMPLETED') {
      wx.showToast({
        title: '频道已结束',
        icon: 'none'
      })
      return
    }
    
    // PENDING 和 ACTIVE 状态都允许打卡
    console.log('显示打卡弹窗')
    this.setData({ 
      showCheckInModal: true,
      'checkInData.date': util.getTodayString(),
      'checkInData.duration': channel.checkInMinutes || 30
    })
  },

  // 隐藏打卡弹窗
  hideCheckInModal() {
    this.setData({ showCheckInModal: false })
  },

  // 打卡表单输入
  onCheckInDateChange(e) {
    this.setData({ 'checkInData.date': e.detail.value })
  },

  onDurationInput(e) {
    this.setData({ 'checkInData.duration': parseInt(e.detail.value) || 0 })
  },

  onCheckInNoteInput(e) {
    this.setData({ 'checkInData.note': e.detail.value })
  },

  // 选择图片
  chooseImage() {
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album']
        
        // 使用兼容的 chooseImage API
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: sourceType,
          success: (res) => {
            console.log('选择图片成功:', res.tempFilePaths[0])
            this.uploadImage(res.tempFilePaths[0])
          },
          fail: (err) => {
            console.error('选择图片失败:', err)
            wx.showToast({ title: '选择图片失败', icon: 'none' })
          }
        })
      }
    })
  },

  // 上传图片（直接使用 wx.uploadFile）
  uploadImage(filePath) {
    const app = getApp()
    const token = app.globalData.token
    const config = require('../../config.js')
    
    console.log('=== 开始上传图片 ===')
    console.log('文件路径:', filePath)
    console.log('Token:', token)
    
    if (!token) {
      wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '上传中...' })
    
    // 构建 URL（token 可能有特殊字符，需要编码）
    const apiBaseUrl = config.apiBaseUrl.replace('/api', '')
    const uploadUrl = `${apiBaseUrl}/upload?token=${encodeURIComponent(token)}`
    console.log('上传地址:', uploadUrl)
    
    wx.uploadFile({
      url: uploadUrl,
      filePath: filePath,
      name: 'file',
      success: (res) => {
        wx.hideLoading()
        console.log('上传响应状态码:', res.statusCode)
        console.log('上传响应数据:', res.data)
        
        // 如果返回 500 错误
        if (res.statusCode === 500) {
          wx.showToast({ title: '服务器内部错误', icon: 'none' })
          return
        }
        
        // 如果不是 200
        if (res.statusCode !== 200) {
          wx.showToast({ title: '上传失败: ' + res.statusCode, icon: 'none' })
          return
        }
        
        let data = res.data
        // 如果响应是字符串，尝试解析 JSON
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data)
          } catch (e) {
            console.error('JSON 解析失败:', data)
            wx.showToast({ title: '服务器响应错误', icon: 'none' })
            return
          }
        }
        
        if (data.url) {
          this.setData({ 'checkInData.imageUrl': data.url })
          wx.showToast({ title: '上传成功', icon: 'success' })
        } else {
          wx.showToast({ title: data.error || '上传失败', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('上传失败:', err)
        wx.showToast({ title: '上传失败: ' + (err.errMsg || '网络错误'), icon: 'none' })
      }
    })
  },

  // 预览图片
  previewImage() {
    wx.previewImage({
      urls: [this.data.checkInData.imageUrl]
    })
  },

  // 预览打卡记录图片
  previewCheckInImage(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({
      urls: [url]
    })
  },

  // 删除图片
  deleteImage() {
    this.setData({ 'checkInData.imageUrl': '' })
  },

  // 提交打卡
  async submitCheckIn() {
    console.log('=== 提交打卡 ===', this.data.checkInData)
    const { channelId, checkInData, channel } = this.data
    
    // 检查频道数据
    if (!channel) {
      wx.showToast({ title: '频道数据加载中', icon: 'none' })
      return
    }
    
    if (checkInData.duration < (channel.checkInMinutes || 30)) {
      wx.showToast({
        title: `打卡时长至少${channel.checkInMinutes || 30}分钟`,
        icon: 'none'
      })
      return
    }
    
    console.log('发送打卡请求:', { channelId, checkInData })

    this.setData({ isSubmittingCheckIn: true })

    try {
      await app.request({
        url: `/channels/${channelId}/checkin`,
        method: 'POST',
        data: {
          checkDate: checkInData.date,
          duration: checkInData.duration,
          note: checkInData.note,
          imageUrl: checkInData.imageUrl
        }
      })

      wx.showToast({
        title: '打卡成功',
        icon: 'success'
      })

      this.setData({ 
        showCheckInModal: false, 
        isSubmittingCheckIn: false,
        'checkInData.imageUrl': '',
        'checkInData.note': ''
      }, () => {
        this.loadChannelDetail()
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '打卡失败',
        icon: 'none'
      })
      this.setData({ isSubmittingCheckIn: false })
    }
  },

  // ========== 邀请功能 ==========

  // 加载好友列表
  async loadFriends() {
    try {
      const result = await app.request({
        url: '/friends'
      })
      
      // 过滤已经是成员的好友
      const { channel } = this.data
      if (!channel) {
        this.setData({ friends: [], selectedFriends: [] })
        return
      }
      const memberIds = (channel.members || []).map(m => m.userId || m.id)
      const availableFriends = (result.friends || []).filter(
        f => f.status === 'ACCEPTED' && !memberIds.includes(f.id)
      )
      
      this.setData({ 
        friends: availableFriends,
        selectedFriends: []
      })
    } catch (err) {
      console.error('加载好友失败:', err)
    }
  },

  // 显示邀请弹窗
  showInviteModal() {
    this.setData({ showInviteModal: true })
    this.loadFriends()
  },

  // 隐藏邀请弹窗
  hideInviteModal() {
    this.setData({ showInviteModal: false })
  },

  // 选择好友
  toggleFriend(e) {
    const { id } = e.currentTarget.dataset
    const { selectedFriends } = this.data
    
    const index = selectedFriends.indexOf(id)
    if (index > -1) {
      selectedFriends.splice(index, 1)
    } else {
      selectedFriends.push(id)
    }
    
    this.setData({ selectedFriends: [...selectedFriends] })
  },

  // 发送邀请
  async sendInvites() {
    const { selectedFriends, channelId, friends } = this.data
    
    if (selectedFriends.length === 0) {
      wx.showToast({
        title: '请选择好友',
        icon: 'none'
      })
      return
    }

    try {
      // 逐个发送邀请
      for (const friendId of selectedFriends) {
        const friend = friends.find(f => f.id === friendId)
        if (friend) {
          await app.request({
            url: `/channels/${channelId}`,
            method: 'POST',
            data: { username: friend.username }
          })
        }
      }

      wx.showToast({
        title: '邀请已发送',
        icon: 'success'
      })

      this.setData({ showInviteModal: false })
    } catch (err) {
      wx.showToast({
        title: err.message || '邀请失败',
        icon: 'none'
      })
    }
  },

  // ========== 评论功能 ==========

  // 加载评论列表
  async loadComments() {
    try {
      const { channelId } = this.data
      const result = await app.request({
        url: `/channels/${channelId}/comments`
      })
      
      this.setData({ comments: result.comments || [] })
    } catch (err) {
      console.error('加载评论失败:', err)
    }
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  // 发表评论
  async submitComment() {
    const { channelId, commentText } = this.data
    
    if (!commentText.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    this.setData({ isSubmittingComment: true })

    try {
      await app.request({
        url: `/channels/${channelId}/comments`,
        method: 'POST',
        data: { content: commentText.trim() }
      })

      wx.showToast({
        title: '评论成功',
        icon: 'success'
      })

      this.setData({ commentText: '', isSubmittingComment: false })
      this.loadComments()
    } catch (err) {
      wx.showToast({
        title: err.message || '评论失败',
        icon: 'none'
      })
      this.setData({ isSubmittingComment: false })
    }
  },

  // 删除评论
  async deleteComment(e) {
    const { id } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/channels/${this.data.channelId}/comments?commentId=${id}`,
              method: 'DELETE'
            })

            wx.showToast({
              title: '已删除',
              icon: 'success'
            })

            this.loadComments()
          } catch (err) {
            wx.showToast({
              title: err.message || '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // ========== 请假功能 ==========

  // 加载请假列表
  async loadLeaves() {
    try {
      const { channelId } = this.data
      const result = await app.request({
        url: `/channels/${channelId}/leave`
      })
      
      this.setData({
        leaves: result.leaves || [],
        leaveStats: result.leaveStats || { totalDays: 0, leaves: [] },
        maxLeaveDays: result.maxLeaveDays || 3
      })
    } catch (err) {
      console.error('加载请假列表失败:', err)
    }
  },

  // 显示请假弹窗
  showLeaveModal() {
    const { channel } = this.data
    if (channel.maxLeaveDays === 0) {
      wx.showToast({
        title: '该频道不允许请假',
        icon: 'none'
      })
      return
    }

    const today = util.getTodayString()
    this.setData({
      showLeaveModal: true,
      'leaveData.startDate': today,
      'leaveData.endDate': today,
      'leaveData.reason': ''
    })
  },

  // 隐藏请假弹窗
  hideLeaveModal() {
    this.setData({ showLeaveModal: false })
  },

  // 请假表单输入
  onLeaveStartDateChange(e) {
    this.setData({ 'leaveData.startDate': e.detail.value })
  },

  onLeaveEndDateChange(e) {
    this.setData({ 'leaveData.endDate': e.detail.value })
  },

  onLeaveReasonInput(e) {
    this.setData({ 'leaveData.reason': e.detail.value })
  },

  // 提交请假申请
  async submitLeave() {
    const { channelId, leaveData } = this.data

    if (!leaveData.startDate || !leaveData.endDate) {
      wx.showToast({
        title: '请选择请假日期',
        icon: 'none'
      })
      return
    }

    this.setData({ isSubmittingLeave: true })

    try {
      await app.request({
        url: `/channels/${channelId}/leave`,
        method: 'POST',
        data: {
          startDate: leaveData.startDate,
          endDate: leaveData.endDate,
          reason: leaveData.reason
        }
      })

      wx.showToast({
        title: '申请已提交',
        icon: 'success'
      })

      this.setData({ showLeaveModal: false, isSubmittingLeave: false }, () => {
        this.loadLeaves()
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '申请失败',
        icon: 'none'
      })
      this.setData({ isSubmittingLeave: false })
    }
  },

  // 审批请假申请
  async handleLeaveRequest(e) {
    const { id, action } = e.currentTarget.dataset
    
    try {
      await app.request({
        url: `/channels/${this.data.channelId}/leave`,
        method: 'PATCH',
        data: { requestId: id, action }
      })

      wx.showToast({
        title: action === 'approve' ? '已批准' : '已拒绝',
        icon: 'success'
      })

      this.loadLeaves()
    } catch (err) {
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      })
    }
  },

  // ========== 工具方法 ==========

  // 获取状态文本
  getStatusText(status) {
    const map = {
      'PENDING': '未开始',
      'ACTIVE': '进行中',
      'COMPLETED': '已结束'
    }
    return map[status] || status
  },

  // 获取状态颜色
  getStatusColor(status) {
    const map = {
      'PENDING': '#f59e0b',
      'ACTIVE': '#10b981',
      'COMPLETED': '#94a3b8'
    }
    return map[status] || '#94a3b8'
  },

  // 获取请假状态文本
  getLeaveStatusText(status) {
    const map = {
      'PENDING': '待审批',
      'APPROVED': '已通过',
      'REJECTED': '已拒绝'
    }
    return map[status] || status
  },

  // 获取请假状态颜色
  getLeaveStatusColor(status) {
    const map = {
      'PENDING': '#f59e0b',
      'APPROVED': '#10b981',
      'REJECTED': '#ef4444'
    }
    return map[status] || '#94a3b8'
  },

  // 阻止事件冒泡
  stopPropagation() {}
})
