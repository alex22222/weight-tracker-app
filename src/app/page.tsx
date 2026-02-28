'use client'

import { useState } from 'react'
import LoginPage from './LoginPage'
import Dashboard from './Dashboard'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  return <Dashboard />
}