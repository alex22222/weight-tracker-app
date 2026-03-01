'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Trash2, Plus, Settings, TrendingDown, TrendingUp, Minus, Activity, Target, Scale, LogOut } from 'lucide-react'
import { calculateBMI, getBMICategory, getBMIColors, formatShortDate } from '../lib/utils'

interface DashboardProps {
  onLogout: () => void
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

export default function Dashboard({ onLogout }: DashboardProps) {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [settings, setSettings] = useState({ height: 170, targetWeight: 65 })
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [showSettings, setShowSettings] = useState(false)
  const [height, setHeight] = useState('170')
  const [targetWeight, setTargetWeight] = useState('65')

  // 加载数据
  useEffect(() => {
    fetchEntries()
    fetchSettings()
  }, [])

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/weight')
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setHeight(String(data.height))
        setTargetWeight(String(data.targetWeight))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleAddEntry = async () => {
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      alert('请输入有效的体重值')
      return
    }

    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: weightNum, note, date }),
      })

      if (res.ok) {
        await fetchEntries()
        setWeight('')
        setNote('')
        setDate(new Date().toISOString().split('T')[0])
      }
    } catch (error) {
      console.error('Error adding entry:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return

    try {
      const res = await fetch(`/api/weight?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchEntries()
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  const handleUpdateSettings = async () => {
    const heightNum = parseFloat(height)
    const targetNum = parseFloat(targetWeight)

    if (isNaN(heightNum) || heightNum <= 0 || isNaN(targetNum) || targetNum <= 0) {
      alert('请输入有效的数值')
      return
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height: heightNum, targetWeight: targetNum }),
      })

      if (res.ok) {
        await fetchSettings()
        setShowSettings(false)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  const latestEntry = entries[0]
  const currentWeight = latestEntry?.weight || 0
  const bmi = calculateBMI(currentWeight, settings.height)
  const bmiInfo = getBMICategory(bmi)
  const bmiColors = getBMIColors(bmi)
  const weightDiff = currentWeight - settings.targetWeight

  const chartData: ChartData[] = [...entries].reverse().slice(-7).map(e => ({
    date: formatShortDate(e.date),
    weight: e.weight,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
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
            <div className="flex items-center gap-2">
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
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-800">
                {currentWeight > 0 ? currentWeight.toFixed(1) : '--'}
              </span>
              <span className="text-slate-500">kg</span>
            </div>
            {weightDiff !== 0 && (
              <p className={`text-sm mt-2 ${weightDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {weightDiff > 0 ? '超出' : '距离'}目标 {Math.abs(weightDiff).toFixed(1)} kg
              </p>
            )}
          </div>

          {/* BMI */}
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
            <p className={`text-sm mt-2 ${bmiColors.text}`}>{bmiInfo.label}</p>
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
            <p className="text-sm text-slate-400 mt-2">身高: {settings.height} cm</p>
          </div>
        </div>

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

        {/* 图表 */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">体重趋势</h2>
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
          </div>
        )}

        {/* 历史记录 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-emerald-100/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">历史记录</h2>
            <span className="text-sm text-slate-500">共 {entries.length} 条记录</span>
          </div>

          {showSettings && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3">个人设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">身高 (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
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
              </div>
              <button
                onClick={handleUpdateSettings}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
              >
                保存设置
              </button>
            </div>
          )}

          {entries.length === 0 ? (
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
                        {new Date(entry.date).toLocaleDateString('zh-CN')}
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
    </div>
  )
}