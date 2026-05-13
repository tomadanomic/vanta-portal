'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import OrdersTab from '@/components/OrdersTab'
import ConversationsTab from '@/components/ConversationsTab'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
)

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('orders')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const auth = localStorage.getItem('vanta_authenticated')
    if (!auth) {
      router.push('/')
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('vanta_authenticated')
    router.push('/')
  }

  if (isLoading) return null

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-dark-secondary border-b border-dark-tertiary sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🧬 VANTA Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-400 hover:text-white text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-6 border-b border-dark-tertiary">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 font-medium text-sm ${
              activeTab === 'orders' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            📦 Orders
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`pb-4 font-medium text-sm ${
              activeTab === 'conversations' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            💬 Conversations
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'conversations' && <ConversationsTab />}
      </div>
    </div>
  )
}
