'use client'

import { useState, useEffect } from 'react'
import { Shield, User, Lock, ChevronRight, Sparkles } from 'lucide-react'

interface LoginPageProps {
  onLogin: (username?: string, userId?: string, rememberMe?: boolean) => Promise<void> | void
  onError?: (msg: string) => void
}

// 浮动粒子背景组件
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 6 + 8,
    opacity: Math.random() * 0.4 + 0.1,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: '-20px',
            background: 'linear-gradient(135deg, rgba(249,115,22,0.6), rgba(239,68,68,0.4))',
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: `0 0 ${p.size * 3}px rgba(249,115,22,0.3)`,
          }}
        />
      ))}
    </div>
  )
}

// 网格背景
function GridBackground() {
  return (
    <div 
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
  )
}

export default function LoginPage({ onLogin, onError }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [focusField, setFocusField] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
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

      if (username !== 'admin') {
        setError('请使用管理员账户登录')
        if (onError) onError('请使用管理员账户登录')
        setIsLoading(false)
        return
      }

      onLogin(username, data.user.id, rememberMe)
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0e1a] flex items-center justify-center p-4">
      {/* 背景层 */}
      <GridBackground />
      <FloatingParticles />
      
      {/* 渐变光晕 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      {/* 主内容 */}
      <div className={`w-full max-w-md relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo区域 */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl blur-xl opacity-50 animate-pulse-slow" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 rounded-2xl shadow-2xl">
              <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            管理后台
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            ADMIN CONSOLE
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-orange-500/50" />
            <span className="text-xs text-orange-400/70 uppercase tracking-widest">习惯追踪</span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-orange-500/50" />
          </div>
        </div>

        {/* 登录卡片 */}
        <div className="relative">
          {/* 卡片光晕 */}
          <div className="absolute -inset-px bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-3xl blur-sm" />
          
          <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-2xl shadow-black/20 p-8 overflow-hidden">
            {/* 顶部装饰线 */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-red-500 rounded-full" />
              <h2 className="text-lg font-semibold text-white">管理员登录</h2>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-600" />
                <p className="text-red-400 text-sm font-medium pl-2">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 用户名输入 */}
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${focusField === 'username' ? 'bg-orange-500/5 ring-1 ring-orange-500/20' : ''}`} />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <User className={`h-5 w-5 transition-colors duration-300 ${focusField === 'username' ? 'text-orange-400' : 'text-slate-500'}`} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusField('username')}
                  onBlur={() => setFocusField(null)}
                  className="relative w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.06] transition-all duration-300"
                  placeholder="管理员用户名"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>

              {/* 密码输入 */}
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${focusField === 'password' ? 'bg-orange-500/5 ring-1 ring-orange-500/20' : ''}`} />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Lock className={`h-5 w-5 transition-colors duration-300 ${focusField === 'password' ? 'text-orange-400' : 'text-slate-500'}`} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField(null)}
                  className="relative w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.06] transition-all duration-300"
                  placeholder="密码"
                  required
                  minLength={6}
                />
              </div>

              {/* 记住我 */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-[18px] h-[18px] rounded border border-slate-600 bg-slate-800/50 peer-checked:bg-gradient-to-br peer-checked:from-orange-400 peer-checked:to-red-500 peer-checked:border-orange-400 transition-all duration-200 flex items-center justify-center">
                      {rememberMe && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-300 transition-colors">记住我（7天）</span>
                </label>
              </div>

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-3.5 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 text-white font-semibold rounded-xl overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      登录
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* 底部 */}
        <p className="text-center text-slate-600 text-xs mt-8 tracking-wide">
          © 2026 习惯追踪 · 管理员专用入口
        </p>
      </div>


    </div>
  )
}
