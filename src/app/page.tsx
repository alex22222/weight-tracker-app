'use client'

import { useState, useEffect } from 'react'
import LoginPage from './LoginPage'
import Dashboard from './Dashboard'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 检查本地存储的登录状态
  useEffect(() => {
    const storedLoginState = localStorage.getItem('isLoggedIn')
    if (storedLoginState === 'true') {
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    setIsLoggedIn(true)
    localStorage.setItem('isLoggedIn', 'true')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('isLoggedIn')
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

  return <Dashboard onLogout={handleLogout} />
}
