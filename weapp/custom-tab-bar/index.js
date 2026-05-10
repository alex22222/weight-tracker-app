const ALL_MODULES = [
  { key: 'home', pagePath: '/pages/home/home', text: '首页', icon: '🏠', fixed: true },
  { key: 'weight', pagePath: '/pages/index/index', text: '体重', icon: '⚖️' },
  { key: 'reading', pagePath: '/pages/reading/reading', text: '读书', icon: '📖' },
  { key: 'diet', pagePath: '/pages/diet/diet', text: '饮食', icon: '🍱' },
  { key: 'running', pagePath: '/pages/running/running', text: '跑步', icon: '🏃' },
  { key: 'cycling', pagePath: '/pages/cycling/cycling', text: '骑行', icon: '🚴' },
  { key: 'my', pagePath: '/pages/my/my', text: '我的', icon: '👤', fixed: true },
]

const DEFAULT_ENABLED = ['weight', 'reading', 'diet']

Component({
  data: {
    selected: 0,
    tabs: [],
  },

  lifetimes: {
    attached() {
      this.refreshTabs()
    },
  },

  pageLifetimes: {
    show() {
      this.refreshTabs()
    },
  },

  methods: {
    refreshTabs() {
      const enabled = wx.getStorageSync('enabledModules') || DEFAULT_ENABLED
      const enabledSet = new Set(enabled)

      const tabs = ALL_MODULES.filter(m => m.fixed || enabledSet.has(m.key))

      // 根据当前页面设置 selected
      const pages = getCurrentPages()
      let selected = -1
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const route = '/' + currentPage.route
        selected = tabs.findIndex(t => t.pagePath === route)
      }

      this.setData({ tabs, selected: selected !== -1 ? selected : 0 })
    },

    switchTab(e) {
      const { index } = e.currentTarget.dataset
      const url = this.data.tabs[index]?.pagePath
      if (!url) return

      this.setData({ selected: index })
      wx.switchTab({ url })
    },
  },
})
