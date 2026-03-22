'use client'

import { useState, useEffect } from 'react'
import { LogOut, Users, Trash2, Edit2, X, Save, Search, TrendingUp, Scale, User, ChevronLeft, Key } from 'lucide-react'

interface AdminDashboardProps {
  adminId: number
  onLogout: () => void
}

interface UserData {
  id: number
  username: string
  createdAt: string
  updatedAt: string
  settings: {
    id: number
    height: number
    targetWeight: number
    gender: string
    age: number
    avatar: string
  } | null
  _count: {
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

// 默认头像
const DefaultAvatar = () => (
  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
    <User className="w-1/2 h-1/2 text-white" />
  </div>
)

export default function AdminDashboard({ adminId, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    username: '',
    height: '',
    targetWeight: '',
    gender: 'male',
    age: '',
    avatar: '',
  })

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

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除这个用户吗？此操作不可恢复！')) return

    try {
      const res = await fetch(`/api/admin/user?adminId=${adminId}&userId=${userId}`, {
        method: 'DELETE',
      })

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

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 计算 BMI
  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100
    return Math.round(weight / (heightInMeters * heightInMeters))
  }

  const getAvatarDisplay = (avatarUrl?: string) => {
    if (avatarUrl) {
      return (
        <img 
          src={avatarUrl} 
          alt="头像" 
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    }
    return <DefaultAvatar />
  }

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
        {/* 顶部导航 */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">用户详情</h1>
                  <p className="text-xs text-slate-500">User Details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
          {/* 用户信息卡片 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-200">
                  {getAvatarDisplay(selectedUser.settings?.avatar)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedUser.username}</h2>
                  <p className="text-sm text-slate-500">ID: {selectedUser.id}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    注册时间: {new Date(selectedUser.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                )}
                <button
                  onClick={() => handleResetPassword(selectedUser.id, selectedUser.username)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  重置密码
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除用户
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="font-semibold text-slate-800 mb-4">编辑用户信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">用户名</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">头像链接</label>
                    <input
                      type="text"
                      value={editForm.avatar}
                      onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">身高 (cm)</label>
                    <input
                      type="number"
                      value={editForm.height}
                      onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">目标体重 (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.targetWeight}
                      onChange={(e) => setEditForm({ ...editForm, targetWeight: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">性别</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                      <option value="male">男</option>
                      <option value="female">女</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">年龄</label>
                    <input
                      type="number"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存修改
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">身高</p>
                  <p className="text-xl font-bold text-slate-800">{selectedUser.settings?.height || '--'} cm</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">目标体重</p>
                  <p className="text-xl font-bold text-slate-800">{selectedUser.settings?.targetWeight || '--'} kg</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">性别</p>
                  <p className="text-xl font-bold text-slate-800">{selectedUser.settings?.gender === 'male' ? '男' : '女'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">年龄</p>
                  <p className="text-xl font-bold text-slate-800">{selectedUser.settings?.age || '--'} 岁</p>
                </div>
              </div>
            )}
          </div>

          {/* 体重记录 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              体重记录
              <span className="text-sm font-normal text-slate-500">({selectedUser.weightEntries?.length || 0} 条)</span>
            </h3>

            {selectedUser.weightEntries?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Scale className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>该用户暂无体重记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">日期</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">体重</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">BMI</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.weightEntries?.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-800">
                          {new Date(entry.date).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-800">{entry.weight.toFixed(1)} kg</td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {calculateBMI(entry.weight, selectedUser.settings?.height || 170)}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">{entry.note || '-'}</td>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">管理员后台</h1>
                <p className="text-xs text-slate-500">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">管理员: admin</span>
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

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">总用户数</p>
                <p className="text-2xl font-bold text-slate-800">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">总记录数</p>
                <p className="text-2xl font-bold text-slate-800">
                  {users.reduce((sum, u) => sum + u._count.weightEntries, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">今日新增用户</p>
                <p className="text-2xl font-bold text-slate-800">
                  {users.filter(u => {
                    const today = new Date().toDateString()
                    const userDate = new Date(u.createdAt).toDateString()
                    return today === userDate
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100/50 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索用户名..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">用户列表</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>暂无用户数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-6 text-sm font-medium text-slate-500">用户</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-slate-500">基本信息</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-slate-500">记录数</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-slate-500">注册时间</th>
                    <th className="text-right py-3 px-6 text-sm font-medium text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                            {getAvatarDisplay(user.settings?.avatar)}
                          </div>
                          <span className="font-medium text-slate-800">{user.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {user.settings ? (
                          <div className="space-y-1">
                            <p>{user.settings.height}cm · {user.settings.gender === 'male' ? '男' : '女'} · {user.settings.age}岁</p>
                            <p className="text-slate-400">目标: {user.settings.targetWeight}kg</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">未设置</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {user._count.weightEntries} 条记录
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => fetchUserDetail(user.id)}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="查看详情"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id, user.username)}
                            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                            title="重置密码为 111111"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="删除用户"
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
      </main>
    </div>
  )
}
