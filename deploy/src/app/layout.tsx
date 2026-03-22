import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '体重管理器 - Weight Tracker',
  description: '记录、追踪、分析您的体重变化',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}