import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '习惯追踪 · 管理后台',
  description: '习惯追踪后台管理系统',
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