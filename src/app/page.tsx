'use client'

import { useState, useEffect } from 'react'
import LoginPage from './LoginPage'
import Dashboard from './Dashboard'
import AdminPage from './AdminPage'

interface User {
  id: string
  username: string
  role?: string
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 检查本地存储的登录状态
  useEffect(() => {
    const storedLoginState = localStorage.getItem('isLoggedIn')
    const storedUser = localStorage.getItem('currentUser')
    
    if (storedLoginState === 'true' && storedUser) {
      setIsLoggedIn(true)
      setCurrentUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (user: User) => {
    setIsLoggedIn(true)
    setCurrentUser(user)
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('currentUser')
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

  // 根据用户角色显示不同页面
  if (currentUser?.role === 'admin') {
    return <AdminPage onLogout={handleLogout} />
  }

  return <Dashboard onLogout={handleLogout} />
}
