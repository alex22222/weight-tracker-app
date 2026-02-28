'use client'

import { useState } from 'react'
import { Scale, Activity, TrendingUp, User, Lock, ChevronRight } from 'lucide-react'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      onLogin()
    }, 800)
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

        {/* 右侧登录表单 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 p-8 lg:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">欢迎回来</h2>
            <p className="text-slate-500">登录您的账户开始管理体重</p>
          </div>

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
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                <span className="text-slate-600">记住我</span>
              </label>
              <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                忘记密码？
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  登录
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400">或</span>
            </div>
          </div>

          <button
            onClick={onLogin}
            className="w-full py-3.5 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-all duration-200"
          >
            游客访问
          </button>
        </div>
      </div>
    </div>
  )
}