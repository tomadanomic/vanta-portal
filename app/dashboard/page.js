'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import OrdersTab from '@/components/OrdersTab'
import ConversationsTab from '@/components/ConversationsTab'
import RevenueTab from '@/components/RevenueTab'

export const dynamic = 'force-dynamic'

let supabase = null

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
      process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
    )
  }
  return supabase
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('orders')
  const [unreadCount, setUnreadCount] = useState(0)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadUnreadCount() {
    try {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('conversations')
        .select('telegram_user_id')

      if (error) throw error

      const unanswered = new Set()
      const answered = new Set()

      data?.forEach(conv => {
        if (conv.event_type === 'ADMIN_REPLY') {
          answered.add(conv.telegram_user_id)
        }
      })

      data?.forEach(conv => {
        if (conv.event_type === 'CUSTOMER_QUESTION' && !answered.has(conv.telegram_user_id)) {
          unanswered.add(conv.telegram_user_id)
        }
      })

      setUnreadCount(unanswered.size)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF7]'}`}>
      {/* Top Navigation */}
      <div className={`border-b ${isDark ? 'border-[#2A2A2A] bg-[#0F0F0F]' : 'border-[#ECECEC] bg-white'} sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className={`${isDark ? 'text-white' : 'text-[#0F1729]'} font-700 text-2xl leading-none`}>
                VANTA
              </div>
              <div className={`${isDark ? 'text-[#8A8A8E]' : 'text-[#545458]'} text-xs font-500`}>
                Admin Portal
              </div>
            </div>

            {/* Tab Pills */}
            <div className="flex gap-2">
              {[
                { id: 'orders', label: 'Orders' },
                { id: 'conversations', label: 'Conversations' },
                { id: 'revenue', label: 'Revenue' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-[10px] text-sm font-600 transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#0F1729] text-white'
                      : isDark
                      ? 'bg-transparent text-[#545458] hover:bg-[#1A1A1A]'
                      : 'bg-transparent text-[#545458] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'conversations' && unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#B06000] text-white text-xs font-700">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`px-3 py-2 rounded-[10px] text-sm font-600 transition-all ${
                isDark
                  ? 'bg-[#1A1A1A] text-[#8A8A8E] hover:bg-[#2A2A2A]'
                  : 'bg-[#F5F5F5] text-[#545458] hover:bg-[#ECECEC]'
              }`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'orders' && <OrdersTab setActiveTab={setActiveTab} />}
        {activeTab === 'conversations' && <ConversationsTab />}
        {activeTab === 'revenue' && <RevenueTab />}
      </div>
    </div>
  )
}
