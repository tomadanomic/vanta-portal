'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
)

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
    <div className="space-y-8">
      {/* Date Filters */}
      <div className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-6">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
          📅 Filter by Date
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          {(startDate || endDate) && (
            <div className="sm:col-span-2 flex items-end">
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Clear Dates
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats with Glass Effect */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { label: '💵 Cash Collected', value: `AED ${stats.collectedCash}`, subtext: `${delivered.length} delivered`, color: 'from-emerald-500 to-emerald-600' },
          { label: '⏳ Pending Cash', value: `AED ${stats.pendingCash}`, subtext: `${pending.length} pending`, color: 'from-amber-500 to-amber-600' },
          { label: '📊 Total Revenue', value: `AED ${stats.totalRevenue}`, subtext: `From ${stats.totalOrders} orders`, color: 'from-blue-500 to-blue-600' }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-8 overflow-hidden group hover:border-white/70 dark:hover:border-white/20 transition"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition`}></div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2 relative z-10">
              {stat.label}
            </p>
            <p className="text-5xl font-semibold text-slate-900 dark:text-white relative z-10">
              {stat.value}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 relative z-10">
              {stat.subtext}
            </p>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Avg Order Value', value: `AED ${stats.avgOrderValue}` },
          { label: 'Collection Rate', value: `${orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0}%` }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-6"
          >
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">
              {stat.label}
            </p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Cash Flow by Product */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Revenue by Product</h3>
        <div className="space-y-3">
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
                className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-4 hover:border-white/70 dark:hover:border-white/20 transition"
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="text-slate-900 dark:text-white font-medium">{product}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">AED {revenue}</p>
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

      {/* Recent Collections */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Collections</h3>
        <div className="space-y-2">
          {filteredDelivered.slice(0, 10).map(order => (
            <div
              key={order.id}
              className="flex justify-between items-center p-4 rounded-xl backdrop-blur-xl bg-gradient-to-br from-white/30 to-white/10 dark:from-white/5 dark:to-white/0 border border-white/30 dark:border-white/10 hover:border-white/50 dark:hover:border-white/20 transition"
            >
              <div>
                <p className="text-slate-900 dark:text-white font-medium">{order.customer_name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{order.product_name}</p>
              </div>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">AED {order.total_amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
