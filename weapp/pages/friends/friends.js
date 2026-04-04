// pages/friends/friends.js
const app = getApp()

Page({
  data: {
    friends: [],
    pendingRequests: [],
    suggestions: [], // 可能认识的用户
    showAddModal: false,
    searchUsername: '',
    isLoading: false
  },

  onLoad() {
    this.loadFriends()
    this.loadSuggestions()
  },

  onShow() {
    this.loadFriends()
    this.loadSuggestions()
  },

  // 加载可能认识的用户
  async loadSuggestions() {
    try {
      const result = await app.request({
        url: '/friends?type=suggestions'
      })
      // 处理数据，添加 avatarText 字段
      const suggestions = (result.suggestions || []).map(item => ({
        ...item,
        avatarText: (item.nickname || item.username || '?').charAt(0)
      }))
      this.setData({ suggestions })
    } catch (err) {
      console.error('加载推荐用户失败:', err)
    }
  },

  // 快速添加好友（来自推荐列表）
  async quickAddFriend(e) {
    const { username } = e.currentTarget.dataset
    
    this.setData({ isLoading: true })
    
    try {
      await app.request({
        url: '/friends',
        method: 'POST',
        data: { username }
      })

      wx.showToast({
        title: '请求已发送',
        icon: 'success'
      })

      // 从推荐列表中移除
      const suggestions = this.data.suggestions.filter(s => s.username !== username)
      this.setData({ suggestions, isLoading: false })
    } catch (err) {
      wx.showToast({
        title: err.message || '添加失败',
        icon: 'none'
      })
      this.setData({ isLoading: false })
    }
  },

  // 加载好友列表
  async loadFriends() {
    try {
      const result = await app.request({
        url: '/friends'
      })

      const friends = result.friends?.filter(f => f.status === 'ACCEPTED') || []
      const pendingRequests = result.friends?.filter(f => f.status === 'PENDING') || []

      this.setData({
        friends,
        pendingRequests
      })
    } catch (err) {
      console.error('加载好友失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 显示添加好友弹窗
  showAddModal() {
    this.setData({ 
      showAddModal: true,
      searchUsername: ''
    })
  },

  // 隐藏添加好友弹窗
  hideAddModal() {
    this.setData({ showAddModal: false })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchUsername: e.detail.value })
  },

  // 添加好友
  async addFriend() {
    const { searchUsername } = this.data
    
    if (!searchUsername.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      })
      return
    }

    // 不能添加自己
    if (searchUsername === app.globalData.userInfo?.username) {
      wx.showToast({
        title: '不能添加自己',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

    try {
      await app.request({
        url: '/friends',
        method: 'POST',
        data: { username: searchUsername }
      })

      wx.showToast({
        title: '请求已发送',
        icon: 'success'
      })

      this.setData({ 
        showAddModal: false,
        searchUsername: ''
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '添加失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 接受好友请求
  async acceptRequest(e) {
    const { id } = e.currentTarget.dataset
    
    try {
      await app.request({
        url: `/friends`,
        method: 'PATCH',
        data: { friendId: id, action: 'accept' }
      })

      wx.showToast({
        title: '已接受',
        icon: 'success'
      })

      this.loadFriends()
    } catch (err) {
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      })
    }
  },

  // 拒绝好友请求
  async rejectRequest(e) {
    const { id } = e.currentTarget.dataset
    
    try {
      await app.request({
        url: `/friends`,
        method: 'PATCH',
        data: { friendId: id, action: 'reject' }
      })

      wx.showToast({
        title: '已拒绝',
        icon: 'success'
      })

      this.loadFriends()
    } catch (err) {
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      })
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadFriends()
    wx.stopPullDownRefresh()
  },

  // 阻止事件冒泡
  stopPropagation() {}
})
