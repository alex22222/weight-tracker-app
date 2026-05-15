'use client'
// Build: 20260503-01 - UI Redesign

import { useState, useEffect } from 'react'
import {
  LogOut, Users, Trash2, Edit2, X, Save, Search, TrendingUp, Scale,
  User, ChevronLeft, Key, MessageSquare, CheckCircle, Clock, AlertCircle,
  Activity, Award, Calendar, ArrowUpRight, ArrowDownRight, Filter,
  Mail, Phone, Package, Shield, MoreHorizontal, Eye,
  Database, Download, RotateCcw, HardDrive, FolderOpen, FileJson, FileCode
} from 'lucide-react'

interface AdminDashboardProps {
  adminId: string
  onLogout: () => void
}

interface UserData {
  id: number
  username: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
  totalUsageTime?: number
  settings?: {
    id: number
    height: number
    targetWeight: number
    gender: string
    age: number
    avatar: string
  } | null
  weightEntriesCount?: number
  _count?: {
    weightEntries: number
  }
}

interface WeightEntry {
  id: number
  weight: number
  note: string | null
  date: string
  createdAt: string
}

interface UserDetail extends UserData {
  weightEntries: WeightEntry[]
}

// 格式化使用时长
function formatUsageTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (mins === 0) return `${hours}小时`
  return `${hours}小时${mins}分钟`
}

// 默认头像
const DefaultAvatar = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center ${className}`}>
    <User className="w-1/2 h-1/2 text-white" />
  </div>
)

// 统计卡片组件
function StatCard({ icon: Icon, label, value, trend, color, delay = 0 }: any) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const colorClasses: Record<string, { bg: string; text: string; light: string }> = {
    emerald: { bg: 'from-emerald-500 to-teal-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
    blue: { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-600', light: 'bg-blue-50' },
    amber: { bg: 'from-amber-500 to-orange-500', text: 'text-amber-600', light: 'bg-amber-50' },
    purple: { bg: 'from-purple-500 to-pink-500', text: 'text-purple-600', light: 'bg-purple-50' },
  }
  const c = colorClasses[color] || colorClasses.emerald

  return (
    <div
      className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${c.light}`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  )
}

// 头像显示组件
function AvatarDisplay({ avatarUrl, size = 'w-8 h-8', className = '' }: { avatarUrl?: string; size?: string; className?: string }) {
  const [error, setError] = useState(false)
  if (avatarUrl && !error) {
    return (
      <img
        src={avatarUrl}
        alt="头像"
        className={`${size} object-cover rounded-full ${className}`}
        onError={() => setError(true)}
      />
    )
  }
  return (
    <div className={`bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center ${size} ${className}`}>
      <User className="w-1/2 h-1/2 text-white" />
    </div>
  )
}

