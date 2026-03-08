'use client'

import { useState } from 'react'
import { Scale, Activity, TrendingUp, User, Lock, ChevronRight, UserPlus, ArrowLeft } from 'lucide-react'

interface User {
  id: string | number
  username: string
  role?: string
  token?: string
}

interface LoginPageProps {
  onLogin: (user: User) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isRegister) {
        // 注册验证
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致')
          setIsLoading(false)
          return
        }

        // 调用注册 API
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || '注册失败')
          setIsLoading(false)
          return
        }

        // 注册成功，自动切换到登录
        setIsRegister(false)
        setPassword('')
        setConfirmPassword('')
        setError('')
        alert('注册成功，请登录')
      } else {
        // 调用登录 API
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || '登录失败')
          setIsLoading(false)
          return
        }

        // 登录成功
        onLogin({ ...data.user, token: data.token })
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* 左侧欢迎信息 */}
        <div className="text-center lg:text-left space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-200 mb-4">
            <Scale className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 leading-tight">
            体重管理器
            <span className="block text-emerald-600 mt-2">Weight Tracker</span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-md mx-auto lg:mx-0">
            记录、追踪、分析您的体重变化，开启健康生活之旅
          </p>
          
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <Activity className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">记录体重</p>
            </div>
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <TrendingUp className="w-6 h-6 text-teal-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">趋势分析</p>
            </div>
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <Scale className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">BMI计算</p>
            </div>
          </div>
        </div>

        {/* 右侧表单 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 p-8 lg:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {isRegister ? '创建账户' : '欢迎回来'}
            </h2>
            <p className="text-slate-500">
              {isRegister ? '注册新账户开始管理体重' : '登录您的账户开始管理体重'}
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="用户名"
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="密码"
                required
                minLength={6}
              />
            </div>

            {/* 注册模式显示确认密码 */}
            {isRegister && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="确认密码"
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* 登录模式显示记住我和忘记密码 */}
            {!isRegister && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                  <span className="text-slate-600">记住我</span>
                </label>
                <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  忘记密码？
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  注册
                </>
              ) : (
                <>
                  登录
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* 切换登录/注册模式 */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400">
                {isRegister ? '已有账户？' : '还没有账户？'}
              </span>
            </div>
          </div>

          <button
            onClick={toggleMode}
            className="w-full py-3.5 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isRegister ? (
              <>
                <ArrowLeft className="w-4 h-4" />
                返回登录
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                注册新账户
              </>
            )}
          </button>

          {/* 游客访问 */}
          {!isRegister && (
            <button
              onClick={() => onLogin({ id: 'guest', username: '游客' })}
              className="w-full mt-4 py-3.5 text-slate-500 font-medium rounded-xl hover:text-slate-700 transition-all duration-200"
            >
              游客访问
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
