'use client'

import { useState, useEffect } from 'react'
import LoginPage from './LoginPage'
import Dashboard from './Dashboard'
import AdminDashboard from './AdminDashboard'

// 7天的毫秒数
const REMEMBER_ME_DURATION = 7 * 24 * 60 * 60 * 1000

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState('用户')
  const [userId, setUserId] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // 初始化 admin 用户
  useEffect(() => {
    fetch('/api/admin/init', { method: 'POST' }).catch(() => {})
  }, [])

  // 检查本地存储的登录状态
  useEffect(() => {
    const storedLoginState = localStorage.getItem('isLoggedIn')
    const storedUsername = localStorage.getItem('username')
    const storedUserId = localStorage.getItem('userId')
    const storedIsAdmin = localStorage.getItem('isAdmin')
    const storedExpireTime = localStorage.getItem('loginExpireTime')
    
    if (storedLoginState === 'true') {
      // 检查是否过期
      if (storedExpireTime) {
        const expireTime = parseInt(storedExpireTime)
        if (Date.now() > expireTime) {
          // 已过期，清除登录状态
          clearLoginState()
          setIsLoading(false)
          return
        }
      }
      
      setIsLoggedIn(true)
      if (storedUsername) {
        setUsername(storedUsername)
      }
      if (storedUserId) {
        setUserId(parseInt(storedUserId))
      }
      if (storedIsAdmin === 'true') {
        setIsAdmin(true)
      }
    }
    setIsLoading(false)
  }, [])

  const clearLoginState = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('loginExpireTime')
  }

  const handleLogin = (name?: string, id?: number, rememberMe?: boolean) => {
    setIsLoggedIn(true)
    localStorage.setItem('isLoggedIn', 'true')
    
    if (name) {
      setUsername(name)
      localStorage.setItem('username', name)
    }
    if (id) {
      setUserId(id)
      localStorage.setItem('userId', String(id))
    }
    
    // 设置过期时间
    if (rememberMe) {
      const expireTime = Date.now() + REMEMBER_ME_DURATION
      localStorage.setItem('loginExpireTime', String(expireTime))
    } else {
      // 不记住我，会话级登录（浏览器关闭即失效），但也设置一个较长的过期时间作为备份
      localStorage.removeItem('loginExpireTime')
    }
    
    // 检查是否是 admin
    if (name === 'admin') {
      setIsAdmin(true)
      localStorage.setItem('isAdmin', 'true')
    } else {
      setIsAdmin(false)
      localStorage.removeItem('isAdmin')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setIsAdmin(false)
    clearLoginState()
    setUserId(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Admin 用户显示管理界面
  if (isAdmin && userId) {
    return <AdminDashboard adminId={userId} onLogout={handleLogout} />
  }

  // 普通用户显示 Dashboard
  return <Dashboard onLogout={handleLogout} username={username} userId={userId} />
}