// 编辑用户弹窗组件
function EditUserModal({ user, isOpen, onClose, onSave }: {
  user: UserData | null
  isOpen: boolean
  onClose: () => void
  onSave: (userId: number, data: any) => void
}) {
  const [form, setForm] = useState({
    username: '',
    avatar: '',
    gender: 'male',
    height: '',
    age: '',
    targetWeight: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        avatar: user.settings?.avatar || '',
        gender: user.settings?.gender || 'male',
        height: String(user.settings?.height || ''),
        age: String(user.settings?.age || ''),
        targetWeight: String(user.settings?.targetWeight || ''),
      })
    }
  }, [user])

  if (!isOpen || !user) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(user.id, {
      username: form.username,
      settings: {
        avatar: form.avatar,
        gender: form.gender,
        height: form.height ? Number(form.height) : undefined,
        age: form.age ? Number(form.age) : undefined,
        targetWeight: form.targetWeight ? Number(form.targetWeight) : undefined,
      },
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">编辑用户</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">用户名</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">性别</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">身高 (cm)</label>
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">年龄</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">目标体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.targetWeight}
                onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">头像链接</label>
              <input
                type="text"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 反馈卡片组件
function FeedbackCard({ feedback, onStatusChange }: any) {
  const typeMap: Record<string, { label: string; color: string; bg: string }> = {
    bug: { label: '功能异常', color: 'text-red-600', bg: 'bg-red-50' },
    feature: { label: '功能建议', color: 'text-blue-600', bg: 'bg-blue-50' },
    ui: { label: '界面问题', color: 'text-purple-600', bg: 'bg-purple-50' },
    performance: { label: '性能问题', color: 'text-orange-600', bg: 'bg-orange-50' },
    other: { label: '其他', color: 'text-slate-600', bg: 'bg-slate-50' },
  }

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '待处理', color: 'text-amber-600', bg: 'bg-amber-50' },
    processing: { label: '处理中', color: 'text-blue-600', bg: 'bg-blue-50' },
    resolved: { label: '已解决', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    rejected: { label: '已拒绝', color: 'text-red-600', bg: 'bg-red-50' },
  }

  const t = typeMap[feedback.type] || typeMap.other
  const s = statusMap[feedback.status] || statusMap.pending

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${t.bg} ${t.color}`}>
              {t.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${s.bg} ${s.color}`}>
              {s.label}
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{feedback.content}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {feedback.contact || '无联系方式'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(feedback.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
        <select
          value={feedback.status}
          onChange={(e) => onStatusChange(feedback.id, e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
        >
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
    </div>
  )
}

export default function AdminDashboard({ adminId, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'feedback' | 'backup'>('users')

  const [feedbackList, setFeedbackList] = useState<any[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all')

  const [backups, setBackups] = useState<any[]>([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupStatus, setBackupStatus] = useState<any>(null)
  const [restoreLoading, setRestoreLoading] = useState<string | null>(null)

  const [editForm, setEditForm] = useState({
    username: '',
    height: '',
    targetWeight: '',
    gender: 'male',
    age: '',
    avatar: '',
  })

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/users?adminId=${adminId}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetail = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/user?adminId=${adminId}&userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedUser(data)
        setEditForm({
          username: data.username,
          height: String(data.settings?.height || 170),
          targetWeight: String(data.settings?.targetWeight || 65),
          gender: data.settings?.gender || 'male',
          age: String(data.settings?.age || 25),
          avatar: data.settings?.avatar || '',
        })
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error fetching user detail:', error)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch('/api/admin/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          userId: selectedUser.id,
          username: editForm.username,
          settings: {
            height: editForm.height,
            targetWeight: editForm.targetWeight,
            gender: editForm.gender,
            age: editForm.age,
            avatar: editForm.avatar,
          },
        }),
      })
      if (res.ok) {
        await fetchUsers()
        await fetchUserDetail(selectedUser.id)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleOpenEditModal = (user: UserData) => {
    setEditingUser(user)
    setEditModalOpen(true)
  }

  const handleSaveEditModal = async (userId: number, data: any) => {
    try {
      const res = await fetch('/api/admin/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          userId,
          username: data.username,
          avatar: data.settings.avatar,
          gender: data.settings.gender,
          height: data.settings.height,
          age: data.settings.age,
          targetWeight: data.settings.targetWeight,
        }),
      })
      if (res.ok) {
        await fetchUsers()
        setEditModalOpen(false)
        setEditingUser(null)
      } else {
        const err = await res.json()
        alert(err.error || '保存失败')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('保存失败')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除这个用户吗？此操作不可恢复！')) return
    try {
      const res = await fetch(`/api/admin/user?adminId=${adminId}&userId=${userId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchUsers()
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleResetPassword = async (userId: number, username: string) => {
    if (!confirm(`确定要重置用户 "${username}" 的密码为默认密码 "111111" 吗？`)) return
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, userId }),
      })
      if (res.ok) {
        alert(`用户 "${username}" 的密码已重置为：111111`)
      } else {
        const data = await res.json()
        alert(data.error || '重置密码失败')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('重置密码失败')
    }
  }

  const fetchFeedback = async () => {
    try {
      setFeedbackLoading(true)
      const res = await fetch(`/api/admin/feedback?adminId=${adminId}`)
      if (res.ok) {
        const data = await res.json()
        setFeedbackList(data.feedback || [])
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setFeedbackLoading(false)
    }
  }

  const handleUpdateFeedbackStatus = async (feedbackId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, feedbackId, status }),
      })
      if (res.ok) await fetchFeedback()
    } catch (error) {
      console.error('Error updating feedback:', error)
    }
  }

  const fetchBackups = async () => {
    try {
      setBackupLoading(true)
      const res = await fetch(`/api/admin/backups?adminId=${adminId}`)
      if (res.ok) {
        const data = await res.json()
        setBackups(data.backups || [])
        setBackupStatus(data.status || null)
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestore = async (date: string) => {
    if (!confirm(`确定要从 ${date} 的备份还原数据库吗？\n\n⚠️ 此操作将覆盖当前数据库！\n⚠️ 当前数据库会自动备份。`)) return
    try {
      setRestoreLoading(date)
      const res = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, date }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ 数据库已成功从 ${date} 还原！\n原数据库已备份为: ${data.currentDbBackup}`)
      } else {
        alert(`❌ 还原失败: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      alert('❌ 还原失败')
    } finally {
      setRestoreLoading(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredUsers = users.filter(user =>
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const filteredFeedback = feedbackList.filter(f =>
    feedbackFilter === 'all' ? true : f.status === feedbackFilter
  )

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100
    return Math.round(weight / (heightInMeters * heightInMeters))
  }

  // 头像加载错误状态
  const [detailAvatarError, setDetailAvatarError] = useState(false)

  const getAvatarDisplay = (avatarUrl?: string, size = 'w-16 h-16') => {
    if (avatarUrl && !detailAvatarError) {
      return (
        <img
          src={avatarUrl}
          alt="头像"
          className={`${size} object-cover rounded-full`}
          onError={() => setDetailAvatarError(true)}
        />
      )
    }
    return <DefaultAvatar className={size} />
  }

  const todayUsers = users.filter(u => {
    const today = new Date().toDateString()
    const userDate = new Date(u.createdAt).toDateString()
    return today === userDate
  }).length

  const totalRecords = users.reduce((sum, u) => sum + (u.weightEntriesCount ?? u._count?.weightEntries ?? 0), 0)

  // ========== 用户详情页 ==========
  if (selectedUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        {/* 顶部导航 */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors group"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-800 transition-colors" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">用户详情</h1>
                  <p className="text-xs text-slate-400">User Profile</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 hidden sm:inline">ID: {selectedUser.id}</span>
                <button
                  onClick={onLogout}
                  className="p-2.5 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors group"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-600 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* 用户信息头部 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-slate-100 shadow-lg">
                  {getAvatarDisplay(selectedUser.settings?.avatar, 'w-full h-full')}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-slate-800">{selectedUser.username}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  注册于 {new Date(selectedUser.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑资料
                  </button>
                )}
                <button
                  onClick={() => handleResetPassword(selectedUser.id, selectedUser.username)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors font-medium text-sm"
                >
                  <Key className="w-4 h-4" />
                  重置密码
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-8 pt-8 border-t border-slate-100 space-y-5">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-500" />
                  编辑用户信息
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: '用户名', key: 'username', type: 'text' },
                    { label: '头像链接', key: 'avatar', type: 'text', placeholder: 'https://example.com/avatar.jpg' },
                    { label: '身高 (cm)', key: 'height', type: 'number' },
                    { label: '目标体重 (kg)', key: 'targetWeight', type: 'number', step: '0.1' },
                    { label: '年龄', key: 'age', type: 'number' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-600 mb-2">{field.label}</label>
                      <input
                        type={field.type}
                        step={field.step}
                        value={(editForm as any)[field.key]}
                        placeholder={field.placeholder}
                        onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">性别</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="male">男</option>
                      <option value="female">女</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存修改
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: '身高', value: `${selectedUser.settings?.height || '--'} cm`, icon: Activity },
                  { label: '目标体重', value: `${selectedUser.settings?.targetWeight || '--'} kg`, icon: Scale },
                  { label: '性别', value: selectedUser.settings?.gender === 'male' ? '男' : '女', icon: User },
                  { label: '年龄', value: `${selectedUser.settings?.age || '--'} 岁`, icon: Calendar },
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{item.label}</p>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 体重记录 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                体重记录
                <span className="text-sm font-normal text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {selectedUser.weightEntries?.length || 0}
                </span>
              </h3>
            </div>

            {selectedUser.weightEntries?.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">该用户暂无体重记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['日期', '体重', 'BMI', '备注'].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.weightEntries?.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-sm text-slate-700 font-medium">
                          {new Date(entry.date).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="py-3.5 px-4 text-sm font-bold text-slate-800">{entry.weight.toFixed(1)} kg</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600">
                            {calculateBMI(entry.weight, selectedUser.settings?.height || 170)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-slate-500">{entry.note || '-'}</td>
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

  // ========== 主面板 ==========
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">管理后台</h1>
                <p className="text-xs text-slate-400">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* 标签切换 */}
              <div className="hidden sm:flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'users'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  用户管理
                </button>
                <button
                  onClick={() => { setActiveTab('feedback'); fetchFeedback() }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'feedback'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  反馈管理
                  {feedbackList.filter(f => f.status === 'pending').length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">
                      {feedbackList.filter(f => f.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab('backup'); fetchBackups() }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'backup'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  备份管理
                </button>
              </div>

              {/* 移动端标签 */}
              <div className="sm:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => {
                    setActiveTab(e.target.value as 'users' | 'feedback')
                    if (e.target.value === 'feedback') fetchFeedback()
                    if (e.target.value === 'backup') fetchBackups()
                  }}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="users">用户管理</option>
                  <option value="feedback">反馈管理</option>
                  <option value="backup">备份管理</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm text-slate-600 font-medium">admin</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2.5 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors group"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-600 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="总用户数" value={users.length} color="emerald" delay={0} />
              <StatCard icon={Scale} label="总记录数" value={totalRecords} color="blue" delay={50} />
              <StatCard icon={TrendingUp} label="今日新增" value={todayUsers} color="purple" delay={100} />
              <StatCard icon={Award} label="平均记录" value={users.length ? (totalRecords / users.length).toFixed(1) : '0'} color="amber" delay={150} />
            </div>

            {/* 搜索 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索用户名..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* 用户列表表格 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">用户列表</h2>
                <span className="text-sm text-slate-500">
                  共 <span className="font-semibold text-slate-700">{filteredUsers.length}</span> 位用户
                </span>
              </div>

              {loading ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-8 h-8 bg-slate-100 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-32" />
                        <div className="h-3 bg-slate-100 rounded w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">没有找到匹配的用户</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">用户</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">性别</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">身高</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">年龄</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">目标体重</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">记录数</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">使用时长</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">注册时间</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">最后登录</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-slate-500 font-mono">#{String(user.id).slice(-4)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <AvatarDisplay avatarUrl={user.settings?.avatar} size="w-8 h-8" />
                              <span className="text-sm font-medium text-slate-800">{user.username || '未命名'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {user.settings?.gender === 'male' ? '男' : user.settings?.gender === 'female' ? '女' : '其他'}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {user.settings?.height ? `${user.settings.height}cm` : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {user.settings?.age ? `${user.settings.age}岁` : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {user.settings?.targetWeight ? `${user.settings.targetWeight}kg` : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600">
                              {user.weightEntriesCount ?? user._count?.weightEntries ?? 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {formatUsageTime(user.totalUsageTime || 0)}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN') : '未登录'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="编辑"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => fetchUserDetail(user.id)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="查看详情"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleResetPassword(user.id, user.username || '未命名用户')}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="重置密码"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <EditUserModal
              user={editingUser}
              isOpen={editModalOpen}
              onClose={() => { setEditModalOpen(false); setEditingUser(null) }}
              onSave={handleSaveEditModal}
            />
          </div>
        )}
        {activeTab === 'feedback' && (
          <div className="space-y-8">
            {/* 反馈统计 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={MessageSquare} label="总反馈" value={feedbackList.length} color="emerald" delay={0} />
              <StatCard icon={Clock} label="待处理" value={feedbackList.filter(f => f.status === 'pending').length} color="amber" delay={50} />
              <StatCard icon={AlertCircle} label="处理中" value={feedbackList.filter(f => f.status === 'processing').length} color="blue" delay={100} />
              <StatCard icon={CheckCircle} label="已解决" value={feedbackList.filter(f => f.status === 'resolved').length} color="purple" delay={150} />
            </div>

            {/* 过滤器 */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'pending', label: '待处理' },
                { value: 'processing', label: '处理中' },
                { value: 'resolved', label: '已解决' },
                { value: 'rejected', label: '已拒绝' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFeedbackFilter(f.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    feedbackFilter === f.value
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 反馈列表 */}
            <div className="space-y-3">
              {feedbackLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                      <div className="h-4 bg-slate-100 rounded w-20 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-full mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : filteredFeedback.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">暂无反馈数据</p>
                </div>
              ) : (
                filteredFeedback.map((feedback) => (
                  <FeedbackCard
                    key={feedback.id}
                    feedback={feedback}
                    onStatusChange={handleUpdateFeedbackStatus}
                  />
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'backup' && (
          <div className="space-y-8">
            {/* 备份状态概览 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={HardDrive} label="备份总数" value={backupStatus?.totalBackups || 0} color="emerald" delay={0} />
              <StatCard icon={FolderOpen} label="备份总大小" value={formatFileSize(backupStatus?.totalSizeBytes || 0)} color="blue" delay={50} />
              <StatCard icon={Clock} label="最近备份" value={backupStatus?.lastBackupAt ? new Date(backupStatus.lastBackupAt).toLocaleDateString('zh-CN') : '无'} color="purple" delay={100} />
              <StatCard icon={Database} label="最早备份" value={backupStatus?.oldestBackupAt ? new Date(backupStatus.oldestBackupAt).toLocaleDateString('zh-CN') : '无'} color="amber" delay={150} />
            </div>

            {/* 备份列表 */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-500" />
                    备份列表
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">每2天自动执行，保留30天 + 月度归档</p>
                </div>
                <button
                  onClick={fetchBackups}
                  className="p-2.5 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-colors group"
                  title="刷新"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                </button>
              </div>

              <div className="overflow-x-auto">
                {backupLoading ? (
                  <div className="p-8 space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-100 rounded w-32" />
                          <div className="h-3 bg-slate-100 rounded w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">暂无备份数据</p>
                    <p className="text-sm text-slate-400 mt-1">备份将在定时任务执行后生成</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">日期</th>
                        <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">类型</th>
                        <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">大小</th>
                        <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">文件数</th>
                        <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">备份文件</th>
                        <th className="text-right py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((backup) => (
                        <tr key={backup.date} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{backup.date}</p>
                                <p className="text-xs text-slate-400">{new Date(backup.timestamp).toLocaleString('zh-CN')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              backup.type === 'sqlite'
                                ? 'bg-blue-50 text-blue-600'
                                : backup.type === 'cloudbase'
                                ? 'bg-purple-50 text-purple-600'
                                : 'bg-slate-50 text-slate-600'
                            }`}>
                              {backup.type === 'sqlite' ? 'SQLite' : backup.type === 'cloudbase' ? 'CloudBase' : backup.type}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 font-medium">{formatFileSize(backup.size)}</td>
                          <td className="py-4 px-6 text-sm text-slate-600">{backup.fileCount} 个</td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5">
                              {backup.files?.slice(0, 3).map((f: string) => (
                                <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-xs text-slate-500">
                                  {f.endsWith('.json') ? <FileJson className="w-3 h-3" /> : f.endsWith('.sql') ? <FileCode className="w-3 h-3" /> : <FolderOpen className="w-3 h-3" />}
                                  {f}
                                </span>
                              ))}
                              {backup.files?.length > 3 && (
                                <span className="text-xs text-slate-400 px-1">+{backup.files.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              {/* 下载按钮组 */}
                              <div className="relative group">
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                  <Download className="w-4 h-4" />
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                  {backup.files?.map((f: string) => (
                                    <a
                                      key={f}
                                      href={`/api/admin/backups/download?adminId=${adminId}&date=${backup.date}&file=${encodeURIComponent(f)}`}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      {f}
                                    </a>
                                  ))}
                                </div>
                              </div>
                              {/* 还原按钮 */}
                              <button
                                onClick={() => handleRestore(backup.date)}
                                disabled={restoreLoading === backup.date || backup.type === 'cloudbase'}
                                className={`p-2 rounded-xl transition-all ${
                                  backup.type === 'cloudbase'
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                }`}
                                title={backup.type === 'cloudbase' ? 'CloudBase 请使用 CLI 还原' : '一键还原数据库'}
                              >
                                {restoreLoading === backup.date ? (
                                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
