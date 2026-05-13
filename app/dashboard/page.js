'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import OrdersTab from '@/components/OrdersTab'
import ConversationsTab from '@/components/ConversationsTab'
import RevenueTab from '@/components/RevenueTab'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
)

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('orders')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verify auth on mount
    const checkAuth = async () => {
      const password = localStorage.getItem('portal_auth')
      if (!password) {
        window.location.href = '/'
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-gray-900 bg-gradient-to-b from-gray-950 to-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white tracking-tight">VANTA</h1>
              <p className="text-gray-500 text-sm mt-1">Peptides Admin Portal</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('portal_auth')
                window.location.href = '/'
              }}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-900 bg-black sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'orders', label: '📦 Orders', icon: 'orders' },
              { id: 'conversations', label: '💬 Conversations', icon: 'chat' },
              { id: 'revenue', label: '💰 Revenue', icon: 'cash' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'conversations' && <ConversationsTab />}
        {activeTab === 'revenue' && <RevenueTab />}
      </div>
    </div>
  )
}
