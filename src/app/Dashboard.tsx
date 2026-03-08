'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { 
  Trash2, Plus, Settings, TrendingDown, TrendingUp, Minus, Activity, Target, Scale, LogOut, 
  Bell, UserPlus, Users, X, Check, MessageSquare, Lock, ChevronRight, Dumbbell, Calendar, Camera,
  Share2, Play, Square
} from 'lucide-react'
import { calculateBMI, getBMICategory, getBMIColors, formatShortDate } from '../lib/utils'

interface DashboardProps {
  user: User
  onLogout: () => void
}

interface User {
  id: string | number
  username: string
  role?: string
  token?: string
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

interface Message {
  id: number
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  fromUser?: { username: string }
  relatedData?: string
}

interface Friend {
  id: number
  status: string
  fromUser: { id: number; username: string }
  toUser: { id: number; username: string }
  createdAt: string
}

interface FitnessChannel {
  id: number
  name: string
  description?: string
  status: string
  startDate: string
  endDate: string
  weeklyCheckInCount?: number
  checkInMinutes?: number
  createdAt: string
  ownerId?: number
  owner?: { id: number; username: string }
  members?: { userId: number; user: { id: number; username: string } }[]
  _count?: { members: number }
}

interface WeeklyStats {
  myWeeklyCount: number
  weeklyRequired: number
  checkInMinutes: number
  remaining: number
  allMembers: {
    userId: number
    username: string
    completed: number
    remaining: number
  }[]
}

interface CheckIn {
  id: number
  checkDate: string
  duration?: number
  note?: string
  imageUrl?: string
  createdAt: string
  userId: number
  user?: { id: number; username: string }
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [settings, setSettings] = useState({ height: 170, targetWeight: 65 })
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [showSettings, setShowSettings] = useState(false)
  const [height, setHeight] = useState('170')
  const [targetWeight, setTargetWeight] = useState('65')
  const [gender, setGender] = useState('')
  const [avatar, setAvatar] = useState('')
  
  // 天气和鼓励语状态
  const [weather, setWeather] = useState({ temperature: 20, humidity: 50, weather: '晴', icon: '☀️', unit: '°C' })
  const [motivationalQuote, setMotivationalQuote] = useState('')
  
  // 鼓励语列表
  const quotes = [
    '运动是生命的源泉，坚持就是胜利！💪',
    '每一滴汗水，都是健康的投资！🏃',
    '今天的努力，是明天健康的基石！⭐',
    '动起来，让生命更精彩！🌟',
    '坚持运动，遇见更好的自己！🎯',
    '健康不是一切，但没有健康就没有一切！❤️',
    '运动使人快乐，快乐使人健康！😊',
    '今天的汗水，是明天的笑容！💦',
    '不要等待机会，而要创造机会去运动！🔥',
    '健康的身体是灵魂的客厅！🏠',
  ]
  
  // 消息和好友状态
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMessages, setShowMessages] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [showFriends, setShowFriends] = useState(false)
  const [friendUsername, setFriendUsername] = useState('')
  
