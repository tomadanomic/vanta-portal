'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/app/providers'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const { isDark, setIsDark } = useTheme()

  const handleLogin = (e) => {
    e.preventDefault()
    const correctPassword = process.env.NEXT_PUBLIC_PORTAL_PASSWORD

    if (password === correctPassword) {
      localStorage.setItem('portal_auth', password)
      router.push('/dashboard')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-black dark:to-slate-900 flex items-center justify-center px-4 transition-colors">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-300/20 to-transparent dark:from-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-slate-300/20 to-transparent dark:from-slate-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
            VANTA
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Admin Portal</p>
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-3 rounded-xl backdrop-blur-xl bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 hover:border-white/70 dark:hover:border-white/20 transition"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Portal Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-white/70 dark:focus:border-white/20 focus:bg-white/60 dark:focus:bg-white/10 transition"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 rounded-xl backdrop-blur-xl bg-red-100/40 dark:bg-red-900/40 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 hover:from-slate-800 hover:to-slate-700 dark:hover:from-slate-100 dark:hover:to-slate-300 text-white dark:text-black font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-8">
          VANTA Peptides © 2026
        </p>
      </div>
    </div>
  )
}
