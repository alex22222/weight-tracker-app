// BMI 计算
function calculateBMI(weight, height) {
  if (height <= 0 || weight <= 0) return 0
  return Number((weight / ((height / 100) * (height / 100))).toFixed(2))
}

// BMI 分类
function getBMICategory(bmi) {
  if (bmi <= 0) return { label: '暂无数据', color: '#94a3b8' }
  if (bmi < 18.5) return { label: '偏瘦', color: '#3b82f6' }
  if (bmi < 24) return { label: '正常', color: '#10b981' }
  if (bmi < 28) return { label: '超重', color: '#f59e0b' }
  return { label: '肥胖', color: '#ef4444' }
}

// BMI 样式配置
function getBMIStyles(bmi) {
  if (bmi <= 0) {
    return { 
      bg: 'bg-gray-light', 
      text: 'text-tertiary', 
      border: '2rpx solid #e2e8f0',
      color: '#94a3b8'
    }
  }
  if (bmi < 18.5) {
    return { 
      bg: 'bg-blue-light', 
      text: 'text-primary', 
      border: '2rpx solid #bfdbfe',
      color: '#3b82f6'
    }
  }
  if (bmi < 24) {
    return { 
      bg: 'bg-primary-light', 
      text: 'text-primary', 
      border: '2rpx solid #a7f3d0',
      color: '#10b981'
    }
  }
  if (bmi < 28) {
    return { 
      bg: 'bg-yellow-light', 
      text: 'text-warning', 
      border: '2rpx solid #fde68a',
      color: '#f59e0b'
    }
  }
  return { 
    bg: 'bg-red-light', 
    text: 'text-danger', 
    border: '2rpx solid #fecaca',
    color: '#ef4444'
  }
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 短日期格式
function formatShortDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 获取今天日期字符串
function getTodayString() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

module.exports = {
  calculateBMI,
  getBMICategory,
  getBMIStyles,
  formatDate,
  formatShortDate,
  getTodayString,
  generateId
}