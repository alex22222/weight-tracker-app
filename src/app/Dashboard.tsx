'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Trash2, Plus, Settings, TrendingDown, TrendingUp, Minus, Activity, Target, Scale, LogOut, User, X, Camera, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'
import { calculateBMI, getBMICategory, getBMIColors, formatShortDate, formatRelativeDate } from '../lib/utils'

interface DashboardProps {
  onLogout: () => void
  username?: string
  userId: string | null
}

interface WeightEntry {
  id: number
  weight: number
  note: string | null
  date: string
}

interface ChartData {
  date: string
  weight: number
}

interface UserSettings {
  height: number
  targetWeight: number
  gender: string
  age: number
  avatar: string
}

// ==================== 常量 ====================
type ChartRange = '7d' | '30d' | '6m' | 'all'

const CHART_RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: '6m', label: '半年' },
  { value: 'all', label: '全部' },
]

// ==================== 子组件 ====================

// 默认头像 SVG
const DefaultAvatar = () => (
  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
    <User className="w-1/2 h-1/2 text-white" />
  </div>
)

// Toast 通知组件
function Toast({ message, type, onDismiss }: { message: string; type: 'error' | 'success' | 'info'; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const colors = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  }

  const icons = {
    error: <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    success: <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    info: <Activity className="w-5 h-5 text-blue-500 flex-shrink-0" />,
  }

  return (
    <div className={`fixed top-4 right-4 z-[100] max-w-sm p-4 rounded-xl border shadow-lg animate-slide-in ${colors[type]}`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// BMI 刻度条组件
function BMIScaleBar({ bmi }: { bmi: number }) {
  const zones = [
    { min: 0, max: 18.5, label: '偏瘦', color: 'bg-blue-400' },
    { min: 18.5, max: 24, label: '正常', color: 'bg-emerald-400' },
    { min: 24, max: 28, label: '超重', color: 'bg-yellow-400' },
    { min: 28, max: 40, label: '肥胖', color: 'bg-red-400' },
  ]

  // 计算指示器位置（百分比 0-100，对应 BMI 10-40）
  const indicatorPosition = Math.max(0, Math.min(100, ((bmi - 10) / 30) * 100))

  return (
    <div className="mt-3 space-y-1.5">
      {/* 刻度条 */}
      <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
        {/* 彩色分段 */}
        <div className="absolute inset-0 flex">
          {zones.map((zone) => (
            <div
              key={zone.label}
              className={`h-full ${zone.color} opacity-60`}
              style={{ width: `${((zone.max - zone.min) / 30) * 100}%` }}
            />
          ))}
        </div>
        {/* BMI 指示器 */}
        {bmi > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-slate-700 rounded-full shadow-sm transition-all duration-500"
            style={{ left: `calc(${indicatorPosition}% - 6px)` }}
          />
        )}
      </div>
      {/* 标签 */}
      <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
        {zones.map((zone) => (
          <span key={zone.label}>{zone.label}</span>
        ))}
      </div>
    </div>
  )
}

// 计算建议体重（基于身高、性别、年龄）
function calculateRecommendedWeight(height: number, gender: string, age: number): number {
  let baseWeight = gender === 'male'
    ? (height - 80) * 0.7
    : (height - 70) * 0.6

  let ageAdjustment = 0
  if (age < 18) {
    ageAdjustment = -2
  } else if (age >= 26 && age <= 40) {
    ageAdjustment = 1
  } else if (age > 40 && age <= 60) {
    ageAdjustment = 2
  } else if (age > 60) {
    ageAdjustment = 1
  }

  return Math.round((baseWeight + ageAdjustment) * 10) / 10
}

// 计算理想体重范围（基于 BMI 18.5-24）
function calculateIdealWeightRange(height: number): { min: number; max: number } {
  const h = height / 100
  return {
    min: Math.round(18.5 * h * h * 10) / 10,
    max: Math.round(24 * h * h * 10) / 10,
  }
}

// 生成个性化建议
function getBMISuggestions(bmi: number, currentWeight: number, targetWeight: number, idealRange: { min: number; max: number }): string {
  if (bmi <= 0) return ''
  if (bmi < 18.5) {
    const toGain = Math.round((idealRange.min - currentWeight) * 10) / 10
    return `建议增重 ${toGain > 0 ? toGain : ''} kg 以达到健康范围（${idealRange.min}-${idealRange.max} kg）。推荐增加蛋白质和健康脂肪摄入，配合力量训练。`
  }
  if (bmi >= 18.5 && bmi < 24) {
    const diff = targetWeight > 0 ? Math.abs(currentWeight - targetWeight) : 0
    if (diff <= 2) return `体重在健康范围内，继续保持当前生活方式即可。`
    return `体重在健康范围内。距离目标还差 ${diff.toFixed(1)} kg，保持均衡饮食和规律运动。`
  }
  if (bmi >= 24 && bmi < 28) {
    const toLose = Math.round((currentWeight - idealRange.max) * 10) / 10
    return `建议减重 ${toLose > 0 ? toLose : ''} kg 以回到健康范围。推荐每日热量缺口 300-500 kcal，每周 150 分钟有氧运动。`
  }
  const toLose = Math.round((currentWeight - idealRange.max) * 10) / 10
  return `体重超出健康范围较多，建议咨询医生或营养师制定减重计划。目标：减重 ${toLose > 0 ? toLose : ''} kg。`
}

// ==================== 主组件 ====================

export default function Dashboard({ onLogout, username = '用户', userId }: DashboardProps) {
  // 数据状态
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [settings, setSettings] = useState<UserSettings>({ height: 170, targetWeight: 65, gender: 'male', age: 25, avatar: '' })

  // 表单状态
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // UI 状态
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [height, setHeight] = useState('170')
  const [targetWeight, setTargetWeight] = useState('65')
  const [gender, setGender] = useState('male')
  const [age, setAge] = useState('25')
  const [avatar, setAvatar] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  const [profileAvatarError, setProfileAvatarError] = useState(false)

  // 图表时间范围
  const [chartRange, setChartRange] = useState<ChartRange>('7d')

  // 加载/错误状态
  const [loading, setLoading] = useState({ entries: false, settings: false })
  const [errors, setErrors] = useState({ entries: '', settings: '' })

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null)

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ message, type })
  }, [])

  // 加载数据
  useEffect(() => {
    if (userId !== null) {
      fetchEntries()
      fetchSettings()
    }
  }, [userId])

  const fetchEntries = async () => {
    if (userId === null) return
    setLoading(prev => ({ ...prev, entries: true }))
    setErrors(prev => ({ ...prev, entries: '' }))
    try {
      const res = await fetch(`/api/weight?userId=${userId}`)
      if (!res.ok) throw new Error(`服务器错误 (${res.status})`)
      const data = await res.json()
      setEntries(data)
    } catch (error: any) {
      const msg = error.message || '无法加载体重记录'
      setErrors(prev => ({ ...prev, entries: msg }))
      showToast(msg, 'error')
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(prev => ({ ...prev, entries: false }))
    }
  }

  const fetchSettings = async () => {
    if (userId === null) return
    setLoading(prev => ({ ...prev, settings: true }))
    setErrors(prev => ({ ...prev, settings: '' }))
    try {
      const res = await fetch(`/api/settings?userId=${userId}`)
      if (!res.ok) throw new Error(`服务器错误 (${res.status})`)
      const data = await res.json()
      setSettings(data)
      setHeight(String(data.height))
      setTargetWeight(String(data.targetWeight))
      setGender(data.gender || 'male')
      setAge(String(data.age || 25))
      setAvatar(data.avatar || '')
    } catch (error: any) {
      const msg = error.message || '无法加载用户设置'
      setErrors(prev => ({ ...prev, settings: msg }))
      showToast(msg, 'error')
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(prev => ({ ...prev, settings: false }))
    }
  }

  const handleAddEntry = async () => {
    if (userId === null) {
      showToast('请先登录', 'error')
      return
    }
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      showToast('请输入有效的体重值', 'error')
      return
    }

    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: weightNum, note, date, userId }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as any).error || `保存失败 (${res.status})`)
      }

      await fetchEntries()
      setWeight('')
      setNote('')
      setDate(new Date().toISOString().split('T')[0])
      showToast('体重记录已保存', 'success')
    } catch (error: any) {
      showToast(error.message || '保存失败，请重试', 'error')
      console.error('Error adding entry:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (userId === null) {
      showToast('请先登录', 'error')
      return
    }
    if (!confirm('确定要删除这条记录吗？')) return

    try {
      const res = await fetch(`/api/weight?id=${id}&userId=${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`删除失败 (${res.status})`)
      await fetchEntries()
      showToast('记录已删除', 'info')
    } catch (error: any) {
      showToast(error.message || '删除失败，请重试', 'error')
      console.error('Error deleting entry:', error)
    }
  }

  const handleUpdateSettings = async () => {
    if (userId === null) {
      showToast('请先登录', 'error')
      return
    }
    const targetNum = parseFloat(targetWeight)
    if (isNaN(targetNum) || targetNum <= 0) {
      showToast('请输入有效的目标体重', 'error')
      return
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetWeight: targetNum }),
      })
      if (!res.ok) throw new Error(`保存失败 (${res.status})`)
      await fetchSettings()
      setShowSettings(false)
      showToast('目标体重已更新', 'success')
    } catch (error: any) {
      showToast(error.message || '保存失败，请重试', 'error')
      console.error('Error updating settings:', error)
    }
  }

  const handleUpdateProfile = async () => {
    if (userId === null) {
      showToast('请先登录', 'error')
      return
    }
    const heightNum = parseFloat(height)
    const ageNum = parseInt(age)

    if (isNaN(heightNum) || heightNum <= 0) {
      showToast('请输入有效的身高', 'error')
      return
    }
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      showToast('请输入有效的年龄（1-120）', 'error')
      return
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, height: heightNum, gender, age: ageNum, avatar }),
      })
      if (!res.ok) throw new Error(`保存失败 (${res.status})`)
      await fetchSettings()
      setShowProfile(false)
      setProfileAvatarError(false)
      showToast('个人资料已更新', 'success')
    } catch (error: any) {
      showToast(error.message || '保存失败，请重试', 'error')
      console.error('Error updating profile:', error)
    }
  }

  // ========== 派生数据 ==========

  const recommendedWeight = useMemo(() => {
    if (settings.height && settings.age) {
      return calculateRecommendedWeight(settings.height, settings.gender, settings.age)
    }
    return null
  }, [settings])

  const idealWeightRange = useMemo(() => {
    return calculateIdealWeightRange(settings.height)
  }, [settings.height])

  const latestEntry = entries[0]
  const currentWeight = latestEntry?.weight || 0
  const bmi = calculateBMI(currentWeight, settings.height)
  const bmiInfo = getBMICategory(bmi)
  const bmiColors = getBMIColors(bmi)
  const weightDiff = currentWeight - settings.targetWeight
  const bmiSuggestion = useMemo(() => {
    return getBMISuggestions(bmi, currentWeight, settings.targetWeight, idealWeightRange)
  }, [bmi, currentWeight, settings.targetWeight, idealWeightRange])

  // 根据时间范围过滤图表数据
  const chartData: ChartData[] = useMemo(() => {
    const now = new Date()
    let cutoffDate: Date | null = null

    switch (chartRange) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '6m':
        cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        cutoffDate = null
        break
    }

    const filtered = cutoffDate
      ? entries.filter(e => new Date(e.date) >= cutoffDate!)
      : entries

    return [...filtered].reverse().map(e => ({
      date: formatShortDate(e.date),
      weight: e.weight,
    }))
  }, [entries, chartRange])

  // 头像显示
  const getAvatarDisplay = () => {
    if (settings.avatar && !avatarError) {
      return (
        <img
          src={settings.avatar}
          alt="头像"
          className="w-full h-full object-cover rounded-full"
          onError={() => setAvatarError(true)}
        />
      )
    }
    return <DefaultAvatar />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">体重管理器</h1>
                <p className="text-xs text-slate-500">Weight Tracker</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{username}</span>
                <button
                  onClick={() => setShowProfile(true)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-200 hover:border-emerald-400 transition-colors shadow-sm"
                  title="编辑个人资料"
                >
                  {getAvatarDisplay()}
                </button>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-slate-100 hover:bg-emerald-100 rounded-xl transition-colors"
                title="设置"
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={onLogout}
                className="p-2 bg-slate-100 hover:bg-red-100 rounded-xl transition-colors group"
                title="退出登录"
              >
                <LogOut className="w-5 h-5 text-slate-600 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 当前体重 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">当前体重</span>
              </div>
              {errors.entries && (
                <button
                  onClick={fetchEntries}
                  className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                  title="重新加载"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            {loading.entries && entries.length === 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-300 animate-pulse">--</span>
                <span className="text-slate-300">kg</span>
              </div>
            ) : errors.entries && entries.length === 0 ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-amber-500">⚠</span>
                  <span className="text-sm text-amber-600">加载失败</span>
                </div>
                <button
                  onClick={fetchEntries}
                  className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  点击重试
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-800">
                    {currentWeight > 0 ? currentWeight.toFixed(1) : '--'}
                  </span>
                  <span className="text-slate-500">kg</span>
                </div>
                {currentWeight > 0 && weightDiff !== 0 && (
                  <p className={`text-sm mt-2 ${weightDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {weightDiff > 0 ? '超出' : '距离'}目标 {Math.abs(weightDiff).toFixed(1)} kg
                  </p>
                )}
              </>
            )}
          </div>

          {/* BMI - 增强版 */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${bmiColors.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 ${bmiColors.bg} rounded-xl flex items-center justify-center`}>
                  <Target className={`w-5 h-5 ${bmiColors.text}`} />
                </div>
                <span className="text-sm font-medium text-slate-600">BMI 指数</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${bmiColors.text}`}>
                {bmi > 0 ? bmi : '--'}
              </span>
            </div>
            <p className={`text-sm mt-1 ${bmiColors.text}`}>{bmiInfo.label}</p>
            {/* BMI 刻度条 */}
            <BMIScaleBar bmi={bmi} />
            {/* 理想体重范围 */}
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>理想体重：{idealWeightRange.min} – {idealWeightRange.max} kg</span>
            </div>
          </div>

          {/* 目标体重 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Scale className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">目标体重</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-800">{settings.targetWeight}</span>
              <span className="text-slate-500">kg</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">身高: {settings.height} cm · {settings.gender === 'male' ? '男' : '女'} · {settings.age}岁</p>
          </div>
        </div>

        {/* BMI 个性化建议 */}
        {bmi > 0 && bmiSuggestion && (
          <div className={`rounded-2xl p-5 border ${bmiColors.border} ${bmiColors.bg}`}>
            <div className="flex items-start gap-3">
              <Sparkles className={`w-5 h-5 ${bmiColors.text} mt-0.5 flex-shrink-0`} />
              <div>
                <h3 className={`text-sm font-semibold ${bmiColors.text} mb-1`}>
                  {bmi < 18.5 ? '增重建议' : bmi < 24 ? '维持建议' : '减重建议'}
                </h3>
                <p className={`text-sm ${bmiColors.text} opacity-80 leading-relaxed`}>
                  {bmiSuggestion}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 添加记录表单 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-emerald-100/50">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            记录体重
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例如: 70.5"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">备注 (可选)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如: 早餐后"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddEntry}
                disabled={!weight}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                添加记录
              </button>
            </div>
          </div>
        </div>

        {/* 图表 - 带时间范围选择器 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">体重趋势</h2>
            {/* 时间范围选择器 */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              {CHART_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setChartRange(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    chartRange === opt.value
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                    }}
                    formatter={(value) => [`${Number(value).toFixed(1)} kg`, '体重']}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">
                  {entries.length === 0
                    ? '添加体重记录后即可查看趋势图'
                    : `该时间范围内暂无数据（共 ${entries.length} 条记录）`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 历史记录 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-emerald-100/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">历史记录</h2>
            <div className="flex items-center gap-3">
              {errors.entries && (
                <button
                  onClick={fetchEntries}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  重试
                </button>
              )}
              <span className="text-sm text-slate-500">共 {entries.length} 条记录</span>
            </div>
          </div>

          {showSettings && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3">体重目标设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">目标体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex items-end">
                  {recommendedWeight && (
                    <div className="text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <Sparkles className="w-4 h-4" />
                        建议体重: {recommendedWeight} kg
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        基于您的身高 {settings.height}cm、{settings.gender === 'male' ? '男' : '女'}、{settings.age}岁
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleUpdateSettings}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
              >
                保存目标
              </button>
            </div>
          )}

          {loading.entries && entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              <p>加载中...</p>
            </div>
          ) : errors.entries && entries.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
              <p className="text-slate-600 font-medium mb-1">加载失败</p>
              <p className="text-sm text-slate-400 mb-4">{errors.entries}</p>
              <button
                onClick={fetchEntries}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors font-medium text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                重新加载
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Scale className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>暂无记录，点击上方"添加记录"开始追踪您的体重</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">日期</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">体重</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">备注</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-800">
                        {formatRelativeDate(entry.date)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{entry.weight.toFixed(1)} kg</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{entry.note || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* 个人资料编辑弹窗 */}
      {showProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">编辑个人资料</h3>
              <button
                onClick={() => setShowProfile(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 头像预览和输入 */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-100 shadow-lg">
                  {avatar && !profileAvatarError ? (
                    <img
                      src={avatar}
                      alt="头像预览"
                      className="w-full h-full object-cover"
                      onError={() => setProfileAvatarError(true)}
                    />
                  ) : (
                    <DefaultAvatar />
                  )}
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    头像链接 <span className="text-slate-400 font-normal">（可选，留空使用默认头像）</span>
                  </label>
                  <div className="relative">
                    <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => {
                        setAvatar(e.target.value)
                        setProfileAvatarError(false)
                      }}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    支持图片链接，如微信头像链接、Gravatar 等
                  </p>
                </div>
              </div>

              {/* 性别选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">性别</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGender('male')}
                    className={`py-3 px-4 rounded-xl border-2 transition-all ${
                      gender === 'male'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:border-emerald-200 text-slate-600'
                    }`}
                  >
                    男
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    className={`py-3 px-4 rounded-xl border-2 transition-all ${
                      gender === 'female'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:border-emerald-200 text-slate-600'
                    }`}
                  >
                    女
                  </button>
                </div>
              </div>

              {/* 年龄 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">年龄 (岁)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  min="1"
                  max="120"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* 身高 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">身高 (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowProfile(false)}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateProfile}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