  // 修改密码状态
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // 健身频道状态
  const [channels, setChannels] = useState<FitnessChannel[]>([])
  const [showChannels, setShowChannels] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showChannelDetail, setShowChannelDetail] = useState<FitnessChannel | null>(null)
  const [channelName, setChannelName] = useState('')
  const [channelDesc, setChannelDesc] = useState('')
  const [channelStartDate, setChannelStartDate] = useState(new Date().toISOString().split('T')[0])
  const [channelEndDate, setChannelEndDate] = useState('')
  const [channelWeeklyCount, setChannelWeeklyCount] = useState(3)
  const [channelCheckInMinutes, setChannelCheckInMinutes] = useState(30)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [channelInviteName, setChannelInviteName] = useState('')
  const [channelCheckIns, setChannelCheckIns] = useState<CheckIn[]>([])
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0])
  const [checkInDuration, setCheckInDuration] = useState(30)
  const [checkInNote, setCheckInNote] = useState('')
  const [checkInImage, setCheckInImage] = useState('')

  // 加载数据
  useEffect(() => {
    fetchEntries()
    fetchSettings()
    fetchMessages()
    fetchFriends()
    fetchPendingRequests()
    fetchChannels()
    fetchWeather()
    
    // 随机选择一句鼓励语
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)])
    
    // 定时刷新消息和好友请求
    const interval = setInterval(() => {
      fetchMessages()
      fetchPendingRequests()
      fetchChannels()
    }, 30000)
    
    return () => clearInterval(interval)
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

  // ========== 健身频道相关 ==========
  const fetchChannels = async () => {
    if (!user.token) return
    try {
      const res = await fetch('/api/channels', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setChannels(data.channels || [])
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const createChannel = async () => {
    if (!user.token || !channelName.trim() || !channelStartDate || !channelEndDate) {
      alert('请填写完整信息')
      return
    }
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name: channelName,
          description: channelDesc,
          startDate: channelStartDate,
          endDate: channelEndDate,
          weeklyCheckInCount: channelWeeklyCount,
          checkInMinutes: channelCheckInMinutes,
        }),
      })
      if (res.ok) {
        setChannelName('')
        setChannelDesc('')
        setChannelWeeklyCount(3)
        setChannelCheckInMinutes(30)
        setShowCreateChannel(false)
        fetchChannels()
        alert('频道创建成功')
      } else {
        const data = await res.json()
        if (res.status === 409 && data.activeChannel) {
          alert(data.message || data.error)
        } else {
          alert(data.error || '创建失败')
        }
      }
    } catch (error) {
      console.error('Error creating channel:', error)
      alert('创建失败')
    }
  }

  const deleteChannel = async (channelId: number) => {
    if (!user.token || !confirm('确定要删除这个频道吗？')) return
    try {
      const res = await fetch(`/api/channels?id=${channelId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        fetchChannels()
        setShowChannelDetail(null)
      }
    } catch (error) {
      console.error('Error deleting channel:', error)
    }
  }

  const inviteMember = async (channelId: number) => {
    if (!user.token || !channelInviteName.trim()) return
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ username: channelInviteName }),
      })
      const data = await res.json()
      if (res.ok) {
        setChannelInviteName('')
        alert('邀请成功')
        if (showChannelDetail) {
          fetchChannelDetail(channelId)
        }
      } else {
        if (res.status === 409 && data.activeChannel) {
          alert(data.message || data.error)
        } else {
          alert(data.error || '邀请失败')
        }
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      alert('邀请失败')
    }
  }

  const removeMember = async (channelId: number, memberId: number) => {
    if (!user.token || !confirm('确定要移除该成员吗？')) return
    try {
      const res = await fetch(`/api/channels/${channelId}?memberId=${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        fetchChannelDetail(channelId)
      }
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  // 启动或结束频道
  const controlChannel = async (channelId: number, action: 'start' | 'end') => {
    if (!user.token) return
    const actionText = action === 'start' ? '启动' : '结束'
    if (!confirm(`确定要${actionText}该频道吗？`)) return
    
    try {
      const res = await fetch(`/api/channels/${channelId}/control`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        fetchChannelDetail(channelId)
        fetchChannels()
      } else {
        const data = await res.json()
        alert(data.error || '操作失败')
      }
    } catch (error) {
      console.error('Error controlling channel:', error)
      alert('操作失败')
    }
  }

  // 获取每周打卡统计
  const fetchWeeklyStats = async (channelId: number) => {
    if (!user.token) return
    try {
      const res = await fetch(`/api/channels/${channelId}/stats`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWeeklyStats(data)
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error)
    }
  }

  const fetchChannelDetail = async (channelId: number) => {
    if (!user.token) return
    try {
      const [channelRes, checkInsRes] = await Promise.all([
        fetch(`/api/channels/${channelId}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }),
        fetch(`/api/channels/${channelId}/checkin`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
      ])
      
      if (channelRes.ok && checkInsRes.ok) {
        const channelData = await channelRes.json()
        const checkInsData = await checkInsRes.json()
        setShowChannelDetail(channelData.channel)
        setChannelCheckIns(checkInsData.checkIns || [])
        fetchWeeklyStats(channelId)
      }
    } catch (error) {
      console.error('Error fetching channel detail:', error)
    }
  }

  const submitCheckIn = async () => {
    if (!user.token || !showChannelDetail) return
    try {
      const res = await fetch(`/api/channels/${showChannelDetail.id}/checkin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          checkDate: checkInDate,
          duration: checkInDuration,
          note: checkInNote,
          imageUrl: checkInImage,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowCheckInModal(false)
        setCheckInNote('')
        setCheckInImage('')
        setCheckInDuration(30)
        fetchChannelDetail(showChannelDetail.id)
      } else {
        if (data.message) {
          alert(data.message)
        } else {
          alert(data.error || '打卡失败')
        }
      }
    } catch (error) {
      console.error('Error submitting check-in:', error)
      alert('打卡失败')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCheckInImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const fetchSettings = async () => {
    if (!user.token) return
    try {
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setHeight(String(data.height))
        setTargetWeight(String(data.targetWeight))
        setGender(data.user?.gender || '')
        setAvatar(data.user?.avatar || '')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  // 获取天气
  const fetchWeather = async () => {
    try {
      const res = await fetch('/api/weather')
      if (res.ok) {
        const data = await res.json()
        setWeather(data)
      }
    } catch (error) {
      console.error('Error fetching weather:', error)
    }
  }

  // ========== 消息相关 ==========
  const fetchMessages = async () => {
    if (!user.token) return
    try {
      const res = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setUnreadCount(data.messages?.filter((m: Message) => !m.isRead).length || 0)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const markMessageAsRead = async (messageId: number) => {
    if (!user.token) return
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ messageId }),
      })
      fetchMessages()
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user.token) return
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ markAll: true }),
      })
      fetchMessages()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteMessage = async (messageId: number) => {
    if (!user.token) return
    try {
      await fetch(`/api/messages?id=${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      fetchMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  // ========== 好友相关 ==========
  const fetchFriends = async () => {
    if (!user.token) return
    try {
      const res = await fetch('/api/friends', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends?.filter((f: Friend) => f.status === 'ACCEPTED') || [])
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }

  const fetchPendingRequests = async () => {
    if (!user.token) return
    try {
      const res = await fetch('/api/friends?type=pending', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPendingRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    }
  }

  const sendFriendRequest = async () => {
    if (!user.token || !friendUsername.trim()) return
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ username: friendUsername }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('好友请求已发送')
        setFriendUsername('')
      } else {
        alert(data.error || '发送失败')
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      alert('发送失败')
    }
  }

  const handleFriendRequest = async (friendId: number, action: 'accept' | 'reject') => {
    if (!user.token) return
    try {
      const res = await fetch('/api/friends', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ friendId, action }),
      })
      if (res.ok) {
        fetchFriends()
        fetchPendingRequests()
        fetchMessages()
      }
    } catch (error) {
      console.error('Error handling friend request:', error)
    }
  }

  // ========== 修改密码 ==========
  const handleChangePassword = async () => {
    if (!user.token) return
    if (newPassword !== confirmPassword) {
      alert('两次输入的新密码不一致')
      return
    }
    if (newPassword.length < 6) {
      alert('新密码长度至少为 6 个字符')
      return
    }
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('密码修改成功')
        setShowChangePassword(false)
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        alert(data.error || '修改失败')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('修改失败')
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
      // 更新身高体重设置
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height: heightNum, targetWeight: targetNum }),
      })

      // 更新性别
      if (gender) {
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ gender }),
        })
      }

      // 更新头像
      if (avatar !== undefined) {
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ avatar }),
        })
      }

      if (res.ok) {
        await fetchSettings()
        setShowSettings(false)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
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

  // 获取消息图标颜色
  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'SYSTEM_LOGIN':
      case 'SYSTEM_PASSWORD':
        return 'bg-blue-100 text-blue-600'
      case 'FRIEND_REQUEST':
        return 'bg-emerald-100 text-emerald-600'
      case 'FRIEND_ACCEPT':
        return 'bg-green-100 text-green-600'
      case 'FRIEND_REJECT':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 左侧：欢迎语 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800">欢迎「{user.username}」进入燃脂俱乐部</h1>
                {/* 当前健身频道显示 */}
                {(() => {
                  const activeChannel = channels.find(c => 
                    (c.status === 'PENDING' || c.status === 'ACTIVE') && 
                    new Date(c.endDate) >= new Date()
                  )
                  if (activeChannel) {
                    return (
                      <button
                        onClick={() => fetchChannelDetail(activeChannel.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                      >
                        <Dumbbell className="w-3 h-3" />
                        当前频道：{activeChannel.name} {activeChannel.status === 'PENDING' ? '(未开始)' : '(进行中)'}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )
                  }
                  return (
                    <button
                      onClick={() => setShowChannels(true)}
                      className="text-xs text-slate-400 hover:text-emerald-600 flex items-center gap-1 mt-0.5"
                    >
                      <Dumbbell className="w-3 h-3" />
                      暂无进行中的健身频道，点击加入
                    </button>
                  )
                })()}
              </div>
            </div>
            
            {/* 中间：鼓励语 */}
            <div className="hidden md:flex flex-1 mx-6 justify-center">
              <p className="text-sm text-emerald-600 font-medium bg-emerald-50 px-4 py-2 rounded-full">
                {motivationalQuote}
              </p>
            </div>
            
            {/* 右侧：天气、分享、功能按钮、头像、退出 */}
            <div className="flex items-center gap-2">
              {/* 天气 */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl mr-1">
                <span className="text-lg">{weather.icon}</span>
                <div className="hidden sm:block">
                  <p className="text-xs text-slate-600">{weather.weather}</p>
                  <p className="text-sm font-semibold text-slate-800">{weather.temperature}{weather.unit}</p>
                </div>
              </div>
              
              {/* 分享按钮（预留位置） */}
              <button
                className="p-2 bg-slate-100 hover:bg-purple-100 rounded-xl transition-colors"
                title="分享"
                onClick={() => alert('分享功能即将上线！')}
              >
                <Share2 className="w-5 h-5 text-slate-600 hover:text-purple-600" />
              </button>
              
              {/* 消息按钮 */}
              <button
                onClick={() => setShowMessages(!showMessages)}
                className="relative p-2 bg-slate-100 hover:bg-emerald-100 rounded-xl transition-colors"
                title="消息"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* 好友按钮 */}
              <button
                onClick={() => setShowFriends(!showFriends)}
                className="relative p-2 bg-slate-100 hover:bg-emerald-100 rounded-xl transition-colors"
                title="好友"
              >
                <Users className="w-5 h-5 text-slate-600" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              
              {/* 健身频道按钮 */}
              <button
                onClick={() => setShowChannels(!showChannels)}
                className="relative p-2 bg-slate-100 hover:bg-emerald-100 rounded-xl transition-colors"
                title="健身拼团"
              >
                <Dumbbell className="w-5 h-5 text-slate-600" />
                {channels.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                    {channels.length}
                  </span>
                )}
              </button>
              
              {/* 用户头像（替代设置按钮） */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-emerald-200 hover:border-emerald-400 transition-colors"
                title="设置"
              >
                {avatar ? (
                  <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{user.username[0].toUpperCase()}</span>
                  </div>
                )}
              </button>
              
              {/* 退出按钮 */}
              <button
                onClick={onLogout}
                className="p-2 bg-slate-100 hover:bg-red-100 rounded-xl transition-colors group"
                title="退出登录"
              >
                <LogOut className="w-5 h-5 text-slate-600 group-hover:text-red-600" />
              </button>
            </div>
          </div>
          
          {/* 移动端鼓励语和当前频道 */}
          <div className="md:hidden mt-2 space-y-2">
            <p className="text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full inline-block w-full text-center">
              {motivationalQuote}
            </p>
            {(() => {
              const activeChannel = channels.find(c => 
                (c.status === 'PENDING' || c.status === 'ACTIVE') && 
                new Date(c.endDate) >= new Date()
              )
              if (activeChannel) {
                return (
                  <button
                    onClick={() => fetchChannelDetail(activeChannel.id)}
                    className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 w-full justify-center"
                  >
                    <Dumbbell className="w-3 h-3" />
                    当前频道：{activeChannel.name}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )
              }
              return null
            })()}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 消息弹窗 */}
        {showMessages && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-500" />
                消息中心
              </h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    全部已读
                  </button>
                )}
                <button
                  onClick={() => setShowMessages(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            
            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>暂无消息</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border ${msg.isRead ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50/50 border-emerald-100'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getMessageTypeColor(msg.type)}`}>
                        {msg.type.includes('FRIEND') ? <UserPlus className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-slate-800">{msg.title}</h3>
                          <span className="text-xs text-slate-400">
                            {new Date(msg.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{msg.content}</p>
                        
                        {/* 好友请求操作按钮 */}
                        {msg.type === 'FRIEND_REQUEST' && !msg.isRead && (
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => {
                                const data = JSON.parse(msg.relatedData || '{}')
                                handleFriendRequest(data.friendId, 'accept')
                                markMessageAsRead(msg.id)
                              }}
                              className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                              接受
                            </button>
                            <button
                              onClick={() => {
                                const data = JSON.parse(msg.relatedData || '{}')
                                handleFriendRequest(data.friendId, 'reject')
                                markMessageAsRead(msg.id)
                              }}
                              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors"
                            >
                              拒绝
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="p-1 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {!msg.isRead && msg.type !== 'FRIEND_REQUEST' && (
                      <button
                        onClick={() => markMessageAsRead(msg.id)}
                        className="mt-2 text-xs text-emerald-600 hover:text-emerald-700"
                      >
                        标记为已读
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 好友弹窗 */}
        {showFriends && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                好友管理
              </h2>
              <button
                onClick={() => setShowFriends(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* 添加好友 */}
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3">添加好友</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  placeholder="输入用户名"
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  onClick={sendFriendRequest}
                  disabled={!friendUsername.trim()}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  添加
                </button>
              </div>
            </div>
            
            {/* 待处理请求 */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-slate-800 mb-3">好友请求 ({pendingRequests.length})</h3>
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-slate-800">{req.fromUser.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFriendRequest(req.id, 'accept')}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFriendRequest(req.id, 'reject')}
                          className="p-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 好友列表 */}
            <div>
              <h3 className="font-medium text-slate-800 mb-3">我的好友 ({friends.length})</h3>
              {friends.length === 0 ? (
                <p className="text-slate-500 text-center py-4">暂无好友，快去添加吧！</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {friends.map((friend) => {
                    const isFromMe = friend.fromUser.username === user.username
                    const friendName = isFromMe ? friend.toUser.username : friend.fromUser.username
                    return (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-slate-600" />
                          </div>
                          <span className="font-medium text-slate-800">{friendName}</span>
                        </div>
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">好友</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 修改密码弹窗 */}
        {showChangePassword && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" />
                修改密码
              </h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">旧密码</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
              >
                确认修改
              </button>
            </div>
          </div>
        )}

        {/* 设置面板 */}
        {showSettings && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-500" />
                个人设置
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* 头像上传 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">头像</label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
                  {avatar ? (
                    <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{user.username[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <div className="px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer text-center transition-colors">
                    点击上传头像
                  </div>
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">身高 (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">目标体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            
            {/* 性别选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">性别</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 py-3 rounded-xl border transition-all ${
                    gender === 'male' 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    👨 男
                  </span>
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 py-3 rounded-xl border transition-all ${
                    gender === 'female' 
                      ? 'bg-pink-500 text-white border-pink-500' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-pink-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    👩 女
                  </span>
                </button>
                <button
                  onClick={() => setGender('other')}
                  className={`flex-1 py-3 rounded-xl border transition-all ${
                    gender === 'other' 
                      ? 'bg-purple-500 text-white border-purple-500' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    🤔 保密
                  </span>
                </button>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-medium text-slate-800 mb-3">账号安全</h3>
              <button
                onClick={() => {
                  setShowSettings(false)
                  setShowChangePassword(true)
                }}
                className="flex items-center justify-between w-full p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-slate-600" />
                  <span className="text-slate-800">修改密码</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <button
              onClick={handleUpdateSettings}
              className="mt-6 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
            >
              保存设置
            </button>
          </div>
        )}

        {/* 健身频道列表 */}
        {showChannels && !showChannelDetail && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-500" />
                健身拼团频道
              </h2>
              <div className="flex items-center gap-2">
                {/* 检查是否有进行中的频道 */}
                {(() => {
                  const activeChannel = channels.find(c => 
                    (c.status === 'PENDING' || c.status === 'ACTIVE') && 
                    new Date(c.endDate) >= new Date()
                  )
                  return (
                    <button
                      onClick={() => {
                        if (activeChannel) {
                          alert(`您当前已有进行中的健身频道「${activeChannel.name}」，该频道将于 ${new Date(activeChannel.endDate).toLocaleDateString('zh-CN')} 结束。请在当前频道结束后再创建新频道。`)
                        } else {
                          setShowCreateChannel(true)
                        }
                      }}
                      className={`px-4 py-2 text-white text-sm rounded-xl transition-colors flex items-center gap-2 ${
                        activeChannel 
                          ? 'bg-slate-400 cursor-not-allowed' 
                          : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                      title={activeChannel ? '您已有进行中的健身频道，无法创建新频道' : '创建新频道'}
                    >
                      <Plus className="w-4 h-4" />
                      {activeChannel ? '已有进行中的频道' : '创建频道'}
                    </button>
                  )
                })()}
                <button
                  onClick={() => setShowChannels(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            
            {/* 提示信息 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <span>ℹ️</span>
                <span>提示：每位用户同时只能参加一个健身频道。您需要完成或退出当前频道后，才能创建或加入新频道。</span>
              </p>
            </div>
            
            {channels.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>暂无健身频道，点击"创建频道"开始拼团健身吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => fetchChannelDetail(channel.id)}
                    className="p-4 bg-slate-50 rounded-xl hover:bg-emerald-50 cursor-pointer transition-colors border border-slate-200 hover:border-emerald-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-800">{channel.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        channel.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        channel.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {channel.status === 'ACTIVE' ? '进行中' : 
                         channel.status === 'COMPLETED' ? '已结束' : '未开始'}
                      </span>
                    </div>
                    {channel.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{channel.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(channel.startDate).toLocaleDateString('zh-CN')} - {new Date(channel.endDate).toLocaleDateString('zh-CN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {(channel._count?.members || 0) + (channel.ownerId === user.id ? 0 : 1)} 人
                        </span>
                      </div>
                      <span className="text-emerald-600 font-medium">查看详情 →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 创建频道弹窗 */}
        {showCreateChannel && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                创建健身频道
              </h2>
              <button
                onClick={() => setShowCreateChannel(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              {/* 提示信息 */}
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>提示：每位用户同时只能参加一个健身频道。创建新频道后，您将无法加入其他频道，直到当前频道结束。</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">频道名称</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="例如：30天减脂挑战"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">描述（可选）</label>
                <textarea
                  value={channelDesc}
                  onChange={(e) => setChannelDesc(e.target.value)}
                  placeholder="描述一下这个健身计划的目标和规则..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">开始日期</label>
                  <input
                    type="date"
                    value={channelStartDate}
                    onChange={(e) => setChannelStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">结束日期</label>
                  <input
                    type="date"
                    value={channelEndDate}
                    onChange={(e) => setChannelEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              
              {/* 打卡规则设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">每周至少打卡（次）</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={channelWeeklyCount}
                    onChange={(e) => setChannelWeeklyCount(parseInt(e.target.value) || 3)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">每次至少（分钟）</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={channelCheckInMinutes}
                    onChange={(e) => setChannelCheckInMinutes(parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              
              <button
                onClick={createChannel}
                disabled={!channelName.trim() || !channelEndDate}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all disabled:opacity-50"
              >
                创建频道
              </button>
            </div>
          </div>
        )}

        {/* 频道详情 */}
        {showChannelDetail && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-emerald-500" />
                  {showChannelDetail.name}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(showChannelDetail.startDate).toLocaleDateString('zh-CN')} - {new Date(showChannelDetail.endDate).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(showChannelDetail.ownerId === user.id || showChannelDetail.owner?.id === user.id) && (
                  <button
                    onClick={() => deleteChannel(showChannelDetail.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 text-sm rounded-xl hover:bg-red-200 transition-colors"
                  >
                    删除频道
                  </button>
                )}
                <button
                  onClick={() => setShowChannelDetail(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            
            {showChannelDetail.description && (
              <p className="text-slate-600 mb-4 p-3 bg-slate-50 rounded-xl">{showChannelDetail.description}</p>
            )}
            
            {/* 频道规则和状态 */}
            <div className="mb-4 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-blue-700">
                    <Calendar className="w-4 h-4" />
                    每周打卡 {showChannelDetail.weeklyCheckInCount || 3} 次
                  </span>
                  <span className="flex items-center gap-1 text-blue-700">
                    <Activity className="w-4 h-4" />
                    每次 {showChannelDetail.checkInMinutes || 30} 分钟
                  </span>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  showChannelDetail.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                  showChannelDetail.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {showChannelDetail.status === 'ACTIVE' ? '🔥 进行中' : 
                   showChannelDetail.status === 'COMPLETED' ? '✅ 已结束' : '⏳ 未开始'}
                </span>
              </div>
            </div>
            
            {/* 创建者控制按钮 */}
            {(showChannelDetail.ownerId === user.id || showChannelDetail.owner?.id === user.id) && showChannelDetail.status !== 'COMPLETED' && (
              <div className="mb-6 flex gap-3">
                {showChannelDetail.status === 'PENDING' && (
                  <button
                    onClick={() => controlChannel(showChannelDetail.id, 'start')}
                    className="flex-1 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    启动活动
                  </button>
                )}
                {showChannelDetail.status === 'ACTIVE' && (
                  <button
                    onClick={() => controlChannel(showChannelDetail.id, 'end')}
                    className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Square className="w-5 h-5" />
                    提前结束
                  </button>
                )}
              </div>
            )}
            
            {/* 本周打卡统计 */}
            {weeklyStats && (
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  本周打卡进度
                </h3>
                <div className="space-y-3">
                  {/* 我的进度 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">我的进度</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (weeklyStats.myWeeklyCount / weeklyStats.weeklyRequired) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-emerald-600">
                        {weeklyStats.myWeeklyCount}/{weeklyStats.weeklyRequired}
                      </span>
                    </div>
                  </div>
                  
                  {/* 所有成员进度 */}
                  <div className="pt-3 border-t border-emerald-100">
                    <p className="text-xs text-slate-500 mb-2">成员进度</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {weeklyStats.allMembers.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between text-xs p-2 bg-white rounded-lg">
                          <span className="text-slate-700 truncate">{member.username}</span>
                          <span className={`font-medium ${member.remaining === 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {member.completed}/{weeklyStats.weeklyRequired}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 成员列表 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-800">成员 ({(showChannelDetail.members?.length || 0) + 1})</h3>
                {(showChannelDetail.ownerId === user.id || showChannelDetail.owner?.id === user.id) && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={channelInviteName}
                      onChange={(e) => setChannelInviteName(e.target.value)}
                      placeholder="输入用户名邀请"
                      className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      onClick={() => inviteMember(showChannelDetail.id)}
                      disabled={!channelInviteName.trim()}
                      className="px-3 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      邀请
                    </button>
                  </div>
                )}
              </div>
              
              {/* 邀请提示 */}
              {(showChannelDetail.ownerId === user.id || showChannelDetail.owner?.id === user.id) && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs text-amber-700">
                    <span>⚠️</span>
                    <span>提示：被邀请的用户如果已有进行中的健身频道，将无法接受邀请。每位用户同时只能参加一个健身频道。</span>
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {/* 创建者 */}
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 rounded-lg">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">
                    {showChannelDetail.owner?.username || user.username} (创建者)
                  </span>
                </div>
                {/* 其他成员 */}
                {showChannelDetail.members?.map((member) => (
                  <div key={member.userId} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700">{member.user.username}</span>
                    {(showChannelDetail.ownerId === user.id || showChannelDetail.owner?.id === user.id) && (
                      <button
                        onClick={() => removeMember(showChannelDetail.id, member.userId)}
                        className="ml-1 text-red-500 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 打卡按钮 - 只有进行中的频道可以打卡 */}
            {showChannelDetail.status === 'ACTIVE' ? (
              <button
                onClick={() => setShowCheckInModal(true)}
                className="w-full mb-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                今日打卡
              </button>
            ) : showChannelDetail.status === 'PENDING' ? (
              <div className="w-full mb-6 py-3 bg-slate-100 text-slate-500 font-semibold rounded-xl text-center">
                ⏳ 活动尚未开始，暂时无法打卡
              </div>
            ) : (
              <div className="w-full mb-6 py-3 bg-slate-100 text-slate-500 font-semibold rounded-xl text-center">
                ✅ 活动已结束
              </div>
            )}

            {/* 打卡记录 */}
            <div>
              <h3 className="font-medium text-slate-800 mb-3">打卡记录 ({channelCheckIns.length})</h3>
              {channelCheckIns.length === 0 ? (
                <p className="text-slate-500 text-center py-8">暂无打卡记录，快来打卡吧！</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {channelCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 font-semibold text-sm">
                            {new Date(checkIn.checkDate).getDate()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-800">{checkIn.user?.username}</span>
                            <span className="text-xs text-slate-400">
                              {new Date(checkIn.checkDate).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                          {checkIn.note && (
                            <p className="text-sm text-slate-600 mt-1">{checkIn.note}</p>
                          )}
                          {checkIn.imageUrl && (
                            <img
                              src={checkIn.imageUrl}
                              alt="打卡照片"
                              className="mt-2 w-full max-w-xs h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 打卡弹窗 */}
        {showCheckInModal && showChannelDetail && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-500" />
                健身打卡
              </h2>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">打卡日期</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              
              {/* 运动时长 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  运动时长（分钟）
                  <span className="text-xs text-slate-400 ml-2">
                    本频道要求至少 {showChannelDetail.checkInMinutes || 30} 分钟
                  </span>
                </label>
                <input
                  type="number"
                  min={showChannelDetail.checkInMinutes || 30}
                  step={5}
                  value={checkInDuration}
                  onChange={(e) => setCheckInDuration(parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {checkInDuration < (showChannelDetail.checkInMinutes || 30) && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ 时长不足，至少需要 {showChannelDetail.checkInMinutes || 30} 分钟
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">备注（可选）</label>
                <textarea
                  value={checkInNote}
                  onChange={(e) => setCheckInNote(e.target.value)}
                  placeholder="今天的健身感受..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">上传照片（可选）</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer text-center">
                      {checkInImage ? '更换照片' : '点击上传照片'}
                    </div>
                  </label>
                </div>
                {checkInImage && (
                  <img
                    src={checkInImage}
                    alt="预览"
                    className="mt-2 w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>
              <button
                onClick={submitCheckIn}
                disabled={checkInDuration < (showChannelDetail.checkInMinutes || 30)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all disabled:opacity-50"
              >
                确认打卡
              </button>
            </div>
          </div>
        )}

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
