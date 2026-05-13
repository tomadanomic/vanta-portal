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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('orders')
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const { isDark, setIsDark } = useTheme()

  useEffect(() => {
    const checkAuth = async () => {
      const password = localStorage.getItem('portal_auth')
      if (!password) {
        window.location.href = '/'
      }
      setIsLoading(false)
    }
    checkAuth()
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadUnreadCount() {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('telegram_user_id, event_type')
        .eq('event_type', 'CUSTOMER_QUESTION')
        .order('created_at', { ascending: false })

      if (error) throw error

      const customerQuestions = data?.filter(m => m.event_type === 'CUSTOMER_QUESTION') || []
      const answered = new Set()

      const allData = await supabase
        .from('conversations')
        .select('telegram_user_id, event_type')
        .eq('event_type', 'ADMIN_REPLY')

      allData.data?.forEach(m => {
        answered.add(m.telegram_user_id)
      })

      const unanswered = customerQuestions.filter(m => !answered.has(m.telegram_user_id))
      setUnreadCount(unanswered.length)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-slate-300 dark:border-slate-700 border-t-slate-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-black dark:to-slate-900 transition-colors">
      {/* Header with Glass Effect */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                VANTA
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Admin Portal</p>
            </div>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-400">{unreadCount} unanswered</span>
                </div>
              )}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('portal_auth')
                  window.location.href = '/'
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Glass Effect */}
      <div className="sticky top-20 z-40 backdrop-blur-xl bg-white/50 dark:bg-slate-950/50 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'orders', label: '📦 Orders' },
              { id: 'conversations', label: '💬 Conversations', badge: unreadCount },
              { id: 'revenue', label: '💰 Revenue' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium transition whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content with Glass Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'orders' && <OrdersTab setActiveTab={setActiveTab} />}
        {activeTab === 'conversations' && <ConversationsTab />}
        {activeTab === 'revenue' && <RevenueTab />}
      </div>
    </div>
  )
}
