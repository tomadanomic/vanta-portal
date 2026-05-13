'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import OrdersTab from '@/components/OrdersTab'
import ConversationsTab from '@/components/ConversationsTab'
import RevenueTab from '@/components/RevenueTab'
import { useTheme } from '@/app/providers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
)

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('orders')
  const [unreadCount, setUnreadCount] = useState(0)
  const { isDark, setIsDark } = useTheme()

  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadUnreadCount() {
    try {
      const { data, error } = await supabase
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-black dark:to-slate-900 transition-colors">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent truncate">
                VANTA
              </h1>
              <p className="hidden sm:block text-slate-500 dark:text-slate-400 text-sm">Admin Portal</p>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 sm:p-3 rounded-lg backdrop-blur-xl bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 hover:border-white/70 dark:hover:border-white/20 transition flex-shrink-0"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Tab Navigation - Mobile Optimized */}
          <div className="flex gap-1 sm:gap-8 mt-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: 'orders', label: '📦 Orders' },
              { id: 'conversations', label: '💬 Chat', badge: unreadCount > 0 ? unreadCount : null },
              { id: 'revenue', label: '💰 Revenue' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold whitespace-nowrap flex items-center gap-2 relative transition ${
                  activeTab === tab.id
                    ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
                    : 'text-slate-600 dark:text-slate-400 border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="flex items-center justify-center min-w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Safe */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'orders' && <OrdersTab setActiveTab={setActiveTab} />}
        {activeTab === 'conversations' && <ConversationsTab />}
        {activeTab === 'revenue' && <RevenueTab />}
      </div>
    </div>
  )
}
