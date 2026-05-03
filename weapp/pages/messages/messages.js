// pages/messages/messages.js
const app = getApp()

Page({
  data: {
    messages: [],
    unreadCount: 0,
    isLoading: false,
    batchMode: false,
    selectedIds: []
  },

  onLoad() {
    this.loadMessages()
  },

  onShow() {
    this.loadMessages()
    // 标记消息已读
    this.markAllAsRead()
  },

  // 加载消息列表
  async loadMessages() {
    try {
      const result = await app.request({
        url: '/messages'
      })

      const messages = result.messages || []
      const unreadCount = messages.filter(m => !m.isRead).length

      this.setData({
        messages,
        unreadCount
      })
    } catch (err) {
      console.error('加载消息失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 标记所有消息已读
  async markAllAsRead() {
    try {
      await app.request({
        url: '/messages',
        method: 'PATCH',
        data: { markAll: true }
      })
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  },

  // 切换批量模式
  toggleBatchMode() {
    this.setData({
      batchMode: !this.data.batchMode,
      selectedIds: []
    })
  },

  // 选择/取消选择消息
  toggleSelect(e) {
    const { id } = e.currentTarget.dataset
    const selectedIds = this.data.selectedIds
    const index = selectedIds.indexOf(id)

    if (index > -1) {
      selectedIds.splice(index, 1)
    } else {
      selectedIds.push(id)
    }

    this.setData({ selectedIds: [...selectedIds] })
  },

  // 全选
  selectAll() {
    const allIds = this.data.messages.map(m => m.id)
    this.setData({ selectedIds: allIds })
  },

  // 批量删除
  async batchDelete() {
    const { selectedIds } = this.data
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请先选择消息', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedIds.length} 条消息吗？`,
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            this.setData({ isLoading: true })
            // 逐个删除
            for (const id of selectedIds) {
              await app.request({
                url: `/messages?id=${id}`,
                method: 'DELETE'
              })
            }

            wx.showToast({
              title: `已删除 ${selectedIds.length} 条`,
              icon: 'success'
            })

            this.setData({
              batchMode: false,
              selectedIds: [],
              isLoading: false
            })
            this.loadMessages()
          } catch (err) {
            this.setData({ isLoading: false })
            wx.showToast({
              title: err.message || '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 清空所有消息
  async clearAllMessages() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有消息吗？此操作不可恢复',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            this.setData({ isLoading: true })
            await app.request({
              url: '/messages?all=true',
              method: 'DELETE'
            })

            wx.showToast({
              title: '已清空',
              icon: 'success'
            })

            this.setData({
              messages: [],
              unreadCount: 0,
              isLoading: false
            })
          } catch (err) {
            this.setData({ isLoading: false })
            wx.showToast({
              title: err.message || '清空失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 删除消息
  async deleteMessage(e) {
    const { id } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条消息吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/messages?id=${id}`,
              method: 'DELETE'
            })

            wx.showToast({
              title: '已删除',
              icon: 'success'
            })

            this.loadMessages()
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

  // 处理消息点击
  handleMessageTap(e) {
    const { message } = e.currentTarget.dataset
    
    // 根据消息类型处理
    if (message.type === 'CHANNEL_INVITE') {
      // 跳转到频道详情
      try {
        const data = JSON.parse(message.relatedData)
        if (data.channelId) {
          wx.navigateTo({
            url: `/pages/channel/detail?id=${data.channelId}`
          })
        }
      } catch (err) {
        console.error('解析消息数据失败:', err)
      }
    } else if (message.type === 'FRIEND_REQUEST') {
      // 跳转到好友页面
      wx.navigateTo({
        url: '/pages/my/my'
      })
    }
  },

  // 获取消息图标
  getMessageIcon(type) {
    const map = {
      'SYSTEM_LOGIN': '🔔',
      'SYSTEM_PASSWORD': '🔐',
      'FRIEND_REQUEST': '👋',
      'FRIEND_ACCEPT': '✅',
      'FRIEND_REJECT': '❌',
      'CHANNEL_INVITE': '🏃',
      'CHANNEL_CHECKIN': '📸'
    }
    return map[type] || '📢'
  },

  // 获取消息类型文本
  getMessageTypeText(type) {
    const map = {
      'SYSTEM_LOGIN': '系统',
      'SYSTEM_PASSWORD': '安全',
      'FRIEND_REQUEST': '好友',
      'FRIEND_ACCEPT': '好友',
      'FRIEND_REJECT': '好友',
      'CHANNEL_INVITE': '健身',
      'CHANNEL_CHECKIN': '打卡'
    }
    return map[type] || '消息'
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadMessages()
    wx.stopPullDownRefresh()
  }
})
