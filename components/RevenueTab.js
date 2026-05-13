'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

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

export default function RevenueTab() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const delivered = orders.filter(o => o.delivery_status === 'delivered')
  const pending = orders.filter(o => o.delivery_status === 'pending')

  const filteredOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at)
    if (startDate && new Date(startDate) > orderDate) return false
    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      if (endOfDay < orderDate) return false
    }
    return true
  })

  const filteredDelivered = filteredOrders.filter(o => o.delivery_status === 'delivered')
  const filteredPending = filteredOrders.filter(o => o.delivery_status === 'pending')

  const stats = {
    totalRevenue: filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    collectedCash: filteredDelivered.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    pendingCash: filteredPending.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    avgOrderValue: filteredOrders.length > 0 ? Math.round(filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / filteredOrders.length) : 0,
    totalOrders: filteredOrders.length
  }

  return (
    <div className="space-y-4 sm:space-y-8 w-full overflow-x-hidden">
      {/* Date Filters - Mobile Optimized */}
      <div className="rounded-lg sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-3 sm:p-6">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
          📅 Date
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Stats - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-6">
        {[
          { label: 'Total', value: `AED ${stats.totalRevenue}`, color: 'from-slate-500 to-slate-600' },
          { label: 'Collected', value: `AED ${stats.collectedCash}`, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Pending', value: `AED ${stats.pendingCash}`, color: 'from-amber-500 to-amber-600' },
          { label: 'Orders', value: stats.totalOrders, color: 'from-blue-500 to-blue-600' },
          { label: 'Avg', value: `AED ${stats.avgOrderValue}`, color: 'from-purple-500 to-purple-600' }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="rounded-lg sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-3 sm:p-6 overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 sm:mb-2 relative z-10 truncate">
              {stat.label}
            </p>
            <p className="text-sm sm:text-2xl font-semibold text-slate-900 dark:text-white relative z-10 break-words">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue by Product - Mobile Friendly */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Revenue by Product
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {Object.entries(
            filteredOrders.reduce((acc, order) => {
              const product = order.product_name
              acc[product] = (acc[product] || 0) + (order.total_amount || 0)
              return acc
            }, {})
          )
            .sort(([, a], [, b]) => b - a)
            .map(([product, revenue]) => (
              <div
                key={product}
                className="rounded-lg sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-3 sm:p-4 hover:border-white/70 dark:hover:border-white/20 transition"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="text-slate-900 dark:text-white font-medium text-xs sm:text-sm break-words flex-1">
                    {product}
                  </p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm flex-shrink-0">
                    AED {revenue}
                  </p>
                </div>
                <div className="h-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                    style={{ width: `${stats.totalRevenue > 0 ? (revenue / stats.totalRevenue) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Collections - Mobile Optimized */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Recent Collections
        </h3>
        <div className="space-y-2">
          {filteredDelivered.slice(0, 10).map(order => (
            <div
              key={order.id}
              className="flex justify-between items-start gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl backdrop-blur-xl bg-gradient-to-br from-white/30 to-white/10 dark:from-white/5 dark:to-white/0 border border-white/30 dark:border-white/10 hover:border-white/50 dark:hover:border-white/20 transition"
            >
              <div className="min-w-0 flex-1">
                <p className="text-slate-900 dark:text-white font-medium text-xs sm:text-sm truncate">
                  {order.customer_name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {order.product_name}
                </p>
              </div>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm flex-shrink-0">
                AED {order.total_amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
