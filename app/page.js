'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

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
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-white mb-2">VANTA</h1>
          <p className="text-gray-500">Admin Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
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
              className="w-full px-4 py-3 rounded-lg bg-gray-950 border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-700 transition"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-900/20 border border-red-900/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          VANTA Peptides © 2026
        </p>
      </div>
    </div>
  )
}
