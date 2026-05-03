Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    text: {
      type: String,
      value: '加载中...'
    },
    type: {
      type: String,
      value: 'inline' // 'inline' | 'page'
    }
  }
})
